import { useRef, useEffect } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { DESIGN_STYLES } from '../../config/designTokens';

export default function DesignStyleFlyout({ selectedStyle, onSelectStyle, isMobile }) {
  const scrollRef = useRef(null);

  const handleScroll = (direction) => {
    if (!scrollRef.current) return;
    const scrollAmount = direction === 'left' ? -260 : 260;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIdx = (index + 1) % DESIGN_STYLES.length;
      document.getElementById(`style-card-${DESIGN_STYLES[nextIdx].id}`)?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIdx = (index - 1 + DESIGN_STYLES.length) % DESIGN_STYLES.length;
      document.getElementById(`style-card-${DESIGN_STYLES[prevIdx].id}`)?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      document.getElementById(`style-card-${DESIGN_STYLES[0].id}`)?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      document.getElementById(`style-card-${DESIGN_STYLES[DESIGN_STYLES.length - 1].id}`)?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectStyle(DESIGN_STYLES[index].id);
    }
  };

  return (
    <div className="design-flyout-container" role="region" aria-label="Design Style Customization">
      {/* Header */}
      <div className="design-flyout-header">
        <div>
          <h3 className="design-flyout-title">Design Style</h3>
          <p className="design-flyout-subtitle">12 distinct aesthetic treatments for card surfaces and depths</p>
        </div>
        {!isMobile && (
          <div className="design-carousel-arrows">
            <button
              type="button"
              className="design-arrow-btn"
              onClick={() => handleScroll('left')}
              title="Scroll left"
              aria-label="Scroll styles left"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="design-arrow-btn"
              onClick={() => handleScroll('right')}
              title="Scroll right"
              aria-label="Scroll styles right"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Carousel of 12 Style Cards */}
      <div className="design-styles-carousel" ref={scrollRef} tabIndex={-1}>
        {DESIGN_STYLES.map((style, idx) => {
          const isSelected = selectedStyle === style.id;

          return (
            <div
              key={style.id}
              id={`style-card-${style.id}`}
              className={`design-style-card ${isSelected ? 'is-selected' : ''} style-type-${style.id}`}
              onClick={() => onSelectStyle(style.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
            >
              {/* Card Mini Live Bento Mockup Preview */}
              <div className="design-style-mockup-wrapper">
                <div className={`style-mock-canvas style-canvas-${style.id}`}>
                  {/* Mini Bento Hero Mock */}
                  <div className="style-mock-hero">
                    <div className="style-mock-avatar" />
                    <div className="style-mock-lines">
                      <div className="style-mock-line line-title" />
                      <div className="style-mock-line line-sub" />
                    </div>
                  </div>

                  {/* Mini Bento Grid Blocks */}
                  <div className="style-mock-grid">
                    <div className="style-mock-block block-left">
                      <div className="style-mock-dot" />
                    </div>
                    <div className="style-mock-block block-right">
                      <div className="style-mock-badge" />
                    </div>
                  </div>
                </div>

                {/* Selected Checkmark Badge */}
                {isSelected && (
                  <div className="design-selected-badge" aria-hidden="true">
                    <Check size={13} strokeWidth={3} />
                  </div>
                )}

                {/* Style Category Badge */}
                {style.badge && (
                  <span className="design-style-badge-tag">{style.badge}</span>
                )}
              </div>

              {/* Style Card Label & Tagline */}
              <div className="design-style-card-info">
                <div className="design-style-card-name">
                  <span>{style.name}</span>
                  {isSelected && <span className="active-dot" />}
                </div>
                <div className="design-style-card-tagline">{style.tagline}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
