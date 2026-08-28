import { useState } from 'react';
import { Check, Sun, Moon } from 'lucide-react';
import { COLOR_THEMES } from '../../config/designTokens';

export default function ColorThemeFlyout({ selectedTheme, onSelectTheme }) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'light' | 'dark'

  const lightThemes = COLOR_THEMES.filter(t => t.family === 'light');
  const darkThemes = COLOR_THEMES.filter(t => t.family === 'dark');

  const visibleThemes = activeTab === 'all'
    ? COLOR_THEMES
    : (activeTab === 'light' ? lightThemes : darkThemes);

  return (
    <div className="design-flyout-container" role="region" aria-label="Color Theme Customization">
      {/* Header */}
      <div className="design-flyout-header">
        <div>
          <h3 className="design-flyout-title">Color Theme</h3>
          <p className="design-flyout-subtitle">16 curated palettes for light and dark environments</p>
        </div>

        {/* Family Filter Tabs */}
        <div className="theme-family-filter" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all'}
            className={`theme-filter-pill ${activeTab === 'all' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All (16)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'light'}
            className={`theme-filter-pill ${activeTab === 'light' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('light')}
          >
            <Sun size={13} />
            <span>Light</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'dark'}
            className={`theme-filter-pill ${activeTab === 'dark' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('dark')}
          >
            <Moon size={13} />
            <span>Dark</span>
          </button>
        </div>
      </div>

      {/* Grouped or Filtered Theme Grid */}
      {activeTab === 'all' ? (
        <div className="theme-sections-scrollable">
          {/* Light Section */}
          <div className="theme-group-section">
            <div className="theme-group-label">
              <Sun size={14} className="theme-group-icon icon-sun" />
              <span>Light Family</span>
              <span className="theme-count-badge">8</span>
            </div>
            <div className="theme-swatch-grid">
              {lightThemes.map((theme) => {
                const isSelected = selectedTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    className={`theme-swatch-card ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => onSelectTheme(theme.id)}
                    role="radio"
                    aria-checked={isSelected}
                    title={theme.name}
                  >
                    {/* Swatch 4-dot cluster preview */}
                    <div className="theme-dots-cluster" style={{ background: theme.dots[0], borderColor: theme.dots[1] }}>
                      <span className="theme-dot dot-surface" style={{ background: theme.dots[1] }} />
                      <span className="theme-dot dot-text" style={{ background: theme.dots[2] }} />
                      <span className="theme-dot dot-accent" style={{ background: theme.dots[3] }} />
                      {isSelected && (
                        <div className="theme-selected-check" aria-hidden="true">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <span className="theme-swatch-name">{theme.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dark Section */}
          <div className="theme-group-section" style={{ marginTop: 20 }}>
            <div className="theme-group-label">
              <Moon size={14} className="theme-group-icon icon-moon" />
              <span>Dark Family</span>
              <span className="theme-count-badge">8</span>
            </div>
            <div className="theme-swatch-grid">
              {darkThemes.map((theme) => {
                const isSelected = selectedTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    className={`theme-swatch-card ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => onSelectTheme(theme.id)}
                    role="radio"
                    aria-checked={isSelected}
                    title={theme.name}
                  >
                    {/* Swatch 4-dot cluster preview */}
                    <div className="theme-dots-cluster" style={{ background: theme.dots[0], borderColor: theme.dots[1] }}>
                      <span className="theme-dot dot-surface" style={{ background: theme.dots[1] }} />
                      <span className="theme-dot dot-text" style={{ background: theme.dots[2] }} />
                      <span className="theme-dot dot-accent" style={{ background: theme.dots[3] }} />
                      {isSelected && (
                        <div className="theme-selected-check" aria-hidden="true">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <span className="theme-swatch-name">{theme.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="theme-swatch-grid">
          {visibleThemes.map((theme) => {
            const isSelected = selectedTheme === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                className={`theme-swatch-card ${isSelected ? 'is-selected' : ''}`}
                onClick={() => onSelectTheme(theme.id)}
                role="radio"
                aria-checked={isSelected}
                title={theme.name}
              >
                <div className="theme-dots-cluster" style={{ background: theme.dots[0], borderColor: theme.dots[1] }}>
                  <span className="theme-dot dot-surface" style={{ background: theme.dots[1] }} />
                  <span className="theme-dot dot-text" style={{ background: theme.dots[2] }} />
                  <span className="theme-dot dot-accent" style={{ background: theme.dots[3] }} />
                  {isSelected && (
                    <div className="theme-selected-check" aria-hidden="true">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <span className="theme-swatch-name">{theme.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
