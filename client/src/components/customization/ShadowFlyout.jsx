import { Check } from 'lucide-react';
import { SHADOW_OPTIONS } from '../../config/designTokens';

export default function ShadowFlyout({ selectedShadow, onSelectShadow }) {
  return (
    <div className="design-flyout-container" role="region" aria-label="Shadow Customization">
      {/* Header */}
      <div className="design-flyout-header">
        <div>
          <h3 className="design-flyout-title">Shadow & Depth</h3>
          <p className="design-flyout-subtitle">8 elevation levels from ultra-flat to high-dimension</p>
        </div>
      </div>

      {/* Shadow Chips Grid */}
      <div className="shadow-chips-grid">
        {SHADOW_OPTIONS.map((shadow) => {
          const isSelected = selectedShadow === shadow.id;

          return (
            <button
              key={shadow.id}
              type="button"
              className={`shadow-chip-btn ${isSelected ? 'is-selected' : ''}`}
              onClick={() => onSelectShadow(shadow.id)}
              role="radio"
              aria-checked={isSelected}
              title={`${shadow.name}: ${shadow.description}`}
            >
              {/* Mini Elevated Card Mock */}
              <div className="shadow-mock-wrapper">
                <div
                  className={`shadow-mock-card shadow-type-${shadow.id}`}
                  style={{ boxShadow: shadow.previewBoxShadow }}
                >
                  <div className="shadow-mock-line" />
                </div>

                {isSelected && (
                  <div className="chip-selected-badge" aria-hidden="true">
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </div>

              {/* Text Info */}
              <div className="shadow-chip-details">
                <span className="shadow-chip-name">{shadow.name}</span>
                <span className="shadow-chip-desc">{shadow.description}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
