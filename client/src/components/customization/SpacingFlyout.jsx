import { Check } from 'lucide-react';
import { SPACING_OPTIONS } from '../../config/designTokens';

export default function SpacingFlyout({ selectedSpacing, onSelectSpacing }) {
  return (
    <div className="design-flyout-container" role="region" aria-label="Spacing Customization">
      {/* Header */}
      <div className="design-flyout-header">
        <div>
          <h3 className="design-flyout-title">Grid Spacing</h3>
          <p className="design-flyout-subtitle">6 gap densities controlling layout breathing room</p>
        </div>
      </div>

      {/* Spacing Chips Grid */}
      <div className="spacing-chips-grid">
        {SPACING_OPTIONS.map((spacing) => {
          const isSelected = selectedSpacing === spacing.id;

          // Normalized gap scale for the mini-grid visualization
          const visualGap = Math.max(2, Math.round((spacing.px / 40) * 8));

          return (
            <button
              key={spacing.id}
              type="button"
              className={`spacing-chip-btn ${isSelected ? 'is-selected' : ''}`}
              onClick={() => onSelectSpacing(spacing.id)}
              role="radio"
              aria-checked={isSelected}
              title={`${spacing.name} (${spacing.px}px gap)`}
            >
              {/* Mini 3-Block Grid Mockup with Dynamic Gap */}
              <div className="spacing-mock-wrapper">
                <div
                  className="spacing-mini-grid"
                  style={{ gap: `${visualGap}px` }}
                >
                  <div className="mini-grid-cell" />
                  <div className="mini-grid-cell" />
                  <div className="mini-grid-cell span-2" />
                </div>

                {isSelected && (
                  <div className="chip-selected-badge" aria-hidden="true">
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </div>

              {/* Name & Pixel Value */}
              <div className="spacing-chip-details">
                <span className="spacing-chip-name">{spacing.name}</span>
                <span className="spacing-chip-px">{spacing.px}px</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
