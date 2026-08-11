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
  Crop,
  Image as ImageIcon
} from 'lucide-react'

const CROP_SIZE = 220 // Diameter of circular crop viewport in pixels
const EXPORT_SIZE = 512 // Resolution of output canvas export (512x512)

export default function EditPhotoModal({
  show,
  imageSrc,
  fileName = '',
  onCancel,
  onSave
}) {
  const containerRef = useRef(null)
  const imageRef = useRef(null)
  const previewCanvasRef = useRef(null)

  // Transform States
  const [scale, setScale] = useState(1.0)
  const [rotation, setRotation] = useState(0) // 0, 90, 180, 270
  const [tx, setTx] = useState(0)
  const [ty, setTy] = useState(0)

  // Image Dimensions & Status
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 })
  const [isLoaded, setIsLoaded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Drag tracking ref to prevent stutters
  const dragStartRef = useRef({ startX: 0, startY: 0, startTx: 0, startTy: 0 })

  // 1. Calculate Maximum Pan Bounds to keep crop circle covered 100%
  const getBounds = useCallback(
    (currScale = scale, currRot = rotation) => {
      if (!imgDimensions.width || !imgDimensions.height) {
        return { maxTx: 0, maxTy: 0, baseScale: 1 }
      }

      const isRot90 = currRot === 90 || currRot === 270
      const effW = isRot90 ? imgDimensions.height : imgDimensions.width
      const effH = isRot90 ? imgDimensions.width : imgDimensions.height

      // Scale factor to make image cover crop viewport at scale = 1.0
      const baseScale = Math.max(CROP_SIZE / effW, CROP_SIZE / effH)
      const renderedW = effW * baseScale * currScale
      const renderedH = effH * baseScale * currScale

      const maxTx = Math.max(0, (renderedW - CROP_SIZE) / 2)
      const maxTy = Math.max(0, (renderedH - CROP_SIZE) / 2)

      return { maxTx, maxTy, baseScale, renderedW, renderedH }
    },
    [imgDimensions, scale, rotation]
  )

  // Clamp translation within valid bounds
  const clampOffsets = useCallback(
    (newTx, newTy, currScale = scale, currRot = rotation) => {
      const { maxTx, maxTy } = getBounds(currScale, currRot)
      const clampedX = Math.min(maxTx, Math.max(-maxTx, newTx))
      const clampedY = Math.min(maxTy, Math.max(-maxTy, newTy))
      return { clampedX, clampedY }
    },
    [getBounds, scale, rotation]
  )

  // 2. Reset editor states when a new image is loaded or modal opens
  useEffect(() => {
    if (show && imageSrc) {
      setScale(1.0)
      setRotation(0)
      setTx(0)
      setTy(0)
      setIsLoaded(false)

      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        setImgDimensions({ width: img.naturalWidth, height: img.naturalHeight })
        setIsLoaded(true)
      }
      img.src = imageSrc
    }
  }, [show, imageSrc])

  // Adjust offsets when scale or rotation changes to maintain boundary constraints
  useEffect(() => {
    if (!isLoaded) return
    const { clampedX, clampedY } = clampOffsets(tx, ty, scale, rotation)
    if (clampedX !== tx || clampedY !== ty) {
      setTx(clampedX)
      setTy(clampedY)
    }
  }, [scale, rotation, isLoaded])

  // 3. Pointer Drag Event Handlers (Pan)
  const handlePointerDown = (e) => {
    if (!isLoaded) return
    e.preventDefault()
    e.stopPropagation()

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

    const { clampedX, clampedY } = clampOffsets(rawTx, rawTy)
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

  // 4. Mouse Wheel Zoom Handler
  const handleWheel = (e) => {
    if (!isLoaded) return
    e.preventDefault()

    const zoomStep = 0.08
    const delta = e.deltaY < 0 ? zoomStep : -zoomStep
    const newScale = Math.min(3.5, Math.max(1.0, scale + delta))

    setScale(parseFloat(newScale.toFixed(2)))
  }

  // 5. Control Button Actions
  const handleZoomIn = () => {
    setScale((prev) => Math.min(3.5, parseFloat((prev + 0.15).toFixed(2))))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(1.0, parseFloat((prev - 0.15).toFixed(2))))
  }

  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90 + 360) % 360)
  }

  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleReset = () => {
    setScale(1.0)
    setRotation(0)
    setTx(0)
    setTy(0)
  }

  // 6. Real-time Live Circular Preview Rendering
  const updateLivePreview = useCallback(() => {
    const canvas = previewCanvasRef.current
    if (!canvas || !isLoaded || !imageRef.current) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = 100
    canvas.width = size
    canvas.height = size

    ctx.clearRect(0, 0, size, size)

    // Clip to circle
    ctx.save()
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
    ctx.clip()

    const isRot90 = rotation === 90 || rotation === 270
    const effW = isRot90 ? imgDimensions.height : imgDimensions.width
    const effH = isRot90 ? imgDimensions.width : imgDimensions.height

    const { baseScale } = getBounds(scale, rotation)
    const displayW = effW * baseScale * scale
    const displayH = effH * baseScale * scale

    const ratio = size / CROP_SIZE
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
  }, [isLoaded, scale, rotation, tx, ty, imgDimensions, getBounds])

  useEffect(() => {
    updateLivePreview()
  }, [updateLivePreview])

  // 7. High-Res Canvas Crop Export
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

        const isRot90 = rotation === 90 || rotation === 270
        const effW = isRot90 ? imgDimensions.height : imgDimensions.width
        const effH = isRot90 ? imgDimensions.width : imgDimensions.height

        const { baseScale } = getBounds(scale, rotation)
        const displayW = effW * baseScale * scale
        const displayH = effH * baseScale * scale

        const ratio = EXPORT_SIZE / CROP_SIZE
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

        const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
        resolve(dataUrl)
      })

      onSave(croppedDataUrl)
    } catch (err) {
      console.error('[Image Editor Export Error]', err)
      onSave(imageSrc)
    } finally {
      setIsExporting(false)
    }
  }

  // 8. Keyboard Accessibility (Esc = Cancel, Enter = Save)
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

  // Compute CSS image display styles for viewport
  const { baseScale } = getBounds(scale, rotation)
  const isRot90 = rotation === 90 || rotation === 270
  const effW = isRot90 ? imgDimensions.height : imgDimensions.width
  const effH = isRot90 ? imgDimensions.width : imgDimensions.height

  const renderedW = effW * baseScale * scale
  const renderedH = effH * baseScale * scale

  // Size passed to img element before CSS rotation
  const imgElemW = isRot90 ? renderedH : renderedW
  const imgElemH = isRot90 ? renderedW : renderedH

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: 20,
        boxSizing: 'border-box',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      {/* Hidden image element used for canvas rendering */}
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

      {/* Main Modal Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 24,
          width: '100%',
          maxWidth: 580,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <style>{`
          @keyframes modalSlideUp {
            from { opacity: 0; transform: translateY(16px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .editor-tool-btn {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            color: #334155;
            border-radius: 10px;
            padding: 8px 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            font-size: 0.82rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
            user-select: none;
          }
          .editor-tool-btn:hover {
            background: #F1F5F9;
            border-color: #CBD5E1;
            color: #0F172A;
          }
          .editor-tool-btn:active {
            transform: scale(0.96);
          }
          .editor-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #4F46E5;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(79, 70, 229, 0.4);
            transition: transform 0.15s ease;
          }
          .editor-slider::-webkit-slider-thumb:hover {
            transform: scale(1.15);
          }
        `}</style>

        {/* 1. Modal Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
              Crop & Position Photo
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748B' }}>
              Drag image to adjust framing within circular profile frame
            </p>
          </div>

          {fileName && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#EEF2FF',
                color: '#4F46E5',
                padding: '4px 10px',
                borderRadius: 8,
                fontSize: '0.75rem',
                fontWeight: 600,
                maxWidth: 160,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              <ImageIcon size={14} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{fileName}</span>
            </div>
          )}
        </div>

        {/* 2. Interactive Crop Viewport & Live Circular Preview */}
        <div
          style={{
            padding: '20px 24px 16px',
            display: 'flex',
            gap: 20,
            alignItems: 'center'
          }}
        >
          {/* Main Interactive Viewport Box */}
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
            style={{
              flexGrow: 1,
              height: 300,
              backgroundColor: '#0F172A',
              borderRadius: 16,
              position: 'relative',
              overflow: 'hidden',
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
              touchAction: 'none',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4)'
            }}
          >
            {/* Draggable Image Element */}
            {isLoaded && (
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) rotate(${rotation}deg)`,
                  width: imgElemW,
                  height: imgElemH,
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                }}
              >
                <img
                  src={imageSrc}
                  alt="Editor View"
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

            {/* Dark Vignette Overlay Mask (Outside Circular Crop Region) */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `radial-gradient(circle ${CROP_SIZE / 2}px at 50% 50%, transparent 99%, rgba(15, 23, 42, 0.75) 100%)`,
                pointerEvents: 'none'
              }}
            />

            {/* Circular Crop Frame Guide Outline */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: CROP_SIZE,
                height: CROP_SIZE,
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                border: '2px solid rgba(255, 255, 255, 0.9)',
                boxShadow: '0 0 0 1px rgba(79, 70, 229, 0.4), 0 0 20px rgba(0, 0, 0, 0.3)',
                pointerEvents: 'none',
                boxSizing: 'border-box'
              }}
            />

            {/* Center Crosshair Hint */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'rgba(255, 255, 255, 0.35)',
                pointerEvents: 'none',
                display: isDragging ? 'none' : 'flex'
              }}
            >
              <Move size={20} />
            </div>
          </div>

          {/* Side Panel: Live Circular Preview Badge */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              minWidth: 100
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Preview
            </div>

            {/* 100px Circular Live Canvas */}
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                overflow: 'hidden',
                border: '3px solid #6366F1',
                boxShadow: '0 8px 20px rgba(99, 102, 241, 0.25)',
                background: '#F1F5F9'
              }}
            >
              <canvas ref={previewCanvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
            </div>

            <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 500 }}>
              Profile Avatar
            </span>
          </div>
        </div>

        {/* 3. Control Panel (Zoom, Rotate, Reset) */}
        <div
          style={{
            padding: '12px 24px',
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
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', minWidth: 44 }}>
              Zoom
            </span>

            <button className="editor-tool-btn" onClick={handleZoomOut} title="Zoom Out">
              <ZoomOut size={16} />
            </button>

            <input
              type="range"
              min="1.0"
              max="3.5"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="editor-slider"
              style={{
                flexGrow: 1,
                height: 6,
                borderRadius: 3,
                outline: 'none',
                background: `linear-gradient(to right, #4F46E5 0%, #4F46E5 ${((scale - 1.0) / 2.5) * 100}%, #E2E8F0 ${((scale - 1.0) / 2.5) * 100}%, #E2E8F0 100%)`,
                cursor: 'pointer'
              }}
            />

            <button className="editor-tool-btn" onClick={handleZoomIn} title="Zoom In">
              <ZoomIn size={16} />
            </button>

            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', minWidth: 38, textAlign: 'right' }}>
              {Math.round(scale * 100)}%
            </span>
          </div>

          {/* Rotate & Reset Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginRight: 4 }}>
                Rotate
              </span>

              <button className="editor-tool-btn" onClick={handleRotateLeft} title="Rotate Left 90°">
                <RotateCcw size={15} />
                <span>-90°</span>
              </button>

              <button className="editor-tool-btn" onClick={handleRotateRight} title="Rotate Right 90°">
                <RotateCw size={15} />
                <span>+90°</span>
              </button>
            </div>

            <button
              className="editor-tool-btn"
              onClick={handleReset}
              title="Reset Original Framing"
              style={{ color: '#DC2626', borderColor: '#FCA5A5', background: '#FEF2F2' }}
            >
              <RefreshCw size={14} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* 4. Action Buttons Footer */}
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
              fontSize: '0.9rem',
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
              fontSize: '0.92rem',
              fontWeight: 700,
              padding: '10px 24px',
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
              <span>Saving...</span>
            ) : (
              <>
                <Check size={18} />
                <span>Save Photo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
