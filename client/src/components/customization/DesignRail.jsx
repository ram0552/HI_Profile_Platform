import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Sparkles } from 'lucide-react';
import { RAIL_CATEGORIES, RESET_ACTION } from '../../config/designRailConfig';

export default function DesignRail({
  customization,
  onUpdateCustomization,
  onResetToDefault,
  saveStatus = 'saved' // 'saved' | 'saving'
}) {
  const [hoveredCategoryId, setHoveredCategoryId] = useState(null);
  const [pinnedCategoryId, setPinnedCategoryId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  const closeTimerRef = useRef(null);
  const railContainerRef = useRef(null);
  const iconRefs = useRef({});

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const activeCategoryId = pinnedCategoryId || (!isMobile ? hoveredCategoryId : null);

  // Mouse leave with grace-period timeout (200ms)
  const handleMouseLeave = () => {
    if (pinnedCategoryId) return; // Keep open if pinned
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setHoveredCategoryId(null);
    }, 220);
  };

  const handleMouseEnter = (catId) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (!pinnedCategoryId) {
      setHoveredCategoryId(catId);
    }
  };

  const handleIconClick = (catId) => {
    if (pinnedCategoryId === catId) {
      // Toggle off
      setPinnedCategoryId(null);
      setHoveredCategoryId(null);
    } else {
      // Pin open
      setPinnedCategoryId(catId);
      setHoveredCategoryId(null);
    }
  };

  const handleCloseFlyout = useCallback(() => {
    setPinnedCategoryId(null);
    setHoveredCategoryId(null);
  }, []);

  // Click outside to close pinned flyout
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        railContainerRef.current &&
        !railContainerRef.current.contains(e.target) &&
        !e.target.closest('.design-bottom-sheet') &&
        !e.target.closest('.design-flyout-popover')
      ) {
        handleCloseFlyout();
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [handleCloseFlyout]);

  // Keyboard navigation & Escape handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (activeCategoryId) {
          e.preventDefault();
          const targetCat = activeCategoryId;
          handleCloseFlyout();
          iconRefs.current[targetCat]?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCategoryId, handleCloseFlyout]);

  // Arrow key navigation between rail icons
  const handleRailKeyDown = (e, index) => {
    const totalItems = RAIL_CATEGORIES.length + 1; // including reset
    const allIds = [...RAIL_CATEGORIES.map(c => c.id), RESET_ACTION.id];

    let nextIndex = null;

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      nextIndex = (index + 1) % totalItems;
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIndex = (index - 1 + totalItems) % totalItems;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = totalItems - 1;
    }

    if (nextIndex !== null) {
      const nextId = allIds[nextIndex];
      iconRefs.current[nextId]?.focus();
    }
  };

  // Find active category configuration
  const activeCategory = RAIL_CATEGORIES.find(c => c.id === activeCategoryId);
  const FlyoutComponent = activeCategory?.FlyoutComponent;

  return (
    <aside
      ref={railContainerRef}
      className={`bento-design-rail-container ${isMobile ? 'is-mobile' : 'is-desktop'}`}
      onMouseEnter={() => {
        if (closeTimerRef.current) {
          clearTimeout(closeTimerRef.current);
          closeTimerRef.current = null;
        }
      }}
      onMouseLeave={handleMouseLeave}
      aria-label="Profile Customization Rail"
    >
      {/* Floating Rail Pill */}
      <nav className="bento-design-rail-track" role="toolbar" aria-label="Design tools">
        {RAIL_CATEGORIES.map((cat, idx) => {
          const IconComp = cat.icon;
          const isActive = activeCategoryId === cat.id;
          const isPinned = pinnedCategoryId === cat.id;

          return (
            <div key={cat.id} className="rail-item-wrapper">
              <button
                ref={el => iconRefs.current[cat.id] = el}
                type="button"
                className={`rail-icon-btn ${isActive ? 'is-active' : ''} ${isPinned ? 'is-pinned' : ''}`}
                onClick={() => handleIconClick(cat.id)}
                onMouseEnter={() => handleMouseEnter(cat.id)}
                onKeyDown={(e) => handleRailKeyDown(e, idx)}
                title={`${cat.title} ${isPinned ? '(Pinned)' : ''}`}
                aria-label={cat.title}
                aria-expanded={isActive}
                aria-haspopup="dialog"
              >
                <span className="rail-icon-inner">
                  <IconComp size={20} />
                </span>
                {isActive && <span className="rail-active-indicator" aria-hidden="true" />}
              </button>

              {/* Desktop Tooltip (visible on simple hover when not open) */}
              {!isMobile && !activeCategoryId && (
                <div className="rail-tooltip" role="tooltip">
                  {cat.title}
                </div>
              )}
            </div>
          );
        })}

        {/* Separator before Reset Button */}
        <div className="rail-divider" role="separator" />

        {/* Global Reset Button */}
        <div className="rail-item-wrapper">
          <button
            ref={el => iconRefs.current[RESET_ACTION.id] = el}
            type="button"
            className="rail-icon-btn rail-reset-btn"
            onClick={() => {
              onResetToDefault();
              handleCloseFlyout();
            }}
            onKeyDown={(e) => handleRailKeyDown(e, RAIL_CATEGORIES.length)}
            title="Reset All to Default"
            aria-label="Reset all design customizations to default"
          >
            <span className="rail-icon-inner">
              <RESET_ACTION.icon size={19} />
            </span>
          </button>
          {!isMobile && !activeCategoryId && (
            <div className="rail-tooltip" role="tooltip">
              Reset to Default
            </div>
          )}
        </div>
      </nav>

      {/* Flyout Panel (Desktop: Floating Left Beside Rail) */}
      {!isMobile && activeCategory && FlyoutComponent && (
        <div
          className="design-flyout-popover animate-flyout-in"
          role="dialog"
          aria-modal="false"
          aria-label={activeCategory.title}
          onMouseEnter={() => {
            if (closeTimerRef.current) {
              clearTimeout(closeTimerRef.current);
              closeTimerRef.current = null;
            }
          }}
          onMouseLeave={handleMouseLeave}
        >
          {/* Header Action / Pin Indicator & Close */}
          <div className="flyout-top-chrome">
            <div className="flyout-pin-status">
              <span className="flyout-status-dot" />
              <span>{pinnedCategoryId ? 'Pinned Open' : 'Hover Preview'}</span>
            </div>
            <button
              type="button"
              className="flyout-close-btn"
              onClick={handleCloseFlyout}
              title="Close panel (Esc)"
              aria-label="Close panel"
            >
              <X size={15} />
            </button>
          </div>

          {/* Flyout Specific Category Body */}
          <div className="flyout-content-scroll">
            {activeCategory.id === 'style' && (
              <FlyoutComponent
                selectedStyle={customization.designStyle}
                onSelectStyle={(id) => onUpdateCustomization({ designStyle: id })}
                isMobile={false}
              />
            )}
            {activeCategory.id === 'theme' && (
              <FlyoutComponent
                selectedTheme={customization.colorTheme}
                onSelectTheme={(id) => onUpdateCustomization({ colorTheme: id })}
              />
            )}
            {activeCategory.id === 'typography' && (
              <FlyoutComponent
                selectedFont={customization.typography}
                onSelectFont={(id) => onUpdateCustomization({ typography: id })}
              />
            )}
            {activeCategory.id === 'radius' && (
              <FlyoutComponent
                selectedRadius={customization.borderRadius}
                onSelectRadius={(id) => onUpdateCustomization({ borderRadius: id })}
              />
            )}
            {activeCategory.id === 'shadow' && (
              <FlyoutComponent
                selectedShadow={customization.shadow}
                onSelectShadow={(id) => onUpdateCustomization({ shadow: id })}
              />
            )}
            {activeCategory.id === 'spacing' && (
              <FlyoutComponent
                selectedSpacing={customization.spacing}
                onSelectSpacing={(id) => onUpdateCustomization({ spacing: id })}
              />
            )}
          </div>
        </div>
      )}

      {/* Mobile Bottom Sheet (Mobile Viewport) */}
      {isMobile && activeCategory && FlyoutComponent && (
        <div className="design-bottom-sheet-backdrop" onClick={handleCloseFlyout}>
          <div
            className="design-bottom-sheet animate-sheet-slideup"
            role="dialog"
            aria-modal="true"
            aria-label={activeCategory.title}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Swipe / Drag Handle */}
            <div className="bottom-sheet-handle-bar">
              <div className="bottom-sheet-drag-pill" />
            </div>

            {/* Sheet Header */}
            <div className="bottom-sheet-header">
              <div className="bottom-sheet-title-group">
                <span className="bottom-sheet-title">{activeCategory.title}</span>
                <span className="bottom-sheet-subtitle">{activeCategory.shortTitle}</span>
              </div>
              <button
                type="button"
                className="sheet-close-btn"
                onClick={handleCloseFlyout}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sheet Body */}
            <div className="bottom-sheet-body">
              {activeCategory.id === 'style' && (
                <FlyoutComponent
                  selectedStyle={customization.designStyle}
                  onSelectStyle={(id) => onUpdateCustomization({ designStyle: id })}
                  isMobile={true}
                />
              )}
              {activeCategory.id === 'theme' && (
                <FlyoutComponent
                  selectedTheme={customization.colorTheme}
                  onSelectTheme={(id) => onUpdateCustomization({ colorTheme: id })}
                />
              )}
              {activeCategory.id === 'typography' && (
                <FlyoutComponent
                  selectedFont={customization.typography}
                  onSelectFont={(id) => onUpdateCustomization({ typography: id })}
                />
              )}
              {activeCategory.id === 'radius' && (
                <FlyoutComponent
                  selectedRadius={customization.borderRadius}
                  onSelectRadius={(id) => onUpdateCustomization({ borderRadius: id })}
                />
              )}
              {activeCategory.id === 'shadow' && (
                <FlyoutComponent
                  selectedShadow={customization.shadow}
                  onSelectShadow={(id) => onUpdateCustomization({ shadow: id })}
                />
              )}
              {activeCategory.id === 'spacing' && (
                <FlyoutComponent
                  selectedSpacing={customization.spacing}
                  onSelectSpacing={(id) => onUpdateCustomization({ spacing: id })}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
