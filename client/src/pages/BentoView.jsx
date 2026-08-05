import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Toast, { useToast } from '../components/Toast'
import { getSocialIcon, getSocialBrandColor } from '../components/SocialIcons'
import { placeBlocks, resolveLayout, collides, GRID_COLUMNS } from '../utils/bentoGrid'
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

function AvatarDisplay({ avatar, profileImage }) {
  if (profileImage) {
    return <img src={profileImage} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
  }
  if (avatar?.type === 'file' && avatar.data) {
    return <img src={avatar.data} alt="avatar" style={{ transform: avatar.transform, width: '100%', height: '100%', objectFit: 'cover' }} />
  }
  if (avatar?.type === 'emoji' && avatar.data) {
    return <span style={{ fontSize: '4.5rem', lineHeight: '100px' }}>{avatar.data}</span>
  }
  return <div style={{ fontSize: '3rem', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E0E7FF', color: '#4F46E5', fontWeight: 'bold' }}>👤</div>
}

// Skeleton Loader for Bento Page
function BentoSkeleton() {
  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: 60, fontFamily: 'Inter, sans-serif' }}>
      <header style={{ height: 70, borderBottom: '1px solid #E2E8F0', background: '#FFFFFF', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 120, height: 28, background: '#E2E8F0', borderRadius: 6, animation: 'pulse 1.5s infinite' }} />
        <div style={{ width: 100, height: 36, background: '#E2E8F0', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
      </header>

      <main style={{ maxWidth: 1080, margin: '40px auto 0', padding: '0 24px' }}>
        <div style={{ background: '#FFFFFF', borderRadius: 20, padding: 32, border: '1px solid #E2E8F0', display: 'flex', gap: 24, marginBottom: 32, alignItems: 'center' }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', background: '#E2E8F0', flexShrink: 0, animation: 'pulse 1.5s infinite' }} />
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ width: 220, height: 28, background: '#E2E8F0', borderRadius: 6, animation: 'pulse 1.5s infinite' }} />
            <div style={{ width: 140, height: 16, background: '#E2E8F0', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
            <div style={{ width: 340, height: 16, background: '#E2E8F0', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ gridColumn: i % 2 === 0 ? 'span 2' : 'span 1', height: 160, background: '#FFFFFF', borderRadius: 18, border: '1px solid #E2E8F0', padding: 20, animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      </main>

      <style>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
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

  // Fetch Profile & Blocks from Backend
  const fetchProfileAndBlocks = useCallback(async () => {
    setPageLoading(true);
    setLoadError(null);

    const timeoutTimer = setTimeout(() => {
      setPageLoading(false);
      setLoadError('Loading took too long. Please check your network connection.');
    }, 10000);

    try {
      if (isPublicView) {
        if (!targetUsername) {
          setLoadError('No username provided for public profile.');
          setPageLoading(false);
          clearTimeout(timeoutTimer);
          return;
        }
        const data = await getPublicProfileAndBlocks(targetUsername);
        clearTimeout(timeoutTimer);

        if (data.success) {
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
        } else {
          setLoadError(data.message || 'Profile not found.');
        }
      } else {
        if (authLoading) return;
        if (!accessToken) {
          clearTimeout(timeoutTimer);
          navigate('/login');
          return;
        }

        const [profRes, blocksData] = await Promise.all([
          fetch('http://localhost:3001/api/profile/me', {
            headers: { Authorization: `Bearer ${accessToken}` }
          }),
          getUserBlocks(accessToken)
        ]);

        const profData = await profRes.json();
        clearTimeout(timeoutTimer);

        if (profData.success) setProfileData(profData.data);
        if (blocksData.success) {
          const rawBlocks = (blocksData.data || []).map(b => ({
            ...b,
            id: b._id,
            w: b.layout?.w || 2,
            h: b.layout?.h || 2,
            x: b.layout?.x || 0,
            y: b.layout?.y || 0
          }));
          setGridBlocks(placeBlocks(rawBlocks));
        }
      }
    } catch (err) {
      clearTimeout(timeoutTimer);
      console.error('[Bento Error]', err);
      setLoadError('Failed to connect to the server. Please try again.');
    } finally {
      setPageLoading(false);
    }
  }, [isPublicView, targetUsername, authLoading, accessToken, navigate]);

  useEffect(() => {
    fetchProfileAndBlocks();
  }, [fetchProfileAndBlocks]);

  // Fetch Live Social Stats
  const loadSocialData = useCallback(async (block) => {
    const handle = block.configuration?.handle || block.configuration?.title || profileData?.profile?.socialLinks?.[block.blockType] || '';
    if (!handle) return;

    const cacheKey = `${block.blockType}:${handle.toLowerCase()}`;
    if (socialStats[cacheKey]) return;

    const stats = await fetchSocialStats(block.blockType, handle);
    if (stats) {
      setSocialStats(prev => ({ ...prev, [cacheKey]: stats }));
    }
  }, [profileData, socialStats]);

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

  // Cycle Card Background Palette (Section 11)
  const bgPalette = ['#FFFFFF', '#F8FAFC', '#EEF2FF', '#F0FDF4', '#FEF2F2', '#0F172A'];
  const cycleBgColor = async (e, block) => {
    e.stopPropagation();
    const currentBg = block.configuration?.bg || '#FFFFFF';
    const nextIdx = (bgPalette.indexOf(currentBg) + 1) % bgPalette.length;
    const newBg = bgPalette[nextIdx];

    const updatedConfig = { ...block.configuration, bg: newBg };
    setGridBlocks(prev => prev.map(b => b.id === block.id ? { ...b, configuration: updatedConfig } : b));

    if (!isPublicView && accessToken) {
      try {
        await updateBlockApi(block._id || block.id, { configuration: updatedConfig }, accessToken);
      } catch (err) {
        toast('Failed to update background style');
      }
    }
  };

  // Toggle Block Visibility (Hide / Restore)
  const handleToggleVisibility = async (block) => {
    if (isPublicView) return;
    const newVisibility = block.visibility === false;
    setGridBlocks(prev => prev.map(b => b.id === block.id ? { ...b, visibility: newVisibility } : b));
    toast(newVisibility ? 'Block made visible' : 'Block hidden from public view');

    if (accessToken) {
      try {
        await updateBlockApi(block._id || block.id, { visibility: newVisibility }, accessToken);
      } catch (err) {
        toast('Failed to sync visibility state');
      }
    }
  };

  // Toggle Block Lock (Lock / Unlock position & sizing)
  const handleToggleLock = async (block) => {
    if (isPublicView) return;
    const newLocked = !block.locked;
    setGridBlocks(prev => prev.map(b => b.id === block.id ? { ...b, locked: newLocked } : b));
    toast(newLocked ? '🔒 Block locked (Move/Resize disabled)' : '🔓 Block unlocked');

    if (accessToken) {
      try {
        await updateBlockApi(block._id || block.id, { locked: newLocked }, accessToken);
      } catch (err) {
        toast('Failed to sync lock state');
      }
    }
  };

  // Keyboard Shortcuts & Accessibility Controls (Section 22)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedBlockId || isPublicView) return;
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      const targetBlock = gridBlocks.find(b => b.id === selectedBlockId);
      if (!targetBlock) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (!targetBlock.locked) handleDeleteBlock(selectedBlockId);
        else toast('🔒 Locked block cannot be deleted');
      } else if (e.key === 'Escape') {
        setSelectedBlockId(null);
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        openEditDialog(targetBlock);
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        handleDuplicateBlock(targetBlock);
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        handleToggleVisibility(targetBlock);
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        handleToggleLock(targetBlock);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBlockId, gridBlocks, isPublicView]);

  // Pointer Event Handlers (Drag & Drop)
  const handlePointerDownBlock = (e, block) => {
    if (isPublicView || block.locked) return;
    if (
      e.target.closest('.bento-card-resize-handle') ||
      e.target.closest('.delete-block-btn') ||
      e.target.closest('.edit-block-btn') ||
      e.target.closest('input') ||
      e.target.closest('button') ||
      e.target.closest('a')
    ) {
      return;
    }

    const gap = 24;
    const colWidth = (containerWidth + gap) / GRID_COLUMNS;
    const rowHeight = 160 + gap;

    setPotentialDrag({
      block,
      pointerId: e.pointerId,
      cardEl: e.currentTarget,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startLeft: block.x * colWidth,
      startTop: block.y * rowHeight
    });
  };

  const handlePointerMoveBlock = (e, blockId) => {
    if (potentialDrag && potentialDrag.block.id === blockId && !activeDrag) {
      const dx = e.clientX - potentialDrag.startPointerX;
      const dy = e.clientY - potentialDrag.startPointerY;
      if (Math.sqrt(dx * dx + dy * dy) > 5) {
        e.preventDefault();
        try { potentialDrag.cardEl.setPointerCapture(potentialDrag.pointerId); } catch (err) {}
        setActiveDrag({
          blockId: blockId,
          startPointerX: potentialDrag.startPointerX,
          startPointerY: potentialDrag.startPointerY,
          startLeft: potentialDrag.startLeft,
          startTop: potentialDrag.startTop,
          currentLeft: potentialDrag.startLeft + dx,
          currentTop: potentialDrag.startTop + dy,
          snapX: potentialDrag.block.x,
          snapY: potentialDrag.block.y,
          w: potentialDrag.block.w,
          h: potentialDrag.block.h
        });
      }
      return;
    }

    if (activeDrag && activeDrag.blockId === blockId) {
      e.preventDefault();
      const dx = e.clientX - activeDrag.startPointerX;
      const dy = e.clientY - activeDrag.startPointerY;

      const gap = 24;
      const colWidth = (containerWidth + gap) / GRID_COLUMNS;
      const rowHeight = 160 + gap;

      const currentLeft = activeDrag.startLeft + dx;
      const currentTop = activeDrag.startTop + dy;

      let snapX = Math.round(currentLeft / colWidth);
      snapX = Math.max(0, Math.min(GRID_COLUMNS - activeDrag.w, snapX));
      let snapY = Math.max(0, Math.round(currentTop / rowHeight));

      setActiveDrag(prev => ({ ...prev, currentLeft, currentTop, snapX, snapY }));

      setGridBlocks((prevBlocks) => {
        const movingBlock = prevBlocks.find(b => b.id === blockId);
        if (!movingBlock) return prevBlocks;
        const updated = prevBlocks.map(b => b.id === blockId ? { ...b, x: snapX, y: snapY, layout: { ...b.layout, x: snapX, y: snapY } } : b);
        return resolveLayout(updated, { ...movingBlock, x: snapX, y: snapY });
      });
    }
  };

  const handlePointerUpBlock = async (e, blockId) => {
    setPotentialDrag(null);
    if (activeDrag && activeDrag.blockId === blockId) {
      e.preventDefault();
      e.stopPropagation();
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {}

      const finalSnapX = activeDrag.snapX;
      const finalSnapY = activeDrag.snapY;

      const updatedBlocks = gridBlocks.map(b => b.id === blockId ? { ...b, x: finalSnapX, y: finalSnapY, layout: { ...b.layout, x: finalSnapX, y: finalSnapY } } : b);
      const resolved = resolveLayout(updatedBlocks, null);
      setGridBlocks(resolved);
      setActiveDrag(null);

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

  // Pointer Event Handlers (Resize)
  const handlePointerDownResize = (e, block, direction) => {
    e.preventDefault();
    e.stopPropagation();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}

    const gap = 24;
    const colWidth = (containerWidth + gap) / GRID_COLUMNS;
    const rowHeight = 160 + gap;

    setActiveResize({
      blockId: block.id,
      direction,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startWidth: block.w * colWidth - gap,
      startHeight: block.h * rowHeight - gap,
      snapW: block.w,
      snapH: block.h
    });
  };

  const handlePointerMoveResize = (e, blockId) => {
    if (!activeResize || activeResize.blockId !== blockId) return;
    e.preventDefault();
    e.stopPropagation();

    const dx = e.clientX - activeResize.startPointerX;
    const dy = e.clientY - activeResize.startPointerY;
    const gap = 24;
    const colWidth = (containerWidth + gap) / GRID_COLUMNS;
    const rowHeight = 160 + gap;

    const block = gridBlocks.find(b => b.id === blockId);
    if (!block) return;

    let snapW = block.w;
    let snapH = block.h;

    if (activeResize.direction.includes('right')) {
      snapW = Math.round((activeResize.startWidth + dx + gap) / colWidth);
      snapW = Math.max(1, Math.min(GRID_COLUMNS - block.x, snapW));
    }
    if (activeResize.direction.includes('bottom')) {
      snapH = Math.round((activeResize.startHeight + dy + gap) / rowHeight);
      snapH = Math.max(1, snapH);
    }

    setActiveResize(prev => ({ ...prev, snapW, snapH }));

    setGridBlocks((prevBlocks) => {
      const movingBlock = prevBlocks.find(b => b.id === blockId);
      if (!movingBlock) return prevBlocks;
      const updated = prevBlocks.map(b => b.id === blockId ? { ...b, w: snapW, h: snapH, layout: { ...b.layout, w: snapW, h: snapH } } : b);
      return resolveLayout(updated, { ...movingBlock, w: snapW, h: snapH });
    });
  };

  const handlePointerUpResize = async (e, blockId) => {
    if (!activeResize || activeResize.blockId !== blockId) return;
    e.preventDefault();
    e.stopPropagation();
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {}

    const finalSnapW = activeResize.snapW;
    const finalSnapH = activeResize.snapH;

    const updatedBlocks = gridBlocks.map(b => b.id === blockId ? { ...b, w: finalSnapW, h: finalSnapH, layout: { ...b.layout, w: finalSnapW, h: finalSnapH } } : b);
    const resolved = resolveLayout(updatedBlocks, null);
    setGridBlocks(resolved);
    setActiveResize(null);

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
    setChecklistItems(['', '', '']);
  };

  const openEditDialog = (block) => {
    setSelectedBlockId(null);
    setEditingBlock(block);
    setActiveDialog(block.blockType);
    setFormTitle(block.configuration?.title || '');
    setFormContent(block.configuration?.description || '');
    setFormUrl(block.configuration?.url || block.configuration?.imageUrl || '');
    setFormHandle(block.configuration?.handle || '');
    setFormEmoji(block.configuration?.emoji || '😊');
    setFormBgColor(block.configuration?.bg || '#F8FAFC');
    if (block.blockType === 'checklist' && Array.isArray(block.configuration?.items)) {
      setChecklistItems(block.configuration.items.map(i => typeof i === 'string' ? i : i.text));
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
      const items = checklistItems.filter(i => i.trim() !== '').map(text => ({
        id: Math.random().toString(36).substr(2, 9),
        text: text.trim(),
        completed: false
      }));
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
      configObj = { title: formTitle.trim() || activeDialog.toUpperCase(), handle: formHandle.trim() };
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

  // Toggle Checklist Item
  const handleToggleCheckitem = async (block, itemIndex) => {
    if (isPublicView) return;
    const currentItems = block.configuration?.items || [];
    const updatedItems = currentItems.map((item, idx) => {
      if (idx === itemIndex) {
        return typeof item === 'string'
          ? { id: String(idx), text: item, completed: true }
          : { ...item, completed: !item.completed };
      }
      return item;
    });

    const updatedBlock = {
      ...block,
      configuration: { ...block.configuration, items: updatedItems }
    };

    setGridBlocks(prev => prev.map(b => b.id === block.id ? updatedBlock : b));

    if (accessToken) {
      try {
        await updateBlockApi(block.id, { configuration: { ...block.configuration, items: updatedItems } }, accessToken);
      } catch (err) {
        console.error('Failed to update checklist item:', err);
      }
    }
  };

  if (pageLoading || authLoading) {
    return <BentoSkeleton />;
  }

  if (loadError) {
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

        {!isPublicView && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
          </div>
        )}
      </header>

      {/* Main Profile Container */}
      <main style={{ maxWidth: 1080, margin: '40px auto 0', padding: '0 24px' }}>
        
        {/* Profile Card Header */}
        <section style={{ background: '#FFFFFF', borderRadius: 20, padding: 32, border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', border: '3px solid #EEF2FF', overflow: 'hidden', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <AvatarDisplay avatar={profileObj?.avatar} profileImage={profileObj?.profileImage} />
          </div>

          <div style={{ flexGrow: 1 }}>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#0F172A' }}>{name}</h1>
            <p style={{ margin: '4px 0 12px', fontSize: '0.95rem', color: '#64748B', fontWeight: 500 }}>@{profileObj.username || targetUsername}</p>
            {bio && <p style={{ margin: 0, fontSize: '1rem', color: '#334155', lineHeight: '1.5', maxWidth: 600 }}>{bio}</p>}
          </div>

          {!isPublicView && (
            <button
              onClick={() => setIsPickerOpen(true)}
              style={{ background: '#EEF2FF', color: '#4F46E5', border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', flexShrink: 0 }}
            >
              + Add Block
            </button>
          )}
        </section>

        {/* Bento Grid */}
        <div ref={containerRef} style={{ position: 'relative', minHeight: 400, width: '100%' }}>
          {/* Snap Drag/Resize Translucent Ghost Preview Overlay */}
          {(activeDrag || activeResize) && (() => {
            const targetX = activeDrag ? activeDrag.snapX : (gridBlocks.find(b => b.id === activeResize.blockId)?.x || 0);
            const targetY = activeDrag ? activeDrag.snapY : (gridBlocks.find(b => b.id === activeResize.blockId)?.y || 0);
            const targetW = activeDrag ? activeDrag.w : activeResize.snapW;
            const targetH = activeDrag ? activeDrag.h : activeResize.snapH;

            const gap = 24;
            const colWidth = containerWidth > 0 ? (containerWidth + gap) / GRID_COLUMNS : 240;
            const rowHeight = 160 + gap;

            return (
              <div
                className="bento-grid-ghost-preview"
                style={{
                  position: 'absolute',
                  left: `${targetX * colWidth}px`,
                  top: `${targetY * rowHeight}px`,
                  width: `${targetW * colWidth - gap}px`,
                  height: `${targetH * rowHeight - gap}px`,
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '2px dashed #6366F1',
                  borderRadius: 18,
                  zIndex: 5,
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4F46E5',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  transition: 'all 0.1s ease-out'
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
            gridBlocks.map((block) => {
              const gap = 24;
              const colWidth = containerWidth > 0 ? (containerWidth + gap) / GRID_COLUMNS : 240;
              const rowHeight = 160 + gap;

              const isDragging = draggedBlockId === block.id;
              const isSelected = selectedBlockId === block.id;
              const left = block.x * colWidth;
              const top = block.y * rowHeight;
              const width = block.w * colWidth - gap;
              const height = block.h * rowHeight - gap;

              const config = block.configuration || {};

              return (
                <div
                  key={block.id}
                  className={`bento-block-card ${isDragging ? 'is-dragging' : ''}`}
                  onDoubleClick={(e) => handleBlockDoubleClick(e, block)}
                  onPointerDown={(e) => handlePointerDownBlock(e, block)}
                  onPointerMove={(e) => handlePointerMoveBlock(e, block.id)}
                  onPointerUp={(e) => handlePointerUpBlock(e, block.id)}
                  style={{
                    position: 'absolute',
                    left: `${left}px`,
                    top: `${top}px`,
                    width: `${width}px`,
                    height: `${height}px`,
                    background: config.bg || '#FFFFFF',
                    borderRadius: 18,
                    border: isSelected ? '2px solid #4F46E5' : '1px solid #E2E8F0',
                    boxShadow: isDragging ? '0 20px 35px rgba(0,0,0,0.15)' : (isSelected ? '0 8px 24px rgba(79,70,229,0.15)' : '0 4px 12px rgba(0,0,0,0.03)'),
                    zIndex: isDragging ? 50 : (isSelected ? 10 : 1),
                    transition: isDragging ? 'none' : 'left 0.25s cubic-bezier(0.2,0,0,1), top 0.25s cubic-bezier(0.2,0,0,1), width 0.25s, height 0.25s',
                    padding: 20,
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    overflow: 'hidden',
                    cursor: !isPublicView && !block.locked ? 'grab' : 'default',
                    opacity: block.visibility === false ? 0.6 : 1,
                    userSelect: 'none'
                  }}
                >
                  {/* Status Badges for Owner View */}
                  {!isPublicView && (
                    <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6, zIndex: 12, pointerEvents: 'none' }}>
                      {block.visibility === false && (
                        <span style={{ fontSize: '0.7rem', background: '#FEF2F2', color: '#EF4444', border: '1px solid #FCA5A5', padding: '1px 6px', borderRadius: 6, fontWeight: 700 }}>
                          👁️ Hidden
                        </span>
                      )}
                      {block.locked && (
                        <span style={{ fontSize: '0.7rem', background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', padding: '1px 6px', borderRadius: 6, fontWeight: 700 }}>
                          🔒 Locked
                        </span>
                      )}
                    </div>
                  )}

                  {/* Floating Action Toolbar (Section 11 Specification) */}
                  {!isPublicView && isSelected && (
                    <div
                      className="bento-floating-toolbar"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        top: 12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        background: '#0F172A',
                        padding: '4px 10px',
                        borderRadius: 20,
                        boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
                        zIndex: 30
                      }}
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditDialog(block); }}
                        style={{ background: 'none', border: 'none', color: '#F8FAFC', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', padding: '3px 5px', display: 'flex', alignItems: 'center', gap: 4 }}
                        title="Edit Block (E)"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDuplicateBlock(block); }}
                        style={{ background: 'none', border: 'none', color: '#F8FAFC', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', padding: '3px 5px', display: 'flex', alignItems: 'center', gap: 4 }}
                        title="Duplicate Block (D)"
                      >
                        📋 Duplicate
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleVisibility(block); }}
                        style={{ background: 'none', border: 'none', color: '#F8FAFC', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', padding: '3px 5px', display: 'flex', alignItems: 'center', gap: 4 }}
                        title="Toggle Visibility (H)"
                      >
                        {block.visibility === false ? '👁️ Restore' : '👁️ Hide'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleLock(block); }}
                        style={{ background: 'none', border: 'none', color: '#F8FAFC', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', padding: '3px 5px', display: 'flex', alignItems: 'center', gap: 4 }}
                        title="Toggle Lock (L)"
                      >
                        {block.locked ? '🔓 Unlock' : '🔒 Lock'}
                      </button>
                      <button
                        onClick={(e) => cycleBgColor(e, block)}
                        style={{ background: 'none', border: 'none', color: '#F8FAFC', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', padding: '3px 5px', display: 'flex', alignItems: 'center', gap: 4 }}
                        title="Cycle Card Style Palette"
                      >
                        🎨 Style
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (!block.locked) handleDeleteBlock(block.id); else toast('🔒 Locked block cannot be deleted'); }}
                        style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', padding: '3px 5px', display: 'flex', alignItems: 'center', gap: 4 }}
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
                          boxShadow: '0 2px 8px rgba(239,68,68,0.2)'
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
                          boxShadow: '0 2px 8px rgba(79,70,229,0.2)'
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
                      <span style={{ fontSize: '3.5rem', lineHeight: 1 }}>{config.emoji || '😊'}</span>
                      {config.title && <span style={{ marginTop: 8, fontWeight: 700, fontSize: '0.9rem', color: '#334155' }}>{config.title}</span>}
                    </div>
                  )}

                  {/* Link Card */}
                  {block.blockType === 'link' && (
                    <a
                      href={config.url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '1.5rem' }}>🔗</span>
                        <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', color: '#0F172A' }}>{config.title || 'Link'}</h4>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#4F46E5', fontWeight: 600, fontSize: '0.85rem' }}>
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                          {config.url}
                        </span>
                        <span>↗</span>
                      </div>
                    </a>
                  )}

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
                  {block.blockType === 'checklist' && (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <h4 style={{ margin: '0 0 12px', fontWeight: 700, fontSize: '1.05rem', color: '#0F172A' }}>{config.title || 'Checklist'}</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', flexGrow: 1 }}>
                        {(config.items || []).map((item, idx) => {
                          const itemText = typeof item === 'string' ? item : item.text;
                          const isCompleted = typeof item === 'object' && item.completed;
                          return (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <input
                                type="checkbox"
                                checked={isCompleted}
                                onChange={() => handleToggleCheckitem(block, idx)}
                                style={{ width: 18, height: 18, accentColor: '#4F46E5', cursor: 'pointer' }}
                              />
                              <span style={{ fontSize: '0.9rem', color: isCompleted ? '#94A3B8' : '#334155', textDecoration: isCompleted ? 'line-through' : 'none' }}>
                                {itemText}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Image Card */}
                  {block.blockType === 'image' && (
                    <div style={{ width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
                      <img src={config.imageUrl || config.image} alt={config.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {config.title && (
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: '#FFF', padding: '6px 12px', fontSize: '0.85rem', fontWeight: 600 }}>
                          {config.title}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Social Cards */}
                  {block.blockType === 'instagram' && <InstagramWidget block={block} socialProfile={block.socialProfile} />}
                  {block.blockType === 'github' && <GitHubWidget block={block} socialProfile={block.socialProfile} />}
                  {block.blockType === 'linkedin' && <LinkedInWidget block={block} socialProfile={block.socialProfile} />}
                  {block.blockType === 'youtube' && <YouTubeWidget block={block} socialProfile={block.socialProfile} />}
                  {block.blockType === 'twitter' && <TwitterWidget block={block} socialProfile={block.socialProfile} />}

                  {/* Resize Handles */}
                  {!isPublicView && !block.locked && (
                    <>
                      <div
                        className="bento-card-resize-handle right"
                        onPointerDown={(e) => handlePointerDownResize(e, block, 'right')}
                        onPointerMove={(e) => handlePointerMoveResize(e, block.id)}
                        onPointerUp={(e) => handlePointerUpResize(e, block.id)}
                        style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 10, cursor: 'ew-resize', zIndex: 15 }}
                      />
                      <div
                        className="bento-card-resize-handle bottom"
                        onPointerDown={(e) => handlePointerDownResize(e, block, 'bottom')}
                        onPointerMove={(e) => handlePointerMoveResize(e, block.id)}
                        onPointerUp={(e) => handlePointerUpResize(e, block.id)}
                        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 10, cursor: 'ns-resize', zIndex: 15 }}
                      />
                      <div
                        className="bento-card-resize-handle corner"
                        onPointerDown={(e) => handlePointerDownResize(e, block, 'right-bottom')}
                        onPointerMove={(e) => handlePointerMoveResize(e, block.id)}
                        onPointerUp={(e) => handlePointerUpResize(e, block.id)}
                        style={{ position: 'absolute', right: 0, bottom: 0, width: 14, height: 14, cursor: 'nwse-resize', zIndex: 16 }}
                      />
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

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
                { type: 'emoji', icon: '😊', label: 'Emoji' },
                { type: 'link', icon: '🔗', label: 'Link' },
                { type: 'text', icon: 'Ｔ', label: 'Text' },
                { type: 'checklist', icon: '📋', label: 'Checklist' },
                { type: 'image', icon: '🖼️', label: 'Image Card' },
                { type: 'instagram', icon: '📸', label: 'Instagram' },
                { type: 'github', icon: '💻', label: 'GitHub' },
                { type: 'youtube', icon: '🎥', label: 'YouTube' },
                { type: 'twitter', icon: '🐦', label: 'Twitter / X' },
                { type: 'linkedin', icon: '👥', label: 'LinkedIn' }
              ].map((item) => (
                <div
                  key={item.type}
                  onClick={() => openAddDialog(item.type)}
                  style={{ background: '#F8FAFC', borderRadius: 16, padding: 18, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.transform = 'none'; }}
                >
                  <span style={{ fontSize: '2.2rem', marginBottom: 8 }}>{item.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1E293B' }}>{item.label}</span>
                </div>
              ))}
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
                    {checklistItems.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const newItems = [...checklistItems];
                            newItems[idx] = e.target.value;
                            setChecklistItems(newItems);
                          }}
                          placeholder={`Item ${idx + 1}`}
                          style={{ flexGrow: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                        />
                        {checklistItems.length > 1 && (
                          <button
                            onClick={() => setChecklistItems(checklistItems.filter((_, i) => i !== idx))}
                            style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#EF4444', borderRadius: 8, padding: '0 10px', cursor: 'pointer' }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => setChecklistItems([...checklistItems, ''])}
                      style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#4F46E5', borderRadius: 8, padding: '6px 12px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', marginTop: 4 }}
                    >
                      + Add Item
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
