import { useEffect, useRef, useState } from 'react'

export default function EditPhotoModal({ show, imageSrc, fileName = 'Screenshot 2026-01-17 at 10.19.png', onCancel, onSave }) {
  const cropRef = useRef(null)
  const [tx, setTx] = useState(0)
  const [ty, setTy] = useState(0)
  const scale = 1.15

  useEffect(() => { if (show) { setTx(0); setTy(0) } }, [show, imageSrc])

  useEffect(() => {
    const el = cropRef.current
    if (!el) return
    let dragging = false, sx = 0, sy = 0, startTx = 0, startTy = 0

    const down = e => {
      dragging = true
      const pt = e.touches ? e.touches[0] : e
      sx = pt.clientX; sy = pt.clientY
      startTx = tx; startTy = ty
      el.style.cursor = 'grabbing'
    }
    const move = e => {
      if (!dragging) return
      const pt = e.touches ? e.touches[0] : e
      setTx(startTx + pt.clientX - sx)
      setTy(startTy + pt.clientY - sy)
    }
    const up = () => { dragging = false; el.style.cursor = 'move' }

    el.addEventListener('mousedown', down)
    el.addEventListener('touchstart', down, { passive: true })
    window.addEventListener('mousemove', move)
    window.addEventListener('touchmove', move, { passive: true })
    window.addEventListener('mouseup', up)
    window.addEventListener('touchend', up)
    return () => {
      el.removeEventListener('mousedown', down)
      el.removeEventListener('touchstart', down)
      window.removeEventListener('mousemove', move)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('mouseup', up)
      window.removeEventListener('touchend', up)
    }
  }, [show, tx, ty])

  if (!show) return null

  const transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(${scale})`

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      fontFamily: 'var(--font-body)'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        width: '100%',
        maxWidth: 580,
        padding: 32,
        boxSizing: 'border-box',
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Header Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.65rem', fontWeight: 800, color: '#111111', margin: 0 }}>
            Edit Photo
          </h2>
          {/* Blue badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#007FFF',
            color: '#FFFFFF',
            borderRadius: 6,
            padding: '6px 12px',
            fontSize: '0.85rem',
            fontWeight: 600,
            maxWidth: 240,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {fileName.length > 25 ? fileName.slice(0, 25) + '...' : fileName}
            </span>
          </div>
        </div>

        {/* Viewport crop area */}
        <div ref={cropRef} style={{
          width: '100%',
          height: 320,
          backgroundColor: '#8E8E93',
          borderRadius: 8,
          position: 'relative',
          overflow: 'hidden',
          cursor: 'move',
          userSelect: 'none'
        }}>
          {/* Draggable image */}
          <img
            src={imageSrc}
            alt="Preview"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform,
              maxWidth: '100%',
              maxHeight: '100%',
              pointerEvents: 'none'
            }}
          />

          {/* Semi-transparent circular crop overlay mask */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(circle 110px at 50% 50%, transparent 99%, rgba(0, 0, 0, 0.45) 100%)',
            pointerEvents: 'none'
          }} />

          {/* Blue cropping box borders */}
          <div style={{
            border: '2px solid #3E66FB',
            width: 220,
            height: 220,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            boxSizing: 'border-box'
          }} />
        </div>

        {/* Action Buttons Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 20, marginTop: 28 }}>
          <button
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#000000',
              fontFamily: 'var(--font-body)',
              fontSize: '1.05rem',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '10px 20px',
              borderRadius: 6,
              transition: 'background 0.2s'
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(imageSrc, tx, ty, scale)}
            style={{
              background: '#3E66FB',
              color: '#ffffff',
              border: 'none',
              borderRadius: 12,
              fontFamily: 'var(--font-body)',
              fontSize: '1.05rem',
              fontWeight: 700,
              padding: '12px 32px',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
