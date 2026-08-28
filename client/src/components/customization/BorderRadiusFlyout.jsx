import { Check } from 'lucide-react';
import { BORDER_RADIUS_OPTIONS } from '../../config/designTokens';

export default function BorderRadiusFlyout({ selectedRadius, onSelectRadius }) {
  return (
    <div className="design-flyout-container" role="region" aria-label="Border Radius Customization">
      {/* Header */}
      <div className="design-flyout-header">
        <div>
          <h3 className="design-flyout-title">Border Radius</h3>
          <p className="design-flyout-subtitle">8 corner curvatures for Bento profile cards and widgets</p>
        </div>
      </div>

      {/* Radius Chips Grid */}
      <div className="radius-chips-grid">
        {BORDER_RADIUS_OPTIONS.map((radius) => {
          const isSelected = selectedRadius === radius.id;

          return (
            <button
              key={radius.id}
              type="button"
              className={`radius-chip-btn ${isSelected ? 'is-selected' : ''}`}
              onClick={() => onSelectRadius(radius.id)}
              role="radio"
              aria-checked={isSelected}
              title={`${radius.name} (${radius.value})`}
            >
              {/* Visual Card Shape Swatch */}
              <div className="radius-swatch-container">
                <div
                  className="radius-swatch-box"
                  style={{
                    borderRadius: radius.previewRadius === 999 ? '999px' : `${radius.previewRadius}px`
                  }}
                >
                  <div className="radius-inner-indicator" />
                </div>

                {isSelected && (
                  <div className="chip-selected-badge" aria-hidden="true">
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </div>

              {/* Name & Pixel Value */}
              <div className="radius-chip-details">
                <span className="radius-chip-name">{radius.name}</span>
                <span className="radius-chip-px">{radius.value}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
