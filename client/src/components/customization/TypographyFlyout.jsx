import { useState } from 'react';
import { Check } from 'lucide-react';
import { TYPOGRAPHY_OPTIONS } from '../../config/designTokens';

export default function TypographyFlyout({ selectedFont, onSelectFont }) {
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Modern Sans', 'Serif / Editorial', 'Monospace / Technical', 'Display / Expressive'];

  const filteredFonts = activeCategory === 'All'
    ? TYPOGRAPHY_OPTIONS
    : TYPOGRAPHY_OPTIONS.filter(f => f.category === activeCategory);

  return (
    <div className="design-flyout-container" role="region" aria-label="Typography Customization">
      {/* Header */}
      <div className="design-flyout-header">
        <div>
          <h3 className="design-flyout-title">Typography</h3>
          <p className="design-flyout-subtitle">13 curated typefaces loaded with real bio preview</p>
        </div>
      </div>

      {/* Category Pills */}
      <div className="typography-category-bar" role="tablist">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={activeCategory === cat}
            className={`typo-cat-pill ${activeCategory === cat ? 'is-active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Font List Rows */}
      <div className="typography-list-scrollable">
        {filteredFonts.map((font) => {
          const isSelected = selectedFont === font.id;

          return (
            <div
              key={font.id}
              className={`typography-row-item ${isSelected ? 'is-selected' : ''}`}
              onClick={() => onSelectFont(font.id)}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectFont(font.id);
                }
              }}
            >
              {/* Left Sample Glyph Box */}
              <div
                className="typo-glyph-box"
                style={{ fontFamily: font.fontFamily }}
                aria-hidden="true"
              >
                {font.sampleGlyph}
              </div>

              {/* Middle Font Info & Live Preview */}
              <div className="typo-details">
                <div className="typo-title-row">
                  <span
                    className="typo-name"
                    style={{ fontFamily: font.fontFamily }}
                  >
                    {font.name}
                  </span>
                  <span className="typo-badge">{font.category}</span>
                </div>

                <div
                  className="typo-preview-sentence"
                  style={{ fontFamily: font.fontFamily }}
                >
                  {font.previewText}
                </div>
              </div>

              {/* Right Selection Indicator */}
              <div className="typo-select-radio">
                {isSelected && (
                  <div className="typo-check-badge">
                    <Check size={13} strokeWidth={3} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
