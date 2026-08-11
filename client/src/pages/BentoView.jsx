import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LayoutDashboard } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Toast, { useToast } from '../components/Toast'
import { getSocialIcon, getSocialBrandColor } from '../components/SocialIcons'
import { placeBlocks, resolveLayout, resolveDragReorder, collides, GRID_COLUMNS, getActiveColumns, getGridDimensions, calculateDragSnapWithHysteresis } from '../utils/bentoGrid'
import {
  getUserBlocks,
  getPublicProfileAndBlocks,
  createBlockApi,
  updateBlockApi,
  deleteBlockApi,
  reorderBlocksApi
} from '../services/bentoApi'
import { fetchSocialStats } from '../services/socialApi'
import InstagramWidget from '../components/social/InstagramWidget'
import GitHubWidget from '../components/social/GitHubWidget'
import LinkedInWidget from '../components/social/LinkedInWidget'
import YouTubeWidget from '../components/social/YouTubeWidget'
import TwitterWidget from '../components/social/TwitterWidget'

function convertGoogleDriveUrl(url) {
  if (!url || typeof url !== 'string') return url;
  const trimmed = url.trim();
  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${fileMatch[1]}`;
  }
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
  }
  return trimmed;
}

function AvatarDisplay({ avatar, profileImage, name = '' }) {
  const [imgError, setImgError] = useState(false)
  const resolvedSrc = profileImage || (avatar?.type === 'file' ? avatar.data : null)

  if (!imgError && resolvedSrc) {
    return (
      <img
        src={resolvedSrc}
        alt="avatar"
        onError={() => setImgError(true)}
        style={{ transform: avatar?.transform || 'none', width: '100%', height: '100%', objectFit: 'cover' }}
      />
    )
  }
  if (avatar?.type === 'emoji' && avatar.data) {
    return <span style={{ fontSize: '4.5rem', lineHeight: '100px' }}>{avatar.data}</span>
  }
  const initials = name && name.trim() ? name.trim().substring(0, 2).toUpperCase() : '👤'
  return (
    <div style={{ fontSize: initials.length <= 2 && initials !== '👤' ? '2.5rem' : '3rem', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E0E7FF', color: '#4F46E5', fontWeight: 'bold' }}>
      {initials}
    </div>
  )
}

// Skeleton Loader for Bento Page with Progressive Assembly Animation
function BentoSkeleton() {
  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: 60, fontFamily: 'Inter, sans-serif' }}>
      <header style={{ height: 70, borderBottom: '1px solid #E2E8F0', background: '#FFFFFF', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="bento-skeleton-item" style={{ width: 120, height: 28, borderRadius: 8 }} />
        <div className="bento-skeleton-item" style={{ width: 100, height: 36, borderRadius: 10 }} />
      </header>

      <main style={{ maxWidth: 1080, margin: '40px auto 0', padding: '0 24px' }}>
        <div style={{ background: '#FFFFFF', borderRadius: 22, padding: 32, border: '1px solid #E2E8F0', display: 'flex', gap: 24, marginBottom: 32, alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div className="bento-skeleton-item" style={{ width: 96, height: 96, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="bento-skeleton-item" style={{ width: 220, height: 28, borderRadius: 8 }} />
            <div className="bento-skeleton-item" style={{ width: 140, height: 16, borderRadius: 6 }} />
            <div className="bento-skeleton-item" style={{ width: 340, height: 16, borderRadius: 6 }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          {[1, 2, 3, 4, 5, 6].map((i, idx) => (
            <div
              key={i}
              className="bento-skeleton-item"
              style={{
                gridColumn: i % 3 === 0 ? 'span 2' : 'span 1',
                height: i % 2 === 0 ? 344 : 160,
                borderRadius: 22,
                border: '1px solid #E2E8F0',
                padding: 20,
                animationDelay: `${idx * 80}ms`
              }}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

export default function BentoView({ isPublic = false }) {
  const { user: authUser, accessToken, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { username: urlUsername } = useParams()

  const isPublicView = isPublic || (urlUsername && urlUsername.toLowerCase() !== 'bento');
  const targetUsername = isPublicView ? urlUsername : (authUser?.username || '');

  // Page State
  const [toastMsg, toastShow, toast] = useToast()
  const [pageLoading, setPageLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [profileData, setProfileData] = useState(null)
  const [gridBlocks, setGridBlocks] = useState([])
  const [selectedBlockId, setSelectedBlockId] = useState(null)

  // Modals & Dialog State
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [activeDialog, setActiveDialog] = useState(null)
  const [editingBlock, setEditingBlock] = useState(null)

  // Dialog Form Inputs
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formUrl, setFormUrl] = useState('')
  const [formHandle, setFormHandle] = useState('')
  const [formEmoji, setFormEmoji] = useState('😊')
  const [formBgColor, setFormBgColor] = useState('#F8FAFC')
  const [checklistItems, setChecklistItems] = useState(['', '', ''])

  // Social Cache State
  const [socialStats, setSocialStats] = useState({})

  // Container Width & Drag/Resize State
  const containerRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [potentialDrag, setPotentialDrag] = useState(null)
  const [activeDrag, setActiveDrag] = useState(null)
  const [activeResize, setActiveResize] = useState(null)

  // Performance RAF & Accessibility Live Region Refs
  const [ariaLiveMsg, setAriaLiveMsg] = useState('')
  const potentialDragRef = useRef(null)
  const dragStateRef = useRef(null)
  const resizeStateRef = useRef(null)
  const rafIdRef = useRef(null)


  const draggedBlockId = activeDrag ? activeDrag.blockId : null;

  // Observe Container Width
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Click Outside Listener for Block Deselection
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.bento-block-card') && !e.target.closest('.bento-modal-overlay')) {
        setSelectedBlockId(null);
      }
    };
    window.addEventListener('pointerdown', handleClickOutside);
    return () => window.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  const timeoutRef = useRef(null);
  const hasLoadedDataRef = useRef(false);
  const loadedSocialKeysRef = useRef(new Set());

  // Fetch Profile & Blocks from Backend
  const fetchProfileAndBlocks = useCallback(async () => {
    if (!isPublicView && authLoading) return;

    setPageLoading(true);
    setLoadError(null);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setPageLoading(false);
      if (!hasLoadedDataRef.current) {
        setLoadError('Loading took too long. Please check your network connection.');
      }
    }, 8000);

    try {
      if (isPublicView) {
        if (!targetUsername) {
          setLoadError('No username provided for public profile.');
          setPageLoading(false);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          return;
        }
        const data = await getPublicProfileAndBlocks(targetUsername);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        if (data && data.success && data.data) {
          hasLoadedDataRef.current = true;
          setProfileData({ user: data.data.user, profile: data.data.profile });
          const rawBlocks = (data.data.blocks || []).map(b => ({
            ...b,
            id: b._id,
            w: b.layout?.w || 2,
            h: b.layout?.h || 2,
            x: b.layout?.x || 0,
            y: b.layout?.y || 0
          }));
          setGridBlocks(placeBlocks(rawBlocks));
          setLoadError(null);
        } else {
          if (!hasLoadedDataRef.current) {
            setLoadError(data?.message || 'Profile not found.');
          }
        }
      } else {
        if (!accessToken) {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setPageLoading(false);
          navigate('/login');
          return;
        }

        const [profRes, blocksData] = await Promise.all([
          fetch('http://localhost:3001/api/profile/me', {
            headers: { Authorization: `Bearer ${accessToken}` }
          }).catch(err => {
            console.warn('[Profile ME Fetch Warning]', err);
            return null;
          }),
          getUserBlocks(accessToken).catch(err => {
            console.warn('[User Blocks Fetch Warning]', err);
            return { success: false, data: [] };
          })
        ]);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        if (profRes && profRes.ok) {
          try {
            const profData = await profRes.json();
            if (profData.success && profData.data) {
              hasLoadedDataRef.current = true;
              setProfileData(profData.data);
            }
          } catch (e) { }
        }

        if (blocksData && blocksData.success) {
          hasLoadedDataRef.current = true;
          const rawBlocks = (blocksData.data || []).map(b => ({
            ...b,
            id: b._id,
            w: b.layout?.w || 2,
            h: b.layout?.h || 2,
            x: b.layout?.x || 0,
            y: b.layout?.y || 0
          }));
          setGridBlocks(placeBlocks(rawBlocks));
          setLoadError(null);
        }
      }
    } catch (err) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      console.error('[Bento Fetch Error]', err);
      if (!hasLoadedDataRef.current) {
        setLoadError('Failed to connect to the server. Please try again.');
      }
    } finally {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setPageLoading(false);
    }
  }, [isPublicView, targetUsername, authLoading, accessToken, navigate]);

  useEffect(() => {
    fetchProfileAndBlocks();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [fetchProfileAndBlocks]);

  // Fetch Live Social Stats
  const loadSocialData = useCallback(async (block) => {
    const sp = block.socialProfile;
    const basicInfo = sp?.basic_info || sp?.basicInfo || sp?.rawData?.basic_info || sp?.rawData?.basicInfo || {};
    const hasData = Boolean(
      sp &&
      (
        sp.followers > 0 ||
        sp.posts > 0 ||
        Boolean(sp.profileImage) ||
        Boolean(sp.description) ||
        Boolean(sp.displayName) ||
        Boolean(basicInfo.fullname) ||
        Boolean(basicInfo.headline) ||
        Boolean(basicInfo.profile_picture_url) ||
        Boolean(basicInfo.about) ||
        Number(basicInfo.follower_count || 0) > 0 ||
        Number(basicInfo.connection_count || 0) > 0
      )
    );
    if (hasData) {
      return;
    }

    const handle = block.configuration?.handle || block.configuration?.username || block.configuration?.title || '';
    if (!handle) return;

    const cacheKey = `${block.blockType}:${handle.toLowerCase().trim().replace(/^@/, '')}`;
    if (loadedSocialKeysRef.current.has(cacheKey)) return;

    loadedSocialKeysRef.current.add(cacheKey);

    try {
      const stats = await fetchSocialStats(block.blockType, handle);
      if (stats) {
        setSocialStats(prev => ({ ...prev, [cacheKey]: stats }));
      }
    } catch (err) {
      console.warn(`[Social Stats Load Error] ${cacheKey}:`, err);
    }
  }, []);

  useEffect(() => {
    gridBlocks.forEach(b => {
      if (['instagram', 'github', 'youtube', 'twitter', 'linkedin'].includes(b.blockType)) {
        loadSocialData(b);
      }
    });
  }, [gridBlocks, loadSocialData]);

  // Double Click Handler
  const handleBlockDoubleClick = (e, block) => {
    if (isPublicView) return;
    e.stopPropagation();
    setSelectedBlockId(prev => prev === block.id ? null : block.id);
  };

  // Block Duplication Handler (Section 10 & 11)
  const handleDuplicateBlock = async (block) => {
    if (isPublicView) return;
    const defaultSize = getDefaultBlockSize(block.blockType);
    const newBlockData = {
      blockType: block.blockType,
      configuration: { ...block.configuration },
      layout: { w: block.w || defaultSize.w, h: block.h || defaultSize.h },
      order: gridBlocks.length
    };

    if (accessToken) {
      try {
        const res = await createBlockApi(newBlockData, accessToken);
        if (res.success && res.block) {
          const newBlock = {
            id: res.block._id,
            _id: res.block._id,
            blockType: res.block.blockType,
            configuration: res.block.configuration,
            socialProfile: res.block.socialProfile,
            x: res.block.layout?.x,
            y: res.block.layout?.y,
            w: res.block.layout?.w || defaultSize.w,
            h: res.block.layout?.h || defaultSize.h,
            layout: res.block.layout
          };
          const placed = placeBlocks([...gridBlocks, newBlock]);
          setGridBlocks(placed);
          setSelectedBlockId(newBlock.id);
          toast(`Duplicated ${block.blockType} block!`);
        }
      } catch (err) {
        toast('Failed to duplicate block');
      }
    }
  };

  // Keyboard Shortcuts & Accessibility Controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. Handle Escape key during active Drag or Resize -> Cancel operation cleanly!
      if (e.key === 'Escape') {
        if (activeDrag) {
          e.preventDefault();
          if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
          if (activeDrag.cardEl && activeDrag.cardEl.style) {
            activeDrag.cardEl.style.transform = '';
          }
          const origX = activeDrag.originalX;
          const origY = activeDrag.originalY;
          const restored = gridBlocks.map(b => b.id === activeDrag.blockId ? { ...b, x: origX, y: origY, layout: { ...b.layout, x: origX, y: origY } } : b);
          setGridBlocks(resolveLayout(restored, null));
          setActiveDrag(null);
          setPotentialDrag(null);
          dragStateRef.current = null;
          toast('Drag cancelled');
          return;
        }

        if (activeResize) {
          e.preventDefault();
          const origX = activeResize.initialX;
          const origY = activeResize.initialY;
          const origW = activeResize.initialW;
          const origH = activeResize.initialH;
          const restored = gridBlocks.map(b => b.id === activeResize.blockId ? { ...b, x: origX, y: origY, w: origW, h: origH, layout: { ...b.layout, x: origX, y: origY, w: origW, h: origH } } : b);
          setGridBlocks(resolveLayout(restored, null));
          setActiveResize(null);
          resizeStateRef.current = null;
          toast('Resize cancelled');
          return;
        }

        if (selectedBlockId) {
          setSelectedBlockId(null);
          return;
        }
      }

      if (!selectedBlockId || isPublicView) return;
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      const targetBlock = gridBlocks.find(b => b.id === selectedBlockId);
      if (!targetBlock) return;

      const activeCols = getActiveColumns(containerWidth);

      // Arrow Key Movement & Resizing
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();

        let { x, y, w, h } = targetBlock;

        if (e.shiftKey) {
          // Resize via Shift + Arrow
          if (e.key === 'ArrowRight') w = Math.min(activeCols - x, w + 1);
          if (e.key === 'ArrowLeft') w = Math.max(1, w - 1);
          if (e.key === 'ArrowDown') h = h + 1;
          if (e.key === 'ArrowUp') h = Math.max(1, h - 1);
        } else {
          // Move via Arrow
          if (e.key === 'ArrowRight') x = Math.min(activeCols - w, x + 1);
          if (e.key === 'ArrowLeft') x = Math.max(0, x - 1);
          if (e.key === 'ArrowDown') y = y + 1;
          if (e.key === 'ArrowUp') y = Math.max(0, y - 1);
        }

        const updated = gridBlocks.map(b => b.id === targetBlock.id ? { ...b, x, y, w, h, layout: { ...b.layout, x, y, w, h } } : b);
        const resolved = resolveLayout(updated, null);
        setGridBlocks(resolved);
        setAriaLiveMsg(`Block updated: position (${x + 1}, ${y + 1}), size ${w}x${h}`);

        if (accessToken) {
          reorderBlocksApi(resolved.map((b, idx) => ({
            id: b.id || b._id,
            layout: { x: b.x, y: b.y, w: b.w, h: b.h },
            order: idx
          })), accessToken).catch(() => { });
        }
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteBlock(selectedBlockId);
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        openEditDialog(targetBlock);
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        handleDuplicateBlock(targetBlock);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBlockId, gridBlocks, isPublicView, activeDrag, activeResize, containerWidth, accessToken]);

  // Global Pointer Event Listeners for Reliable Window-wide Drag/Resize Tracking
  useEffect(() => {
    const onGlobalPointerMove = (e) => {
      if (dragStateRef.current) {
        handlePointerMoveBlock(e, dragStateRef.current.blockId);
      } else if (potentialDragRef.current) {
        handlePointerMoveBlock(e, potentialDragRef.current.blockId);
      } else if (resizeStateRef.current) {
        handlePointerMoveResize(e, resizeStateRef.current.blockId);
      }
    };

    const onGlobalPointerUp = (e) => {
      if (dragStateRef.current) {
        handlePointerUpBlock(e, dragStateRef.current.blockId);
      } else if (potentialDragRef.current) {
        handlePointerUpBlock(e, potentialDragRef.current.blockId);
      } else if (resizeStateRef.current) {
        handlePointerUpResize(e, resizeStateRef.current.blockId);
      }
    };

    window.addEventListener('pointermove', onGlobalPointerMove);
    window.addEventListener('pointerup', onGlobalPointerUp);
    window.addEventListener('pointercancel', onGlobalPointerUp);

    return () => {
      window.removeEventListener('pointermove', onGlobalPointerMove);
      window.removeEventListener('pointerup', onGlobalPointerUp);
      window.removeEventListener('pointercancel', onGlobalPointerUp);
    };
  }, [containerWidth, accessToken, gridBlocks]);

  // Pointer Event Handlers (Drag & Drop)
  const handlePointerDownBlock = (e, block) => {
    if (isPublicView) return;
    if (
      e.target.closest('a') ||
      e.target.closest('button') ||
      e.target.closest('input') ||
      e.target.closest('textarea') ||
      e.target.closest('.bento-card-resize-handle') ||
      e.target.closest('.bento-floating-toolbar') ||
      e.target.closest('.delete-block-btn') ||
      e.target.closest('.edit-block-btn')
    ) {
      return;
    }

    const activeCols = getActiveColumns(containerWidth);
    const { colWidth, rowHeight } = getGridDimensions(containerWidth, activeCols);

    const cardEl = e.currentTarget;
    const pointerId = e.pointerId;

    try { cardEl.setPointerCapture(pointerId); } catch (err) { }

    const pInfo = {
      blockId: block.id,
      block,
      pointerId,
      cardEl,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startLeft: block.x * colWidth,
      startTop: block.y * rowHeight
    };

    potentialDragRef.current = pInfo;
    setPotentialDrag(pInfo);
  };

  const handlePointerMoveBlock = (e, blockId) => {
    const pDrag = potentialDragRef.current;

    // Initial threshold check (8px threshold before activating drag mode)
    if (pDrag && pDrag.blockId === blockId && !dragStateRef.current) {
      const dx = e.clientX - pDrag.startPointerX;
      const dy = e.clientY - pDrag.startPointerY;
      if (Math.hypot(dx, dy) >= 8) {
        e.preventDefault();

        const initialDragState = {
          blockId: pDrag.blockId,
          pointerId: pDrag.pointerId,
          cardEl: pDrag.cardEl,
          startPointerX: pDrag.startPointerX,
          startPointerY: pDrag.startPointerY,
          startLeft: pDrag.startLeft,
          startTop: pDrag.startTop,
          currentPointerX: e.clientX,
          currentPointerY: e.clientY,
          currentLeft: pDrag.startLeft + dx,
          currentTop: pDrag.startTop + dy,
          snapX: pDrag.block.x,
          snapY: pDrag.block.y,
          lastSnapX: pDrag.block.x,
          lastSnapY: pDrag.block.y,
          w: pDrag.block.w,
          h: pDrag.block.h,
          originalX: pDrag.block.x,
          originalY: pDrag.block.y,
          originalW: pDrag.block.w,
          originalH: pDrag.block.h
        };

        dragStateRef.current = initialDragState;
        setActiveDrag(initialDragState);
        potentialDragRef.current = null;
        setPotentialDrag(null);
      }
      return;
    }

    const aDrag = dragStateRef.current;
    if (aDrag && aDrag.blockId === blockId) {
      e.preventDefault();

      // Viewport Edge Auto-Scroll
      if (e.clientY < 60) {
        window.scrollBy(0, -12);
      } else if (window.innerHeight - e.clientY < 60) {
        window.scrollBy(0, 12);
      }

      aDrag.currentPointerX = e.clientX;
      aDrag.currentPointerY = e.clientY;

      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);

      rafIdRef.current = requestAnimationFrame(() => {
        if (!dragStateRef.current) return;
        const {
          startPointerX,
          startPointerY,
          startLeft,
          startTop,
          lastSnapX,
          lastSnapY,
          w,
          cardEl
        } = dragStateRef.current;

        const pX = dragStateRef.current.currentPointerX || e.clientX;
        const pY = dragStateRef.current.currentPointerY || e.clientY;

        const dx = pX - startPointerX;
        const dy = pY - startPointerY;

        const currentLeft = startLeft + dx;
        const currentTop = startTop + dy;

        // 1:1 smooth visual positioning
        if (cardEl && cardEl.style) {
          cardEl.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
        }

        const activeCols = getActiveColumns(containerWidth);
        const { colWidth, rowHeight } = getGridDimensions(containerWidth, activeCols);

        const { snapX, snapY } = calculateDragSnapWithHysteresis(
          currentLeft,
          currentTop,
          colWidth,
          rowHeight,
          lastSnapX,
          lastSnapY,
          w,
          activeCols,
          0.55 // 55% cell distance threshold with deadband
        );

        // Guard: ONLY run resolveLayout and update gridBlocks state when snap position actually changes!
        if (snapX !== lastSnapX || snapY !== lastSnapY) {
          dragStateRef.current.lastSnapX = snapX;
          dragStateRef.current.lastSnapY = snapY;
          dragStateRef.current.snapX = snapX;
          dragStateRef.current.snapY = snapY;

          setActiveDrag(prev => prev ? ({ ...prev, currentLeft, currentTop, snapX, snapY, lastSnapX: snapX, lastSnapY: snapY }) : null);

          setGridBlocks((prevBlocks) => {
            const movingBlock = prevBlocks.find(b => b.id === blockId);
            if (!movingBlock) return prevBlocks;
            const updated = prevBlocks.map(b => b.id === blockId ? { ...b, x: snapX, y: snapY, layout: { ...b.layout, x: snapX, y: snapY } } : b);
            return resolveDragReorder(updated, { ...movingBlock, x: snapX, y: snapY }, aDrag.originalX, aDrag.originalY, activeCols);
          });

          setAriaLiveMsg(`Block moved to column ${snapX + 1}, row ${snapY + 1}`);
        } else {
          setActiveDrag(prev => prev ? ({ ...prev, currentLeft, currentTop }) : null);
        }
      });
    }
  };

  const handlePointerUpBlock = async (e, blockId) => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);

    const pDrag = potentialDragRef.current;
    const aDrag = dragStateRef.current;

    // Released under movement threshold -> SELECT block
    if (pDrag && pDrag.blockId === blockId && !aDrag) {
      setSelectedBlockId(blockId);
      potentialDragRef.current = null;
      setPotentialDrag(null);
      try { pDrag.cardEl.releasePointerCapture(pDrag.pointerId); } catch (err) { }
      return;
    }

    potentialDragRef.current = null;
    setPotentialDrag(null);

    if (aDrag && aDrag.blockId === blockId) {
      e.preventDefault();
      e.stopPropagation();
      try { aDrag.cardEl.releasePointerCapture(aDrag.pointerId); } catch (err) { }

      const finalSnapX = aDrag.snapX;
      const finalSnapY = aDrag.snapY;

      if (aDrag.cardEl && aDrag.cardEl.style) {
        aDrag.cardEl.style.transform = '';
      }

      const updatedBlocks = gridBlocks.map(b => b.id === blockId ? { ...b, x: finalSnapX, y: finalSnapY, layout: { ...b.layout, x: finalSnapX, y: finalSnapY } } : b);
      const resolved = resolveLayout(updatedBlocks, null);
      setGridBlocks(resolved);
      setSelectedBlockId(blockId);
      setActiveDrag(null);
      dragStateRef.current = null;

      setAriaLiveMsg(`Block dropped at column ${finalSnapX + 1}, row ${finalSnapY + 1}`);

      // Optimistic Auto-Save
      if (!isPublicView && accessToken) {
        try {
          await reorderBlocksApi(resolved.map((b, idx) => ({
            id: b.id || b._id,
            layout: { x: b.x, y: b.y, w: b.w, h: b.h },
            order: idx
          })), accessToken);
        } catch (err) {
          toast('Failed to sync layout changes to server');
        }
      }
    }
  };

  // Pointer Event Handlers (8-Handle Precision Resize)
  const handlePointerDownResize = (e, block, direction) => {
    e.preventDefault();
    e.stopPropagation();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { }

    const initialResizeState = {
      blockId: block.id,
      direction,
      pointerId: e.pointerId,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      initialX: block.x,
      initialY: block.y,
      initialW: block.w,
      initialH: block.h,
      snapX: block.x,
      snapY: block.y,
      snapW: block.w,
      snapH: block.h,
      lastSnapX: block.x,
      lastSnapY: block.y,
      lastSnapW: block.w,
      lastSnapH: block.h
    };

    setActiveResize(initialResizeState);
    resizeStateRef.current = initialResizeState;
  };

  const handlePointerMoveResize = (e, blockId) => {
    const aResize = resizeStateRef.current;
    if (!aResize || aResize.blockId !== blockId) return;
    e.preventDefault();
    e.stopPropagation();

    const currentPointerX = e.clientX;
    const currentPointerY = e.clientY;

    const activeCols = getActiveColumns(containerWidth);
    const { colWidth, rowHeight } = getGridDimensions(containerWidth, activeCols);

    const {
      direction,
      startPointerX,
      startPointerY,
      initialX,
      initialY,
      initialW,
      initialH,
      lastSnapX,
      lastSnapY,
      lastSnapW,
      lastSnapH
    } = aResize;

    const dx = currentPointerX - startPointerX;
    const dy = currentPointerY - startPointerY;

    const floatingDeltaX = dx / colWidth;
    const floatingDeltaY = dy / rowHeight;

    let snapX = lastSnapX;
    let snapY = lastSnapY;
    let snapW = lastSnapW;
    let snapH = lastSnapH;

    const threshold = 0.55; // 55% cell boundary threshold for resize

    // Right / East
    if (direction.includes('right')) {
      const floatingW = initialW + floatingDeltaX;
      if (floatingW - lastSnapW >= threshold) {
        snapW = Math.floor(floatingW + (1 - threshold));
      } else if (lastSnapW - floatingW >= threshold) {
        snapW = Math.ceil(floatingW - (1 - threshold));
      } else {
        snapW = lastSnapW;
      }
      snapW = Math.max(1, Math.min(activeCols - initialX, snapW));
    }

    // Left / West
    if (direction.includes('left')) {
      const floatingX = initialX + floatingDeltaX;
      if (lastSnapX - floatingX >= threshold) {
        snapX = Math.floor(floatingX + (1 - threshold));
      } else if (floatingX - lastSnapX >= threshold) {
        snapX = Math.ceil(floatingX - (1 - threshold));
      } else {
        snapX = lastSnapX;
      }
      snapX = Math.max(0, Math.min(initialX + initialW - 1, snapX));
      snapW = initialX + initialW - snapX;
    }

    // Bottom / South
    if (direction.includes('bottom')) {
      const floatingH = initialH + floatingDeltaY;
      if (floatingH - lastSnapH >= threshold) {
        snapH = Math.floor(floatingH + (1 - threshold));
      } else if (lastSnapH - floatingH >= threshold) {
        snapH = Math.ceil(floatingH - (1 - threshold));
      } else {
        snapH = lastSnapH;
      }
      snapH = Math.max(1, snapH);
    }

    // Top / North
    if (direction.includes('top')) {
      const floatingY = initialY + floatingDeltaY;
      if (lastSnapY - floatingY >= threshold) {
        snapY = Math.floor(floatingY + (1 - threshold));
      } else if (floatingY - lastSnapY >= threshold) {
        snapY = Math.ceil(floatingY - (1 - threshold));
      } else {
        snapY = lastSnapY;
      }
      snapY = Math.max(0, Math.min(initialY + initialH - 1, snapY));
      snapH = initialY + initialH - snapY;
    }

    // Guard: ONLY trigger resolveLayout when snap dimensions or position actually change!
    if (snapX !== lastSnapX || snapY !== lastSnapY || snapW !== lastSnapW || snapH !== lastSnapH) {
      resizeStateRef.current = {
        ...aResize,
        snapX,
        snapY,
        snapW,
        snapH,
        lastSnapX: snapX,
        lastSnapY: snapY,
        lastSnapW: snapW,
        lastSnapH: snapH
      };

      setActiveResize(resizeStateRef.current);

      setGridBlocks((prevBlocks) => {
        const movingBlock = prevBlocks.find(b => b.id === blockId);
        if (!movingBlock) return prevBlocks;
        const updated = prevBlocks.map(b => b.id === blockId ? { ...b, x: snapX, y: snapY, w: snapW, h: snapH, layout: { ...b.layout, x: snapX, y: snapY, w: snapW, h: snapH } } : b);
        return resolveLayout(updated, { ...movingBlock, x: snapX, y: snapY, w: snapW, h: snapH });
      });

      setAriaLiveMsg(`Block resized to ${snapW} wide by ${snapH} high`);
    }
  };

  const handlePointerUpResize = async (e, blockId) => {
    const aResize = resizeStateRef.current;
    if (!aResize || aResize.blockId !== blockId) return;
    e.preventDefault();
    e.stopPropagation();
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) { }

    const finalSnapX = aResize.snapX;
    const finalSnapY = aResize.snapY;
    const finalSnapW = aResize.snapW;
    const finalSnapH = aResize.snapH;

    const updatedBlocks = gridBlocks.map(b => b.id === blockId ? { ...b, x: finalSnapX, y: finalSnapY, w: finalSnapW, h: finalSnapH, layout: { ...b.layout, x: finalSnapX, y: finalSnapY, w: finalSnapW, h: finalSnapH } } : b);
    const resolved = resolveLayout(updatedBlocks, null);
    setGridBlocks(resolved);
    setSelectedBlockId(blockId);
    setActiveResize(null);
    resizeStateRef.current = null;

    setAriaLiveMsg(`Resize completed at ${finalSnapW}x${finalSnapH}`);

    // Optimistic Auto-Save
    if (!isPublicView && accessToken) {
      try {
        await reorderBlocksApi(resolved.map((b, idx) => ({
          id: b.id || b._id,
          layout: { x: b.x, y: b.y, w: b.w, h: b.h },
          order: idx
        })), accessToken);
      } catch (err) {
        toast('Failed to sync resize to server');
      }
    }
  };


  // Dialog Controls
  const openAddDialog = (type) => {
    setIsPickerOpen(false);
    setEditingBlock(null);
    setActiveDialog(type);
    setFormTitle('');
    setFormContent('');
    setFormUrl('');
    setFormHandle('');
    setFormEmoji('😊');
    setFormBgColor('#F8FAFC');
    setChecklistItems([
      { id: `chk_1_${Date.now()}`, text: '', completed: false },
      { id: `chk_2_${Date.now()}`, text: '', completed: false },
      { id: `chk_3_${Date.now()}`, text: '', completed: false }
    ]);
  };

  const openEditDialog = (block) => {
    setSelectedBlockId(null);
    setEditingBlock(block);
    setActiveDialog(block.blockType);
    setFormTitle(block.configuration?.title || '');
    setFormContent(block.configuration?.description || '');
    setFormUrl(block.configuration?.url || block.configuration?.imageUrl || '');
    setFormHandle(block.configuration?.handle || block.configuration?.username || '');
    setFormEmoji(block.configuration?.emoji || '😊');
    setFormBgColor(block.configuration?.bg || '#F8FAFC');
    if (block.blockType === 'checklist' && Array.isArray(block.configuration?.items)) {
      setChecklistItems(block.configuration.items.map((i, idx) => {
        if (typeof i === 'string') {
          return { id: `chk_${idx}_${Date.now()}`, text: i, completed: false };
        }
        return {
          id: i.id || `chk_${idx}_${Date.now()}`,
          text: i.text || '',
          completed: Boolean(i.completed)
        };
      }));
    }
  };

  const closeDialog = () => {
    setActiveDialog(null);
    setEditingBlock(null);
  };

  // Save Block (Optimistic UI Update)
  const handleSaveBlock = async () => {
    if (!activeDialog || isPublicView || !accessToken) return;

    let configObj = {};
    let layoutObj = { w: 2, h: 2 }; // Default Size per spec: Width 2, Height 2

    if (activeDialog === 'emoji') {
      configObj = { title: formTitle.trim() || 'Emoji Card', emoji: formEmoji || '😊', bg: formBgColor || '#F8FAFC' };
      layoutObj = { w: 1, h: 1 };
    } else if (activeDialog === 'link') {
      let formattedUrl = formUrl.trim();
      if (!formattedUrl) {
        toast('Link URL is required');
        return;
      }
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = `https://${formattedUrl}`;
      }
      configObj = { title: formTitle.trim() || 'Custom Link', url: formattedUrl };
      layoutObj = { w: 2, h: 1 };
    } else if (activeDialog === 'text') {
      configObj = { title: formTitle.trim() || 'Text Card', description: formContent.trim() };
      layoutObj = { w: 2, h: 2 };
    } else if (activeDialog === 'checklist') {
      const items = checklistItems
        .filter(item => {
          const txt = typeof item === 'string' ? item : item.text;
          return txt && txt.trim() !== '';
        })
        .map((item, idx) => {
          if (typeof item === 'string') {
            return { id: `chk_${idx}_${Date.now()}`, text: item.trim(), completed: false };
          }
          return {
            id: item.id || `chk_${idx}_${Date.now()}`,
            text: item.text.trim(),
            completed: Boolean(item.completed)
          };
        });

      if (items.length === 0) {
        toast('At least one checklist item is required');
        return;
      }
      configObj = { title: formTitle.trim() || 'My Checklist', items };
      layoutObj = { w: 2, h: 2 };
    } else if (activeDialog === 'image') {
      let imgUrl = convertGoogleDriveUrl(formUrl.trim());
      if (!imgUrl) {
        toast('Image URL is required');
        return;
      }
      if (imgUrl.startsWith('data:image/')) {
        toast('Base64 image encoding is not supported. Please provide a valid Cloudinary/S3 image URL.');
        return;
      }
      configObj = { title: formTitle.trim() || 'Image Card', imageUrl: imgUrl };
      layoutObj = { w: 2, h: 2 };
    } else if (['instagram', 'github', 'youtube', 'twitter', 'linkedin'].includes(activeDialog)) {
      if (!formHandle.trim()) {
        toast(`${activeDialog.toUpperCase()} handle/username is required`);
        return;
      }
      configObj = { title: formTitle.trim() || activeDialog.toUpperCase(), handle: formHandle.trim(), username: formHandle.trim() };
      layoutObj = { w: 2, h: 2 };
    }

    const previousBlocks = [...gridBlocks];

    if (editingBlock) {
      // Optimistic Edit
      const updatedList = gridBlocks.map(b => b.id === editingBlock.id ? { ...b, configuration: configObj } : b);
      setGridBlocks(updatedList);
      closeDialog();

      try {
        const data = await updateBlockApi(editingBlock.id, { configuration: configObj }, accessToken);
        if (!data.success) {
          setGridBlocks(previousBlocks);
          toast(data.message || 'Failed to update block');
        } else {
          toast('Block updated!');
        }
      } catch (err) {
        setGridBlocks(previousBlocks);
        toast('Network error updating block');
      }
    } else {
      // Optimistic Create
      const tempId = `temp-${Date.now()}`;
      const tempBlock = placeBlocks([...gridBlocks, {
        id: tempId,
        blockType: activeDialog,
        configuration: configObj,
        layout: layoutObj
      }]).pop();

      setGridBlocks(prev => [...prev, tempBlock]);
      closeDialog();

      try {
        const data = await createBlockApi({
          blockType: activeDialog,
          configuration: configObj,
          layout: layoutObj
        }, accessToken);

        if (data.success && data.data) {
          const savedBlock = {
            ...data.data,
            id: data.data._id,
            x: data.data.layout?.x || 0,
            y: data.data.layout?.y || 0,
            w: data.data.layout?.w || 2,
            h: data.data.layout?.h || 2
          };
          setGridBlocks(prev => prev.map(b => b.id === tempId ? savedBlock : b));
          toast('Block created!');
        } else {
          setGridBlocks(previousBlocks);
          toast(data.message || 'Failed to create block');
        }
      } catch (err) {
        setGridBlocks(previousBlocks);
        toast('Network error creating block');
      }
    }
  };

  // Delete Block (Optimistic UI)
  const handleDeleteBlock = async (blockId) => {
    if (isPublicView || !accessToken) return;
    setSelectedBlockId(null);
    const previousBlocks = [...gridBlocks];
    const filtered = gridBlocks.filter(b => b.id !== blockId);
    setGridBlocks(resolveLayout(filtered, null));

    try {
      const data = await deleteBlockApi(blockId, accessToken);
      if (!data.success) {
        setGridBlocks(previousBlocks);
        toast(data.message || 'Failed to delete block');
      } else {
        toast('Block deleted');
      }
    } catch (err) {
      setGridBlocks(previousBlocks);
      toast('Network error deleting block');
    }
  };

  // Toggle Checklist Item (Optimistic UI Update + Persistence + Rollback)
  const handleToggleCheckitem = async (block, targetItem) => {
    if (isPublicView) return;

    const currentItems = block.configuration?.items || [];
    const targetId = typeof targetItem === 'object' && targetItem !== null ? targetItem.id : null;
    const targetIdx = typeof targetItem === 'number' ? targetItem : -1;

    const updatedItems = currentItems.map((item, idx) => {
      const isMatch = targetId ? (typeof item === 'object' && item.id === targetId) : idx === targetIdx;
      if (isMatch) {
        return typeof item === 'string'
          ? { id: `chk_${idx}`, text: item, completed: true }
          : { ...item, completed: !item.completed };
      }
      return item;
    });

    const updatedBlock = {
      ...block,
      configuration: { ...block.configuration, items: updatedItems }
    };

    // Store snapshot for rollback if API fails
    const previousBlocks = gridBlocks;

    // 1. Optimistic Update immediately in UI
    setGridBlocks(prev => prev.map(b => b.id === block.id ? updatedBlock : b));

    // 2. Async persistence to MongoDB
    if (accessToken) {
      try {
        const res = await updateBlockApi(block.id, { configuration: { ...block.configuration, items: updatedItems } }, accessToken);
        if (res && res.success === false) {
          console.error('[Checklist Update Failed] Reverting state');
          setGridBlocks(previousBlocks);
          toast(res.message || 'Failed to save checklist state');
        }
      } catch (err) {
        console.error('[Checklist Update Error]', err);
        setGridBlocks(previousBlocks);
        toast('Failed to save checklist state');
      }
    }
  };

  if (pageLoading || authLoading) {
    return <BentoSkeleton />;
  }

  if (loadError && !profileData && gridBlocks.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: 24, textAlignment: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠️</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>Unable to Load Bento Profile</h2>
        <p style={{ color: '#64748B', maxWidth: 400, margin: '0 0 24px', textAlign: 'center' }}>{loadError}</p>
        <button
          onClick={fetchProfileAndBlocks}
          style={{ background: '#4F46E5', color: '#FFFFFF', border: 'none', padding: '12px 24px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}
        >
          Try Again
        </button>
      </div>
    );
  }

  const userObj = profileData?.user || authUser;
  const profileObj = profileData?.profile || {};
  const name = userObj?.fullName || profileObj?.username || targetUsername || 'User';
  const bio = profileObj?.bio || 'Welcome to my Bento Profile!';

  const isOwner = Boolean(
    authUser && (
      (!isPublicView) ||
      (authUser._id && profileObj?.userId && String(authUser._id) === String(profileObj.userId)) ||
      (authUser.username && targetUsername && authUser.username.toLowerCase() === targetUsername.toLowerCase())
    )
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: 60, fontFamily: 'Inter, sans-serif', color: '#1E293B' }}>

      {/* Header Bar */}
      <header style={{ height: 70, borderBottom: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 900, background: 'linear-gradient(135deg, #4F46E5, #9333EA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', cursor: 'pointer' }} onClick={() => navigate('/')}>
            HiProfile
          </span>
          <span style={{ fontSize: '0.85rem', background: '#EEF2FF', color: '#4F46E5', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>Bento</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isOwner && (
            <button
              onClick={() => navigate('/dashboard')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE', padding: '8px 14px', borderRadius: 10, fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.15s' }}
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </button>
          )}

          {!isPublicView && (
            <>
              <button
                onClick={() => setIsPickerOpen(true)}
                style={{ background: 'linear-gradient(135deg, #4F46E5, #6366F1)', color: '#FFFFFF', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(79,70,229,0.3)' }}
              >
                <span style={{ fontSize: '1.2rem' }}>+</span> Add Block
              </button>

              <button
                onClick={() => window.open(`/${profileObj.username || authUser?.username}`, '_blank')}
                style={{ background: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1', padding: '10px 16px', borderRadius: 10, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
              >
                Public Link ↗
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Profile Container */}
      <main style={{ maxWidth: 1080, margin: '40px auto 0', padding: '0 24px' }}>

        {/* Profile Card Header — Centered Hero Layout */}
        <section
          className="bento-hero-header"
          style={{
            position: 'relative',
            background: '#FFFFFF',
            borderRadius: 28,
            padding: '48px 32px 40px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.05), 0 4px 12px -2px rgba(15, 23, 42, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            marginBottom: 36,
            overflow: 'hidden'
          }}
        >
          {/* Floating Add Block Button in Top-Right Corner */}


          {/* Centered Large Profile Avatar Ring */}
          <div
            className="bento-avatar-wrapper"
            style={{
              position: 'relative',
              width: 160,
              height: 160,
              borderRadius: '50%',
              padding: 4,
              background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 50%, #EC4899 100%)',
              boxShadow: '0 12px 32px -4px rgba(99, 102, 241, 0.3)',
              marginBottom: 20,
              flexShrink: 0
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: '4px solid #FFFFFF',
                overflow: 'hidden',
                background: '#F8FAFC',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AvatarDisplay avatar={profileObj?.avatar} profileImage={profileObj?.profileImage || userObj?.profileImage} name={name} />
            </div>

            {/* Online Status Badge Indicator */}
            <div
              title="Online"
              style={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#10B981',
                border: '3.5px solid #FFFFFF',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                zIndex: 5
              }}
            />
          </div>

          {/* Centered User Info Hierarchy */}
          <div className="bento-hero-text" style={{ maxWidth: 640, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1 style={{ margin: 0, fontSize: '2.1rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {name}
            </h1>

            <p style={{ margin: '6px 0 12px', fontSize: '1rem', color: '#6366F1', fontWeight: 700, letterSpacing: '0.01em' }}>
              @{profileObj.username || targetUsername}
            </p>

            {bio && (
              <p
                style={{
                  margin: 0,
                  fontSize: '1.02rem',
                  color: '#475569',
                  lineHeight: '1.6',
                  maxWidth: 580,
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}
              >
                {bio}
              </p>
            )}
          </div>
        </section>

        {/* Bento Grid */}
        <div ref={containerRef} style={{ position: 'relative', minHeight: 400, width: '100%' }}>
          {/* Resize Dimension Readout Badge Overlay */}
          {activeResize && (() => {
            const targetX = activeResize.snapX;
            const targetY = activeResize.snapY;
            const targetW = activeResize.snapW;
            const targetH = activeResize.snapH;

            const activeCols = getActiveColumns(containerWidth);
            const { colWidth, rowHeight, gap } = getGridDimensions(containerWidth, activeCols);

            return (
              <div
                className="bento-grid-ghost-preview"
                style={{
                  position: 'absolute',
                  left: `${targetX * colWidth}px`,
                  top: `${targetY * rowHeight}px`,
                  width: `${targetW * colWidth - gap}px`,
                  height: `${targetH * rowHeight - gap}px`,
                  pointerEvents: 'none',
                  zIndex: 5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4F46E5',
                  fontWeight: 800,
                  fontSize: '0.9rem'
                }}
              >
                {targetW} × {targetH}
              </div>
            );
          })()}

          {gridBlocks.length === 0 ? (
            <div style={{ padding: '60px 20px', background: '#FFFFFF', borderRadius: 20, border: '2px dashed #CBD5E1', textAlign: 'center' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: 12 }}>✨</span>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.3rem', fontWeight: 700, color: '#1E293B' }}>Your Bento Profile is empty</h3>
              <p style={{ color: '#64748B', margin: '0 0 20px', fontSize: '0.95rem' }}>Start adding blocks to customize your public profile page.</p>
              {!isPublicView && (
                <button
                  onClick={() => setIsPickerOpen(true)}
                  style={{ background: '#4F46E5', color: '#FFFFFF', border: 'none', padding: '12px 24px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}
                >
                  + Add Block
                </button>
              )}
            </div>
          ) : (
            gridBlocks.map((block, idx) => {
              const activeCols = getActiveColumns(containerWidth);
              const { colWidth, rowHeight, gap } = getGridDimensions(containerWidth, activeCols);

              const isDragging = draggedBlockId === block.id;
              const isSelected = selectedBlockId === block.id;
              const blockX = isDragging && activeDrag ? activeDrag.originalX : block.x;
              const blockY = isDragging && activeDrag ? activeDrag.originalY : block.y;
              const left = blockX * colWidth;
              const top = blockY * rowHeight;
              const width = block.w * colWidth - gap;
              const height = block.h * rowHeight - gap;


              const config = block.configuration || {};

              return (
                <div
                  key={block.id}
                  className={`bento-block-card ${isDragging ? 'is-dragging' : ''} ${isSelected ? 'is-selected' : ''}`}
                  onDoubleClick={(e) => handleBlockDoubleClick(e, block)}
                  onPointerDown={(e) => handlePointerDownBlock(e, block)}
                  onPointerMove={(e) => handlePointerMoveBlock(e, block.id)}
                  onPointerUp={(e) => handlePointerUpBlock(e, block.id)}
                  style={{
                    '--bento-stagger-index': idx,
                    position: 'absolute',
                    left: `${left}px`,
                    top: `${top}px`,
                    width: `${width}px`,
                    height: `${height}px`,
                    background: config.bg || '#FFFFFF',
                    borderRadius: 22,
                    border: isSelected ? '2px solid #4F46E5' : '1px solid #E2E8F0',
                    zIndex: isDragging ? 100 : (isSelected ? 20 : 1),
                    padding: (block.w <= 1 || block.h <= 1) ? 12 : 20,
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    overflow: 'hidden',
                    cursor: !isPublicView ? 'grab' : 'default',
                    userSelect: 'none'
                  }}
                >
                  {/* Floating Action Toolbar (Strictly Edit, Duplicate, Delete) */}
                  {!isPublicView && isSelected && (
                    <div
                      className="bento-floating-toolbar"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        top: block.y === 0 ? 10 : -44,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: '#0F172A',
                        color: '#F8FAFC',
                        border: '1px solid #334155',
                        padding: '6px 14px',
                        borderRadius: 20,
                        boxShadow: 'none',
                        zIndex: 40,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditDialog(block); }}
                        style={{ background: 'none', border: 'none', color: '#F8FAFC', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', padding: '3px 6px', display: 'flex', alignItems: 'center', gap: 4 }}
                        title="Edit Block (E)"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDuplicateBlock(block); }}
                        style={{ background: 'none', border: 'none', color: '#F8FAFC', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', padding: '3px 6px', display: 'flex', alignItems: 'center', gap: 4 }}
                        title="Duplicate Block (D)"
                      >
                        📋 Duplicate
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteBlock(block.id); }}
                        style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', padding: '3px 6px', display: 'flex', alignItems: 'center', gap: 4 }}
                        title="Delete Block (Del)"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}

                  {/* Corner Action Buttons */}
                  {!isPublicView && isSelected && (
                    <>
                      <button
                        className="delete-block-btn"
                        onClick={(e) => { e.stopPropagation(); handleDeleteBlock(block.id); }}
                        style={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: '#FEF2F2',
                          border: '1.5px solid #FCA5A5',
                          color: '#EF4444',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.9rem',
                          zIndex: 20,
                          boxShadow: 'none'
                        }}
                        title="Delete Block"
                      >
                        🗑️
                      </button>

                      <button
                        className="edit-block-btn"
                        onClick={(e) => { e.stopPropagation(); openEditDialog(block); }}
                        style={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: '#EEF2FF',
                          border: '1.5px solid #818CF8',
                          color: '#4F46E5',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.9rem',
                          zIndex: 20,
                          boxShadow: 'none'
                        }}
                        title="Edit Block"
                      >
                        ✏️
                      </button>
                    </>
                  )}

                  {/* Emoji Card */}
                  {block.blockType === 'emoji' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <span className="bento-emoji-display" style={{ fontSize: '3.5rem', lineHeight: 1, display: 'inline-block' }}>{config.emoji || '😊'}</span>
                      {config.title && <span style={{ marginTop: 8, fontWeight: 700, fontSize: '0.9rem', color: '#334155' }}>{config.title}</span>}
                    </div>
                  )}

                  {/* Link Card */}
                  {block.blockType === 'link' && (() => {
                    const rawUrl = config.url || '';
                    const hrefUrl = rawUrl ? (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') ? rawUrl : `https://${rawUrl}`) : '#';

                    return (
                      <a
                        href={hrefUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: '1.5rem' }}>🔗</span>
                          <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', color: '#0F172A' }}>{config.title || 'Link'}</h4>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#4F46E5', fontWeight: 600, fontSize: '0.85rem' }}>
                          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                            {rawUrl}
                          </span>
                          <span className="bento-link-arrow" style={{ display: 'inline-block', fontSize: '1rem', fontWeight: 800 }}>↗</span>
                        </div>
                      </a>
                    );
                  })()}

                  {/* Text Card */}
                  {block.blockType === 'text' && (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      {config.title && <h4 style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>{config.title}</h4>}
                      <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem', lineHeight: '1.5', flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {config.description}
                      </p>
                    </div>
                  )}

                  {/* Checklist Card */}
                  {block.blockType === 'checklist' && (() => {
                    const items = config.items || [];
                    const totalCount = items.length;
                    const completedCount = items.filter(i => (typeof i === 'object' ? i.completed : false)).length;
                    const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                    return (
                      <div
                        style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {/* Title & Stats */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                            <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', color: '#0F172A' }}>
                              {config.title || 'Checklist'}
                            </h4>
                            {totalCount > 0 && (
                              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B' }}>
                                {completedCount} / {totalCount} ({progressPct}%)
                              </span>
                            )}
                          </div>

                          {/* Dynamic Progress Bar */}
                          {totalCount > 0 && (
                            <div className="bento-checklist-progress-bar-bg">
                              <div
                                className="bento-checklist-progress-bar-fill"
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Items List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', flexGrow: 1, marginTop: 10, paddingRight: 2 }}>
                          {items.map((item, itemIdx) => {
                            const itemText = typeof item === 'string' ? item : item.text;
                            const isCompleted = typeof item === 'object' && Boolean(item.completed);
                            const itemId = (typeof item === 'object' && item.id) ? item.id : `chk_${itemIdx}`;

                            return (
                              <label
                                key={itemId}
                                className="bento-checklist-item"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isPublicView) {
                                    handleToggleCheckitem(block, item);
                                  }
                                }}
                              >
                                <input
                                  type="checkbox"
                                  className="bento-checklist-checkbox"
                                  checked={isCompleted}
                                  onChange={() => { }}
                                  disabled={isPublicView}
                                  aria-label={itemText}
                                />
                                <span className={`bento-checklist-text ${isCompleted ? 'is-completed' : ''}`}>
                                  {itemText}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Image Card */}
                  {block.blockType === 'image' && (
                    <div style={{ width: '100%', height: '100%', borderRadius: 16, overflow: 'hidden', position: 'relative', background: '#F1F5F9' }}>
                      <img src={config.imageUrl || config.image} alt={config.title || 'Bento Image'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {config.title && (
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.85), transparent)', color: '#FFF', padding: '16px 12px 10px', fontSize: '0.88rem', fontWeight: 700, backdropFilter: 'blur(4px)' }}>
                          {config.title}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Social Cards */}
                  {(() => {
                    const handle = block.configuration?.handle || block.configuration?.username || block.configuration?.title || '';
                    const cacheKey = `${block.blockType}:${handle.toLowerCase().trim().replace(/^@/, '')}`;
                    const effectiveSocialProfile = block.socialProfile || socialStats[cacheKey] || {};

                    if (block.blockType === 'linkedin') {
                      console.log('[LINKEDIN BENTOVIEW DATA]', {
                        blockId: block.id || block._id,
                        platform: block.blockType,
                        handle,
                        socialProfile: block.socialProfile,
                        socialStatsCache: socialStats[cacheKey],
                        effectiveSocialProfile
                      });
                    }

                    return (
                      <>
                        {block.blockType === 'instagram' && <InstagramWidget block={block} socialProfile={effectiveSocialProfile} />}
                        {block.blockType === 'github' && <GitHubWidget block={block} socialProfile={effectiveSocialProfile} />}
                        {block.blockType === 'linkedin' && <LinkedInWidget block={block} socialProfile={effectiveSocialProfile} />}
                        {block.blockType === 'youtube' && <YouTubeWidget block={block} socialProfile={effectiveSocialProfile} />}
                        {block.blockType === 'twitter' && <TwitterWidget block={block} socialProfile={effectiveSocialProfile} />}
                      </>
                    );
                  })()}

                  {/* 8 Precision Resize Handles */}
                  {!isPublicView && !block.locked && (
                    <>
                      {/* Edge Handles */}
                      <div
                        className="bento-card-resize-handle top"
                        onPointerDown={(e) => handlePointerDownResize(e, block, 'top')}
                        onPointerMove={(e) => handlePointerMoveResize(e, block.id)}
                        onPointerUp={(e) => handlePointerUpResize(e, block.id)}
                      />
                      <div
                        className="bento-card-resize-handle bottom"
                        onPointerDown={(e) => handlePointerDownResize(e, block, 'bottom')}
                        onPointerMove={(e) => handlePointerMoveResize(e, block.id)}
                        onPointerUp={(e) => handlePointerUpResize(e, block.id)}
                      />
                      <div
                        className="bento-card-resize-handle left"
                        onPointerDown={(e) => handlePointerDownResize(e, block, 'left')}
                        onPointerMove={(e) => handlePointerMoveResize(e, block.id)}
                        onPointerUp={(e) => handlePointerUpResize(e, block.id)}
                      />
                      <div
                        className="bento-card-resize-handle right"
                        onPointerDown={(e) => handlePointerDownResize(e, block, 'right')}
                        onPointerMove={(e) => handlePointerMoveResize(e, block.id)}
                        onPointerUp={(e) => handlePointerUpResize(e, block.id)}
                      />
                      {/* Corner Handles */}
                      <div
                        className="bento-card-resize-handle top-left"
                        onPointerDown={(e) => handlePointerDownResize(e, block, 'top-left')}
                        onPointerMove={(e) => handlePointerMoveResize(e, block.id)}
                        onPointerUp={(e) => handlePointerUpResize(e, block.id)}
                      />
                      <div
                        className="bento-card-resize-handle top-right"
                        onPointerDown={(e) => handlePointerDownResize(e, block, 'top-right')}
                        onPointerMove={(e) => handlePointerMoveResize(e, block.id)}
                        onPointerUp={(e) => handlePointerUpResize(e, block.id)}
                      />
                      <div
                        className="bento-card-resize-handle bottom-left"
                        onPointerDown={(e) => handlePointerDownResize(e, block, 'bottom-left')}
                        onPointerMove={(e) => handlePointerMoveResize(e, block.id)}
                        onPointerUp={(e) => handlePointerUpResize(e, block.id)}
                      />
                      <div
                        className="bento-card-resize-handle bottom-right"
                        onPointerDown={(e) => handlePointerDownResize(e, block, 'bottom-right')}
                        onPointerMove={(e) => handlePointerMoveResize(e, block.id)}
                        onPointerUp={(e) => handlePointerUpResize(e, block.id)}
                      />
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Screen Reader ARIA Live Region */}
      <div className="sr-only" aria-live="polite">
        {ariaLiveMsg}
      </div>

      {/* Add Block Modal Picker (EXACTLY 10 SUPPORTED OPTIONS) */}
      {isPickerOpen && (
        <div className="bento-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 24, padding: 32, maxWidth: 640, width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}>Add Block</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#64748B' }}>Choose a block type to add to your Bento profile</p>
              </div>
              <button onClick={() => setIsPickerOpen(false)} style={{ background: '#F1F5F9', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 16 }}>
              {[
                { type: 'emoji', isSocial: false, icon: '😊', label: 'Emoji' },
                { type: 'link', isSocial: false, icon: '🔗', label: 'Link' },
                { type: 'text', isSocial: false, icon: 'Ｔ', label: 'Text' },
                { type: 'checklist', isSocial: false, icon: '📋', label: 'Checklist' },
                { type: 'image', isSocial: false, icon: '🖼️', label: 'Image Card' },
                { type: 'instagram', isSocial: true, label: 'Instagram' },
                { type: 'github', isSocial: true, label: 'GitHub' },
                { type: 'youtube', isSocial: true, label: 'YouTube' },
                { type: 'twitter', isSocial: true, label: 'Twitter / X' },
                { type: 'linkedin', isSocial: true, label: 'LinkedIn' }
              ].map((item) => {
                const brandColor = item.isSocial ? getSocialBrandColor(item.type) : '#4F46E5';
                return (
                  <div
                    key={item.type}
                    onClick={() => openAddDialog(item.type)}
                    style={{ background: '#F8FAFC', borderRadius: 16, padding: 18, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = brandColor; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.transform = 'none'; }}
                  >
                    <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                      {item.isSocial ? (
                        getSocialIcon(item.type, 36, brandColor)
                      ) : (
                        <span style={{ fontSize: '2.2rem' }}>{item.icon}</span>
                      )}
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1E293B' }}>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Configure Block Modal */}
      {activeDialog && (
        <div className="bento-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 210, padding: 20 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 24, padding: 32, maxWidth: 500, width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', textTransform: 'capitalize' }}>
                {editingBlock ? `Edit ${activeDialog}` : `Configure ${activeDialog}`}
              </h3>
              <button onClick={closeDialog} style={{ background: '#F1F5F9', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {activeDialog === 'emoji' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Select Emoji</label>
                    <input type="text" value={formEmoji} onChange={(e) => setFormEmoji(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: '1.5rem', textAlign: 'center' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Card Title (Optional)</label>
                    <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. Current Mood" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: '0.95rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Background Color</label>
                    <input type="color" value={formBgColor} onChange={(e) => setFormBgColor(e.target.value)} style={{ width: '100%', height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
                  </div>
                </>
              )}

              {activeDialog === 'link' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Link Title</label>
                    <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. Portfolio Website" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: '0.95rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Target URL</label>
                    <input type="url" value={formUrl} onChange={(e) => setFormUrl(e.target.value)} placeholder="https://example.com" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: '0.95rem' }} />
                  </div>
                </>
              )}

              {activeDialog === 'text' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Title</label>
                    <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. About My Journey" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: '0.95rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Paragraph Text</label>
                    <textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} placeholder="Write your paragraph here..." rows={4} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: '0.95rem', resize: 'vertical' }} />
                  </div>
                </>
              )}

              {activeDialog === 'checklist' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Checklist Title</label>
                    <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. Daily Goals" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: '0.95rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Checklist Items</label>
                    {checklistItems.map((item, idx) => {
                      const textVal = typeof item === 'string' ? item : item.text;
                      return (
                        <div key={(typeof item === 'object' && item.id) ? item.id : idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                          <input
                            type="text"
                            value={textVal}
                            onChange={(e) => {
                              const newItems = [...checklistItems];
                              if (typeof newItems[idx] === 'string') {
                                newItems[idx] = { id: `chk_${idx}_${Date.now()}`, text: e.target.value, completed: false };
                              } else {
                                newItems[idx] = { ...newItems[idx], text: e.target.value };
                              }
                              setChecklistItems(newItems);
                            }}
                            placeholder={`Task ${idx + 1}`}
                            style={{ flexGrow: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                          />
                          {checklistItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setChecklistItems(checklistItems.filter((_, i) => i !== idx))}
                              style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#EF4444', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}
                              title="Remove item"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setChecklistItems([...checklistItems, { id: `chk_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, text: '', completed: false }])}
                      style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#4F46E5', borderRadius: 8, padding: '6px 14px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', marginTop: 4 }}
                    >
                      + Add Task
                    </button>
                  </div>
                </>
              )}

              {activeDialog === 'image' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Caption / Title</label>
                    <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. Workspace Shot" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: '0.95rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Cloudinary / S3 Image URL</label>
                    <input type="url" value={formUrl} onChange={(e) => setFormUrl(e.target.value)} placeholder="https://images.unsplash.com/..." style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: '0.95rem' }} />
                  </div>
                </>
              )}

              {['instagram', 'github', 'youtube', 'twitter', 'linkedin'].includes(activeDialog) && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                      {activeDialog.toUpperCase()} Username / Handle
                    </label>
                    <input type="text" value={formHandle} onChange={(e) => setFormHandle(e.target.value)} placeholder={`Your ${activeDialog} username`} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: '0.95rem' }} />
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button onClick={closeDialog} style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '10px 18px', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSaveBlock} style={{ background: '#4F46E5', color: '#FFF', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
                Save Block
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toastMsg} show={toastShow} />
    </div>
  );
}
