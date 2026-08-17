import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  RefreshCw,
  Check,
  X,
  Move,
  Maximize2,
  Minimize2
} from 'lucide-react'

// Standard output export resolution (512x512 high quality)
const EXPORT_SIZE = 512

export default function EditPhotoModal({
  show,
  imageSrc,
  fileName = '',
  initialState = null,
  onCancel,
  onSave
}) {
  const viewportRef = useRef(null)
  const imageRef = useRef(null)
  const previewCanvasRef = useRef(null)

  // Core Transformation States
  const [mode, setMode] = useState('fill') // 'fill' | 'fit'
  const [zoom, setZoom] = useState(1.0) // 1.0 to 4.0
  const [rotation, setRotation] = useState(0) // 0, 90, 180, 270
  const [tx, setTx] = useState(0)
  const [ty, setTy] = useState(0)

  // Viewport & Image Dimension States
  const [viewportSize, setViewportSize] = useState(240)
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 })
  const [isLoaded, setIsLoaded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Drag tracking refs
  const dragStartRef = useRef({ startX: 0, startY: 0, startTx: 0, startTy: 0 })
  const pinchStartRef = useRef({ dist: 0, startZoom: 1.0 })

  // Measure rendered viewport dynamically for perfect responsiveness
  const updateViewportMeasurement = useCallback(() => {
    if (viewportRef.current) {
      const rect = viewportRef.current.getBoundingClientRect()
      const size = Math.min(rect.width, rect.height)
      if (size > 50) {
        setViewportSize(size)
      }
    }
  }, [])

  useEffect(() => {
    if (!show) return
    updateViewportMeasurement()
    window.addEventListener('resize', updateViewportMeasurement)
    return () => window.removeEventListener('resize', updateViewportMeasurement)
  }, [show, updateViewportMeasurement])

  // 1. Calculate Base Scales and Clamped Bounds
  const getTransformParams = useCallback(
    (currMode = mode, currZoom = zoom, currRot = rotation) => {
      if (!imgDimensions.width || !imgDimensions.height) {
        return {
          fitBaseScale: 1,
          fillBaseScale: 1,
          baseScale: 1,
          currentScale: 1,
          renderedW: viewportSize,
          renderedH: viewportSize,
          maxTx: 0,
          maxTy: 0,
          effW: viewportSize,
          effH: viewportSize
        }
      }

      const isRot90 = currRot === 90 || currRot === 270
      const effW = isRot90 ? imgDimensions.height : imgDimensions.width
      const effH = isRot90 ? imgDimensions.width : imgDimensions.height

      // Scale factors relative to viewport
      const fitBaseScale = Math.min(viewportSize / effW, viewportSize / effH)
      const fillBaseScale = Math.max(viewportSize / effW, viewportSize / effH)

      const baseScale = currMode === 'fit' ? fitBaseScale : fillBaseScale
      const currentScale = baseScale * currZoom

      const renderedW = effW * currentScale
      const renderedH = effH * currentScale

      // Clamping bounds calculation:
      // In FILL mode (or when rendered dimension >= viewport), image must cover viewport without gaps.
      // In FIT mode (or when rendered dimension < viewport), lock translation to 0 to keep centered.
      const maxTx = renderedW >= viewportSize ? (renderedW - viewportSize) / 2 : 0
      const maxTy = renderedH >= viewportSize ? (renderedH - viewportSize) / 2 : 0

      return {
        fitBaseScale,
        fillBaseScale,
        baseScale,
        currentScale,
        renderedW,
        renderedH,
        maxTx,
        maxTy,
        effW,
        effH,
        isRot90
      }
    },
    [imgDimensions, viewportSize, mode, zoom, rotation]
  )

  // Clamp translation within valid bounds
  const clampTranslation = useCallback(
    (newTx, newTy, currMode = mode, currZoom = zoom, currRot = rotation) => {
      const { maxTx, maxTy } = getTransformParams(currMode, currZoom, currRot)
      const clampedX = Math.min(maxTx, Math.max(-maxTx, newTx))
      const clampedY = Math.min(maxTy, Math.max(-maxTy, newTy))
      return { clampedX, clampedY }
    },
    [getTransformParams, mode, zoom, rotation]
  )

  // 2. Initialize or restore editor state when image opens
  useEffect(() => {
    if (show && imageSrc) {
      setIsLoaded(false)

      if (initialState) {
        setMode(initialState.mode || 'fill')
        setZoom(initialState.zoom || 1.0)
        setRotation(initialState.rotation || 0)
        setTx(initialState.tx || 0)
        setTy(initialState.ty || 0)
      } else {
        setMode('fill')
        setZoom(1.0)
        setRotation(0)
        setTx(0)
        setTy(0)
      }

      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        setImgDimensions({ width: img.naturalWidth, height: img.naturalHeight })
        setIsLoaded(true)
        setTimeout(updateViewportMeasurement, 50)
      }
      img.src = imageSrc
    }
  }, [show, imageSrc, initialState, updateViewportMeasurement])

  // Re-clamp offsets whenever mode, zoom, or rotation changes
  useEffect(() => {
    if (!isLoaded) return
    const { clampedX, clampedY } = clampTranslation(tx, ty, mode, zoom, rotation)
    if (clampedX !== tx || clampedY !== ty) {
      setTx(clampedX)
      setTy(clampedY)
    }
  }, [mode, zoom, rotation, isLoaded])

  // 3. Pointer Dragging (Pan)
  const handlePointerDown = (e) => {
    if (!isLoaded) return
    e.preventDefault()

    setIsDragging(true)
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startTx: tx,
      startTy: ty
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch (err) {
      /* ignore */
    }
  }

  const handlePointerMove = (e) => {
    if (!isDragging || !isLoaded) return
    e.preventDefault()

    const dx = e.clientX - dragStartRef.current.startX
    const dy = e.clientY - dragStartRef.current.startY

    const rawTx = dragStartRef.current.startTx + dx
    const rawTy = dragStartRef.current.startTy + dy

    const { clampedX, clampedY } = clampTranslation(rawTx, rawTy)
    setTx(clampedX)
    setTy(clampedY)
  }

  const handlePointerUp = (e) => {
    if (!isDragging) return
    setIsDragging(false)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch (err) {
      /* ignore */
    }
  }

  // 4. Mouse Wheel Zoom
  const handleWheel = (e) => {
    if (!isLoaded) return
    e.preventDefault()

    const delta = e.deltaY < 0 ? 0.08 : -0.08
    const newZoom = Math.min(4.0, Math.max(1.0, zoom + delta))
    setZoom(parseFloat(newZoom.toFixed(2)))
  }

  // 5. Touch Pinch Zoom
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0]
      const t2 = e.touches[1]
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
      pinchStartRef.current = { dist, startZoom: zoom }
    }
  }

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && pinchStartRef.current.dist > 0) {
      e.preventDefault()
      const t1 = e.touches[0]
      const t2 = e.touches[1]
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
      const scaleFactor = dist / pinchStartRef.current.dist
      const newZoom = Math.min(4.0, Math.max(1.0, pinchStartRef.current.startZoom * scaleFactor))
      setZoom(parseFloat(newZoom.toFixed(2)))
    }
  }

  // 6. Action Handlers
  const handleModeSelect = (newMode) => {
    if (newMode === mode) return
    setMode(newMode)
    // Smoothly reset translation to 0 when toggling mode
    const { clampedX, clampedY } = clampTranslation(0, 0, newMode, zoom, rotation)
    setTx(clampedX)
    setTy(clampedY)
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(4.0, parseFloat((prev + 0.15).toFixed(2))))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(1.0, parseFloat((prev - 0.15).toFixed(2))))
  }

  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90 + 360) % 360)
  }

  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleReset = () => {
    setMode('fill')
    setZoom(1.0)
    setRotation(0)
    setTx(0)
    setTy(0)
  }

  // 7. Live Real-Time Circular Thumbnail Canvas Update
  const updateLivePreview = useCallback(() => {
    const canvas = previewCanvasRef.current
    if (!canvas || !isLoaded || !imageRef.current) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = 110
    canvas.width = size
    canvas.height = size

    ctx.clearRect(0, 0, size, size)

    // Clip preview to circular avatar frame
    ctx.save()
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
    ctx.clip()

    const { currentScale, isRot90, effW, effH } = getTransformParams(mode, zoom, rotation)

    const displayW = effW * currentScale
    const displayH = effH * currentScale

    const ratio = size / viewportSize
    const canvasDrawW = displayW * ratio
    const canvasDrawH = displayH * ratio
    const canvasTx = tx * ratio
    const canvasTy = ty * ratio

    ctx.translate(size / 2 + canvasTx, size / 2 + canvasTy)
    ctx.rotate((rotation * Math.PI) / 180)

    const drawW = isRot90 ? canvasDrawH : canvasDrawW
    const drawH = isRot90 ? canvasDrawW : canvasDrawH

    ctx.drawImage(imageRef.current, -drawW / 2, -drawH / 2, drawW, drawH)
    ctx.restore()
  }, [isLoaded, mode, zoom, rotation, tx, ty, viewportSize, getTransformParams])

  useEffect(() => {
    updateLivePreview()
  }, [updateLivePreview])

  // 8. Export High-Res Cropped Canvas
  const handleSaveCrop = async () => {
    if (!isLoaded || !imageRef.current) return
    setIsExporting(true)

    try {
      const croppedDataUrl = await new Promise((resolve) => {
        const canvas = document.createElement('canvas')
        canvas.width = EXPORT_SIZE
        canvas.height = EXPORT_SIZE
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          resolve(imageSrc)
          return
        }

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.clearRect(0, 0, EXPORT_SIZE, EXPORT_SIZE)

        const { currentScale, isRot90, effW, effH } = getTransformParams(mode, zoom, rotation)

        const displayW = effW * currentScale
        const displayH = effH * currentScale

        const ratio = EXPORT_SIZE / viewportSize
        const canvasDrawW = displayW * ratio
        const canvasDrawH = displayH * ratio
        const canvasTx = tx * ratio
        const canvasTy = ty * ratio

        ctx.save()
        ctx.translate(EXPORT_SIZE / 2 + canvasTx, EXPORT_SIZE / 2 + canvasTy)
        ctx.rotate((rotation * Math.PI) / 180)

        const drawW = isRot90 ? canvasDrawH : canvasDrawW
        const drawH = isRot90 ? canvasDrawW : canvasDrawH

        ctx.drawImage(imageRef.current, -drawW / 2, -drawH / 2, drawW, drawH)
        ctx.restore()

        const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
        resolve(dataUrl)
      })

      const editorState = {
        mode,
        zoom,
        rotation,
        tx,
        ty,
        rawImageSrc: imageSrc
      }

      onSave(croppedDataUrl, editorState)
    } catch (err) {
      console.error('[Image Editor Export Error]', err)
      onSave(imageSrc, null)
    } finally {
      setIsExporting(false)
    }
  }

  // Keyboard Navigation (Esc to close, Enter to save)
  useEffect(() => {
    if (!show) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      } else if (e.key === 'Enter' && !isExporting) {
        e.preventDefault()
        handleSaveCrop()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [show, isExporting, onCancel, handleSaveCrop])

  if (!show) return null

  // Compute CSS sizing for rendered image inside crop viewport
  const { currentScale, isRot90, effW, effH } = getTransformParams(mode, zoom, rotation)
  const renderedW = effW * currentScale
  const renderedH = effH * currentScale

  const imgElemW = isRot90 ? renderedH : renderedW
  const imgElemH = isRot90 ? renderedW : renderedH

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: 16,
        boxSizing: 'border-box',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      {/* Offscreen HTML Image element used for canvas rendering */}
      {imageSrc && (
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Source"
          crossOrigin="anonymous"
          style={{ display: 'none' }}
          onLoad={() => setIsLoaded(true)}
        />
      )}

      {/* Main Editor Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 24,
          width: '100%',
          maxWidth: 620,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'editorModalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <style>{`
          @keyframes editorModalPop {
            from { opacity: 0; transform: translateY(18px) scale(0.97); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .editor-btn {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            color: #334155;
            border-radius: 10px;
            padding: 8px 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
            user-select: none;
          }
          .editor-btn:hover {
            background: #F1F5F9;
            border-color: #CBD5E1;
            color: #0F172A;
          }
          .editor-btn:active {
            transform: scale(0.96);
          }
          .editor-btn-active {
            background: #4F46E5 !important;
            border-color: #4F46E5 !important;
            color: #FFFFFF !important;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
          }
          .editor-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #4F46E5;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(79, 70, 229, 0.4);
            transition: transform 0.15s ease;
          }
          .editor-slider::-webkit-slider-thumb:hover {
            transform: scale(1.18);
          }
        `}</style>

        {/* 1. Modal Header */}
        <div
          style={{
            padding: '20px 24px 14px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>
              Profile Image Editor
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#64748B', fontWeight: 500 }}>
              Adjust Fit, Fill, Zoom, and Pan framing for your avatar
            </p>
          </div>

          <button
            onClick={onCancel}
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '50%',
              width: 34,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748B',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#E2E8F0')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#F1F5F9')}
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. Mode Selector Bar (FIT vs FILL) */}
        <div
          style={{
            padding: '12px 24px 4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Framing Mode:
            </span>

            {/* FILL Button */}
            <button
              className={`editor-btn ${mode === 'fill' ? 'editor-btn-active' : ''}`}
              onClick={() => handleModeSelect('fill')}
              title="Scale image to cover profile picture container completely"
            >
              <Maximize2 size={15} />
              <span>FILL</span>
            </button>

            {/* FIT Button */}
            <button
              className={`editor-btn ${mode === 'fit' ? 'editor-btn-active' : ''}`}
              onClick={() => handleModeSelect('fit')}
              title="Display complete image inside container without cropping"
            >
              <Minimize2 size={15} />
              <span>FIT</span>
            </button>
          </div>

          {fileName && (
            <span
              style={{
                fontSize: '0.75rem',
                color: '#64748B',
                fontWeight: 600,
                maxWidth: 160,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {fileName}
            </span>
          )}
        </div>

        {/* 3. Interactive Crop Viewport & Live Preview Panel */}
        <div
          style={{
            padding: '12px 24px 16px',
            display: 'flex',
            gap: 24,
            alignItems: 'center'
          }}
        >
          {/* Main Viewport Container */}
          <div
            ref={viewportRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            style={{
              flexGrow: 1,
              height: 310,
              backgroundColor: mode === 'fit' ? '#0F172A' : '#0B0F19',
              borderRadius: 20,
              position: 'relative',
              overflow: 'hidden',
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
              touchAction: 'none',
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.45)'
            }}
          >
            {/* Draggable & Scaled Image Element */}
            {isLoaded && (
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) rotate(${rotation}deg)`,
                  width: imgElemW,
                  height: imgElemH,
                  transition: isDragging ? 'none' : 'transform 0.12s cubic-bezier(0.1, 1, 0.1, 1)'
                }}
              >
                <img
                  src={imageSrc}
                  alt="Editor Crop View"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    pointerEvents: 'none',
                    userSelect: 'none'
                  }}
                />
              </div>
            )}

            {/* Dark Mask Overlay Outside Crop Frame */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `radial-gradient(circle ${viewportSize / 2}px at 50% 50%, transparent 99%, rgba(15, 23, 42, 0.76) 100%)`,
                pointerEvents: 'none'
              }}
            />

            {/* Circular Crop Guideline Outline */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: viewportSize,
                height: viewportSize,
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                border: '2px solid rgba(255, 255, 255, 0.92)',
                boxShadow: '0 0 0 1px rgba(79, 70, 229, 0.4), 0 0 24px rgba(0, 0, 0, 0.4)',
                pointerEvents: 'none',
                boxSizing: 'border-box'
              }}
            />

            {/* Center Drag Icon Hint */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'rgba(255, 255, 255, 0.4)',
                pointerEvents: 'none',
                display: isDragging ? 'none' : 'flex'
              }}
            >
              <Move size={22} />
            </div>
          </div>

          {/* Live Preview Side Column */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              minWidth: 110
            }}
          >
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Live Preview
            </span>

            {/* Real-time 110px Circular Preview Canvas */}
            <div
              style={{
                width: 110,
                height: 110,
                borderRadius: '50%',
                overflow: 'hidden',
                border: '3.5px solid #4F46E5',
                boxShadow: '0 8px 24px rgba(79, 70, 229, 0.28)',
                background: '#F1F5F9'
              }}
            >
              <canvas ref={previewCanvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
            </div>

            <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>
              Profile Avatar
            </span>
          </div>
        </div>

        {/* 4. Controls Toolbar (Zoom, Rotate, Reset) */}
        <div
          style={{
            padding: '14px 24px',
            background: '#F8FAFC',
            borderTop: '1px solid #F1F5F9',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}
        >
          {/* Zoom Slider Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', minWidth: 44 }}>
              Zoom
            </span>

            <button className="editor-btn" onClick={handleZoomOut} title="Zoom Out">
              <ZoomOut size={16} />
            </button>

            <input
              type="range"
              min="1.0"
              max="4.0"
              step="0.02"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="editor-slider"
              style={{
                flexGrow: 1,
                height: 6,
                borderRadius: 3,
                outline: 'none',
                background: `linear-gradient(to right, #4F46E5 0%, #4F46E5 ${((zoom - 1.0) / 3.0) * 100}%, #E2E8F0 ${((zoom - 1.0) / 3.0) * 100}%, #E2E8F0 100%)`,
                cursor: 'pointer'
              }}
            />

            <button className="editor-btn" onClick={handleZoomIn} title="Zoom In">
              <ZoomIn size={16} />
            </button>

            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#4F46E5', minWidth: 44, textAlign: 'right' }}>
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Rotation & Reset Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginRight: 2 }}>
                Rotate:
              </span>

              <button className="editor-btn" onClick={handleRotateLeft} title="Rotate Left 90°">
                <RotateCcw size={15} />
                <span>-90°</span>
              </button>

              <button className="editor-btn" onClick={handleRotateRight} title="Rotate Right 90°">
                <RotateCw size={15} />
                <span>+90°</span>
              </button>
            </div>

            <button
              className="editor-btn"
              onClick={handleReset}
              title="Reset to default Fill framing"
              style={{ color: '#DC2626', borderColor: '#FCA5A5', background: '#FEF2F2' }}
            >
              <RefreshCw size={14} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* 5. Modal Footer Action Buttons */}
        <div
          style={{
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12
          }}
        >
          <button
            onClick={onCancel}
            disabled={isExporting}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748B',
              fontSize: '0.92rem',
              fontWeight: 700,
              padding: '10px 20px',
              borderRadius: 10,
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#0F172A')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
          >
            Cancel
          </button>

          <button
            onClick={handleSaveCrop}
            disabled={isExporting || !isLoaded}
            style={{
              background: 'linear-gradient(135deg, #4F46E5, #6366F1)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 12,
              fontSize: '0.94rem',
              fontWeight: 700,
              padding: '10px 26px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: isExporting ? 'wait' : 'pointer',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
              transition: 'transform 0.15s ease, boxShadow 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (!isExporting) e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              if (!isExporting) e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            {isExporting ? (
              <span>Saving Photo...</span>
            ) : (
              <>
                <Check size={18} />
                <span>Save Profile Photo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
