/**
 * Hi-Profile Bento Customization Tokens & Presets
 * Single source of truth for Design Style, Color Theme, Typography, Border Radius, Shadow, and Spacing.
 */

// 1. DESIGN STYLES (12 Options)
export const DESIGN_STYLES = [
  {
    id: 'classic',
    name: 'Classic',
    tagline: 'Clean, balanced, conventional cards with refined borders',
    badge: 'Popular',
    preview: {
      bg: '#FFFFFF',
      border: '1px solid rgba(226, 232, 240, 0.9)',
      shadow: '0 4px 16px rgba(15, 23, 42, 0.05)',
      accent: '#4F46E5'
    }
  },
  {
    id: 'glass',
    name: 'Glassmorphism',
    tagline: 'Frosted-glass surfaces, optical blur & luminous edges',
    badge: 'Glass',
    preview: {
      bg: 'rgba(255, 255, 255, 0.65)',
      backdropBlur: '16px',
      border: '1px solid rgba(255, 255, 255, 0.8)',
      shadow: '0 8px 32px rgba(31, 38, 135, 0.08)',
      accent: '#6366F1'
    }
  },
  {
    id: 'brutalist',
    name: 'Neo-Brutalist',
    tagline: 'Bold solid borders, high contrast & hard offset depth',
    badge: 'Retro',
    preview: {
      bg: '#FFFFFF',
      border: '2.5px solid #0F172A',
      shadow: '4px 4px 0px #0F172A',
      accent: '#F59E0B'
    }
  },
  {
    id: 'elevated',
    name: 'Elevated',
    tagline: 'Floating cards, multi-tier soft ambient depth',
    badge: 'Modern',
    preview: {
      bg: '#FFFFFF',
      border: '1px solid rgba(226, 232, 240, 0.6)',
      shadow: '0 20px 35px -8px rgba(15, 23, 42, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.04)',
      accent: '#8B5CF6'
    }
  },
  {
    id: 'minimal',
    name: 'Minimal',
    tagline: 'Near-invisible chrome, maximum whitespace, content-first',
    badge: 'Clean',
    preview: {
      bg: 'rgba(255, 255, 255, 0.85)',
      border: '1px solid rgba(226, 232, 240, 0.4)',
      shadow: 'none',
      accent: '#64748B'
    }
  },
  {
    id: 'outline',
    name: 'Outline',
    tagline: 'Transparent card fills, uniform hairline wireframe feel',
    badge: 'Wireframe',
    preview: {
      bg: 'transparent',
      border: '1.5px solid rgba(148, 163, 184, 0.5)',
      shadow: 'none',
      accent: '#3B82F6'
    }
  },
  {
    id: 'softUI',
    name: 'Soft UI (Neumorphic)',
    tagline: 'Low-contrast surfaces with dual inset/outset bevel shadows',
    badge: 'Soft',
    preview: {
      bg: '#F1F5F9',
      border: '1px solid rgba(255, 255, 255, 0.8)',
      shadow: '6px 6px 14px rgba(148, 163, 184, 0.35), -6px -6px 14px #FFFFFF',
      accent: '#6366F1'
    }
  },
  {
    id: 'retroTerminal',
    name: 'Retro Terminal',
    tagline: 'Monospace phosphor glow, CRT cyber scanline accents',
    badge: 'Cyber',
    preview: {
      bg: '#0D1117',
      border: '1.5px solid #16A34A',
      shadow: '0 0 16px rgba(34, 197, 94, 0.25)',
      accent: '#22C55E'
    }
  },
  {
    id: 'gradientMesh',
    name: 'Gradient Mesh',
    tagline: 'Luminescent multi-stop color transitions & radiant glows',
    badge: 'Vibrant',
    preview: {
      bg: 'linear-gradient(135deg, rgba(238, 242, 255, 0.95) 0%, rgba(253, 242, 248, 0.95) 100%)',
      border: '1px solid rgba(199, 210, 254, 0.6)',
      shadow: '0 10px 25px -5px rgba(99, 102, 241, 0.12)',
      accent: '#EC4899'
    }
  },
  {
    id: 'editorial',
    name: 'Editorial',
    tagline: 'Magazine layout emphasis, refined rules & generous margins',
    badge: 'Editorial',
    preview: {
      bg: '#FCFAF7',
      border: '1px solid #E7E5E4',
      shadow: '0 2px 8px rgba(28, 25, 23, 0.04)',
      accent: '#B45309'
    }
  },
  {
    id: 'duotone',
    name: 'Duotone',
    tagline: 'Two-tone flat color treatment per card, poster-like look',
    badge: 'Graphic',
    preview: {
      bg: '#EEF2FF',
      border: '2px solid #4F46E5',
      shadow: 'none',
      accent: '#4F46E5'
    }
  },
  {
    id: 'frostedDark',
    name: 'Frosted Dark',
    tagline: 'Deep obsidian glass tuned for dark backgrounds & neon contrast',
    badge: 'Dark Glass',
    preview: {
      bg: 'rgba(15, 23, 42, 0.78)',
      backdropBlur: '20px',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      shadow: '0 12px 36px rgba(0, 0, 0, 0.4)',
      accent: '#38BDF8'
    }
  }
];

// 2. COLOR THEMES (16 Options: 8 Light + 8 Dark)
export const COLOR_THEMES = [
  // --- LIGHT FAMILY ---
  {
    id: 'default',
    name: 'Default Light',
    family: 'light',
    dots: ['#F8FAFC', '#FFFFFF', '#0F172A', '#4F46E5'],
    vars: {
      '--bento-canvas-bg': '#F8FAFC',
      '--bento-surface-bg': '#FFFFFF',
      '--bento-text-primary': '#0F172A',
      '--bento-text-secondary': '#64748B',
      '--bento-accent': '#4F46E5',
      '--bento-accent-light': '#EEF2FF',
      '--bento-accent-glow': 'rgba(79, 70, 229, 0.25)',
      '--bento-border-color': '#E2E8F0',
      '--bento-hero-gradient': 'linear-gradient(135deg, #6366F1 0%, #A855F7 50%, #EC4899 100%)'
    }
  },
  {
    id: 'sunset',
    name: 'Sunset Gold',
    family: 'light',
    dots: ['#FAF7F2', '#FFFDF9', '#1C1917', '#EA580C'],
    vars: {
      '--bento-canvas-bg': '#FAF7F2',
      '--bento-surface-bg': '#FFFDF9',
      '--bento-text-primary': '#1C1917',
      '--bento-text-secondary': '#78716C',
      '--bento-accent': '#EA580C',
      '--bento-accent-light': '#FFEDD5',
      '--bento-accent-glow': 'rgba(234, 88, 12, 0.25)',
      '--bento-border-color': '#E7E5E4',
      '--bento-hero-gradient': 'linear-gradient(135deg, #F59E0B 0%, #EA580C 50%, #DC2626 100%)'
    }
  },
  {
    id: 'rose',
    name: 'Rose Pastel',
    family: 'light',
    dots: ['#FFF1F2', '#FFFFFF', '#1F2937', '#E11D48'],
    vars: {
      '--bento-canvas-bg': '#FFF1F2',
      '--bento-surface-bg': '#FFFFFF',
      '--bento-text-primary': '#1F2937',
      '--bento-text-secondary': '#9F1239',
      '--bento-accent': '#E11D48',
      '--bento-accent-light': '#FFE4E6',
      '--bento-accent-glow': 'rgba(225, 29, 72, 0.25)',
      '--bento-border-color': '#FECDD3',
      '--bento-hero-gradient': 'linear-gradient(135deg, #FB7185 0%, #E11D48 50%, #BE123C 100%)'
    }
  },
  {
    id: 'skyBreeze',
    name: 'Sky Breeze',
    family: 'light',
    dots: ['#F0F9FF', '#FFFFFF', '#0C4A6E', '#0284C7'],
    vars: {
      '--bento-canvas-bg': '#F0F9FF',
      '--bento-surface-bg': '#FFFFFF',
      '--bento-text-primary': '#0C4A6E',
      '--bento-text-secondary': '#0369A1',
      '--bento-accent': '#0284C7',
      '--bento-accent-light': '#E0F2FE',
      '--bento-accent-glow': 'rgba(2, 132, 199, 0.25)',
      '--bento-border-color': '#BAE6FD',
      '--bento-hero-gradient': 'linear-gradient(135deg, #38BDF8 0%, #0284C7 50%, #0369A1 100%)'
    }
  },
  {
    id: 'sandNeutral',
    name: 'Sand Neutral',
    family: 'light',
    dots: ['#F5F3EF', '#FAF8F5', '#292524', '#B45309'],
    vars: {
      '--bento-canvas-bg': '#F5F3EF',
      '--bento-surface-bg': '#FAF8F5',
      '--bento-text-primary': '#292524',
      '--bento-text-secondary': '#78716C',
      '--bento-accent': '#B45309',
      '--bento-accent-light': '#FEF3C7',
      '--bento-accent-glow': 'rgba(180, 83, 9, 0.22)',
      '--bento-border-color': '#E7E5E4',
      '--bento-hero-gradient': 'linear-gradient(135deg, #D97706 0%, #B45309 50%, #78350F 100%)'
    }
  },
  {
    id: 'mintFresh',
    name: 'Mint Fresh',
    family: 'light',
    dots: ['#F0FDF4', '#FFFFFF', '#064E3B', '#059669'],
    vars: {
      '--bento-canvas-bg': '#F0FDF4',
      '--bento-surface-bg': '#FFFFFF',
      '--bento-text-primary': '#064E3B',
      '--bento-text-secondary': '#047857',
      '--bento-accent': '#059669',
      '--bento-accent-light': '#DCFCE7',
      '--bento-accent-glow': 'rgba(5, 150, 105, 0.25)',
      '--bento-border-color': '#A7F3D0',
      '--bento-hero-gradient': 'linear-gradient(135deg, #34D399 0%, #059669 50%, #047857 100%)'
    }
  },
  {
    id: 'lavenderMist',
    name: 'Lavender Mist',
    family: 'light',
    dots: ['#FAF5FF', '#FFFFFF', '#3B0764', '#9333EA'],
    vars: {
      '--bento-canvas-bg': '#FAF5FF',
      '--bento-surface-bg': '#FFFFFF',
      '--bento-text-primary': '#3B0764',
      '--bento-text-secondary': '#6B21A8',
      '--bento-accent': '#9333EA',
      '--bento-accent-light': '#F3E8FF',
      '--bento-accent-glow': 'rgba(147, 51, 234, 0.25)',
      '--bento-border-color': '#E9D5FF',
      '--bento-hero-gradient': 'linear-gradient(135deg, #C084FC 0%, #9333EA 50%, #6B21A8 100%)'
    }
  },
  {
    id: 'peachCream',
    name: 'Peach Cream',
    family: 'light',
    dots: ['#FFF7ED', '#FFFFFF', '#431407', '#FB923C'],
    vars: {
      '--bento-canvas-bg': '#FFF7ED',
      '--bento-surface-bg': '#FFFFFF',
      '--bento-text-primary': '#431407',
      '--bento-text-secondary': '#9A3412',
      '--bento-accent': '#EA580C',
      '--bento-accent-light': '#FFEDD5',
      '--bento-accent-glow': 'rgba(251, 146, 60, 0.28)',
      '--bento-border-color': '#FED7AA',
      '--bento-hero-gradient': 'linear-gradient(135deg, #FDBA74 0%, #FB923C 50%, #EA580C 100%)'
    }
  },

  // --- DARK FAMILY ---
  {
    id: 'midnight',
    name: 'Midnight Dark',
    family: 'dark',
    dots: ['#0B0F19', '#151D2E', '#F8FAFC', '#6366F1'],
    vars: {
      '--bento-canvas-bg': '#0B0F19',
      '--bento-surface-bg': '#151D2E',
      '--bento-text-primary': '#F8FAFC',
      '--bento-text-secondary': '#94A3B8',
      '--bento-accent': '#6366F1',
      '--bento-accent-light': '#1E1B4B',
      '--bento-accent-glow': 'rgba(99, 102, 241, 0.35)',
      '--bento-border-color': '#1E293B',
      '--bento-hero-gradient': 'linear-gradient(135deg, #6366F1 0%, #4F46E5 50%, #3730A3 100%)'
    }
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    family: 'dark',
    dots: ['#09090B', '#12111A', '#FAFAFA', '#06B6D4'],
    vars: {
      '--bento-canvas-bg': '#09090B',
      '--bento-surface-bg': '#12111A',
      '--bento-text-primary': '#FAFAFA',
      '--bento-text-secondary': '#A1A1AA',
      '--bento-accent': '#06B6D4',
      '--bento-accent-light': '#164E63',
      '--bento-accent-glow': 'rgba(6, 182, 212, 0.4)',
      '--bento-border-color': '#27272A',
      '--bento-hero-gradient': 'linear-gradient(135deg, #06B6D4 0%, #EC4899 50%, #8B5CF6 100%)'
    }
  },
  {
    id: 'emerald',
    name: 'Emerald Forest',
    family: 'dark',
    dots: ['#041A12', '#0B291D', '#ECFDF5', '#10B981'],
    vars: {
      '--bento-canvas-bg': '#041A12',
      '--bento-surface-bg': '#0B291D',
      '--bento-text-primary': '#ECFDF5',
      '--bento-text-secondary': '#6EE7B7',
      '--bento-accent': '#10B981',
      '--bento-accent-light': '#064E3B',
      '--bento-accent-glow': 'rgba(16, 185, 129, 0.35)',
      '--bento-border-color': '#065F46',
      '--bento-hero-gradient': 'linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)'
    }
  },
  {
    id: 'royalPurple',
    name: 'Royal Purple',
    family: 'dark',
    dots: ['#10081C', '#1C1030', '#FAF5FF', '#A855F7'],
    vars: {
      '--bento-canvas-bg': '#10081C',
      '--bento-surface-bg': '#1C1030',
      '--bento-text-primary': '#FAF5FF',
      '--bento-text-secondary': '#D8B4FE',
      '--bento-accent': '#A855F7',
      '--bento-accent-light': '#581C87',
      '--bento-accent-glow': 'rgba(168, 85, 247, 0.35)',
      '--bento-border-color': '#3B1D66',
      '--bento-hero-gradient': 'linear-gradient(135deg, #C084FC 0%, #A855F7 50%, #7E22CE 100%)'
    }
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    family: 'dark',
    dots: ['#09090B', '#141417', '#F4F4F5', '#FAFAFA'],
    vars: {
      '--bento-canvas-bg': '#09090B',
      '--bento-surface-bg': '#141417',
      '--bento-text-primary': '#F4F4F5',
      '--bento-text-secondary': '#71717A',
      '--bento-accent': '#FAFAFA',
      '--bento-accent-light': '#27272A',
      '--bento-accent-glow': 'rgba(250, 250, 250, 0.25)',
      '--bento-border-color': '#27272A',
      '--bento-hero-gradient': 'linear-gradient(135deg, #E4E4E7 0%, #A1A1AA 50%, #52525B 100%)'
    }
  },
  {
    id: 'crimsonEmber',
    name: 'Crimson Ember',
    family: 'dark',
    dots: ['#140507', '#220B0E', '#FFF1F2', '#EF4444'],
    vars: {
      '--bento-canvas-bg': '#140507',
      '--bento-surface-bg': '#220B0E',
      '--bento-text-primary': '#FFF1F2',
      '--bento-text-secondary': '#FDA4AF',
      '--bento-accent': '#EF4444',
      '--bento-accent-light': '#4C0519',
      '--bento-accent-glow': 'rgba(239, 68, 68, 0.35)',
      '--bento-border-color': '#4C0519',
      '--bento-hero-gradient': 'linear-gradient(135deg, #F87171 0%, #EF4444 50%, #991B1B 100%)'
    }
  },
  {
    id: 'oceanDepth',
    name: 'Ocean Depth',
    family: 'dark',
    dots: ['#07131E', '#0E2235', '#F0FDFA', '#0D9488'],
    vars: {
      '--bento-canvas-bg': '#07131E',
      '--bento-surface-bg': '#0E2235',
      '--bento-text-primary': '#F0FDFA',
      '--bento-text-secondary': '#5EEAD4',
      '--bento-accent': '#0D9488',
      '--bento-accent-light': '#134E4A',
      '--bento-accent-glow': 'rgba(13, 148, 136, 0.35)',
      '--bento-border-color': '#115E59',
      '--bento-hero-gradient': 'linear-gradient(135deg, #2DD4BF 0%, #0D9488 50%, #115E59 100%)'
    }
  },
  {
    id: 'graphiteSteel',
    name: 'Graphite Steel',
    family: 'dark',
    dots: ['#121417', '#1E2228', '#F1F5F9', '#38BDF8'],
    vars: {
      '--bento-canvas-bg': '#121417',
      '--bento-surface-bg': '#1E2228',
      '--bento-text-primary': '#F1F5F9',
      '--bento-text-secondary': '#94A3B8',
      '--bento-accent': '#38BDF8',
      '--bento-accent-light': '#0C4A6E',
      '--bento-accent-glow': 'rgba(56, 189, 248, 0.35)',
      '--bento-border-color': '#334155',
      '--bento-hero-gradient': 'linear-gradient(135deg, #38BDF8 0%, #0284C7 50%, #1E3A8A 100%)'
    }
  }
];

// 3. TYPOGRAPHY (13 Options in 4 Categories)
export const TYPOGRAPHY_OPTIONS = [
  // Modern Sans
  {
    id: 'inter',
    name: 'Inter',
    category: 'Modern Sans',
    fontFamily: "'Inter', sans-serif",
    previewText: 'Designing intuitive tools for creators',
    sampleGlyph: 'Aa'
  },
  {
    id: 'outfit',
    name: 'Outfit',
    category: 'Modern Sans',
    fontFamily: "'Outfit', sans-serif",
    previewText: 'Geometric elegance for next-gen products',
    sampleGlyph: 'Aa'
  },
  {
    id: 'jakarta',
    name: 'Plus Jakarta Sans',
    category: 'Modern Sans',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    previewText: 'Clean modern craft with premium character',
    sampleGlyph: 'Aa'
  },
  {
    id: 'manrope',
    name: 'Manrope',
    category: 'Modern Sans',
    fontFamily: "'Manrope', sans-serif",
    previewText: 'Friendly open geometry & soft terminals',
    sampleGlyph: 'Aa'
  },
  {
    id: 'spaceGrotesk',
    name: 'Space Grotesk',
    category: 'Modern Sans',
    fontFamily: "'Space Grotesk', sans-serif",
    previewText: 'Tech-forward neo-grotesque precision',
    sampleGlyph: 'Aa'
  },

  // Serif / Editorial
  {
    id: 'playfair',
    name: 'Playfair Display',
    category: 'Serif / Editorial',
    fontFamily: "'Playfair Display', serif",
    previewText: 'High-contrast editorial sophistication',
    sampleGlyph: 'Aa'
  },
  {
    id: 'lora',
    name: 'Lora',
    category: 'Serif / Editorial',
    fontFamily: "'Lora', serif",
    previewText: 'Warm, highly readable literary cadence',
    sampleGlyph: 'Aa'
  },
  {
    id: 'cormorant',
    name: 'Cormorant Garamond',
    category: 'Serif / Editorial',
    fontFamily: "'Cormorant Garamond', serif",
    previewText: 'Timeless high-fashion aesthetic delicacy',
    sampleGlyph: 'Aa'
  },

  // Monospace / Technical
  {
    id: 'robotoMono',
    name: 'Roboto Mono',
    category: 'Monospace / Technical',
    fontFamily: "'Roboto Mono', monospace",
    previewText: 'Engineered for developers and builders',
    sampleGlyph: 'Aa'
  },
  {
    id: 'jetbrainsMono',
    name: 'JetBrains Mono',
    category: 'Monospace / Technical',
    fontFamily: "'JetBrains Mono', monospace",
    previewText: 'Crisp developer-first code personality',
    sampleGlyph: 'Aa'
  },
  {
    id: 'spaceMono',
    name: 'Space Mono',
    category: 'Monospace / Technical',
    fontFamily: "'Space Mono', monospace",
    previewText: 'Quirky retro-futuristic mechanical feel',
    sampleGlyph: 'Aa'
  },

  // Display / Expressive
  {
    id: 'poppins',
    name: 'Poppins',
    category: 'Display / Expressive',
    fontFamily: "'Poppins', sans-serif",
    previewText: 'Rounded geometric warmth & bold clarity',
    sampleGlyph: 'Aa'
  },
  {
    id: 'bricolage',
    name: 'Bricolage Grotesque',
    category: 'Display / Expressive',
    fontFamily: "'Bricolage Grotesque', sans-serif",
    previewText: 'Distinctive expressive French grotesque',
    sampleGlyph: 'Aa'
  }
];

// 4. BORDER RADIUS (8 Options)
export const BORDER_RADIUS_OPTIONS = [
  { id: 'sharp', name: 'Sharp', value: '0px', numValue: 0, previewRadius: 0 },
  { id: 'subtle', name: 'Subtle', value: '4px', numValue: 4, previewRadius: 4 },
  { id: 'small', name: 'Small', value: '8px', numValue: 8, previewRadius: 8 },
  { id: 'medium', name: 'Medium', value: '16px', numValue: 16, previewRadius: 16 },
  { id: 'large', name: 'Large', value: '24px', numValue: 24, previewRadius: 24 },
  { id: 'extraLarge', name: 'Extra Large', value: '32px', numValue: 32, previewRadius: 32 },
  { id: 'rounded', name: 'Rounded', value: '40px', numValue: 40, previewRadius: 40 },
  { id: 'pill', name: 'Pill', value: '999px', numValue: 999, previewRadius: 999 }
];

// 5. SHADOW (8 Options)
export const SHADOW_OPTIONS = [
  {
    id: 'none',
    name: 'None',
    description: 'Flat, zero elevation',
    cssValue: 'none',
    previewBoxShadow: 'none'
  },
  {
    id: 'whisper',
    name: 'Whisper',
    description: 'Barely-there 1px ambient layer',
    cssValue: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
    previewBoxShadow: '0 1px 3px rgba(0,0,0,0.08)'
  },
  {
    id: 'soft',
    name: 'Soft',
    description: 'Subtle diffused ambient depth',
    cssValue: '0 4px 16px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
    previewBoxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  },
  {
    id: 'elevated',
    name: 'Elevated',
    description: 'Pronounced floating surface',
    cssValue: '0 10px 30px -5px rgba(0, 0, 0, 0.1), 0 4px 12px -2px rgba(0, 0, 0, 0.05)',
    previewBoxShadow: '0 8px 20px -3px rgba(0,0,0,0.18)'
  },
  {
    id: 'strong',
    name: 'Strong',
    description: 'Deep high-contrast dimension',
    cssValue: '0 20px 40px -10px rgba(0, 0, 0, 0.18), 0 8px 16px -4px rgba(0, 0, 0, 0.08)',
    previewBoxShadow: '0 14px 28px -5px rgba(0,0,0,0.25)'
  },
  {
    id: 'neo3d',
    name: 'Neo-3D',
    description: 'Solid offset dimensional border',
    cssValue: '4px 4px 0px var(--bento-border-color, #0F172A)',
    previewBoxShadow: '3px 3px 0px #0F172A'
  },
  {
    id: 'glow',
    name: 'Glow',
    description: 'Soft luminous accent radiance',
    cssValue: '0 0 24px -2px var(--bento-accent-glow, rgba(99, 102, 241, 0.35))',
    previewBoxShadow: '0 0 14px 1px rgba(99, 102, 241, 0.45)'
  },
  {
    id: 'offsetBrutalist',
    name: 'Offset Brutalist',
    description: 'Solid hard-edged shadow',
    cssValue: '6px 6px 0px #000000',
    previewBoxShadow: '5px 5px 0px #000000'
  }
];

// 6. SPACING (6 Options)
export const SPACING_OPTIONS = [
  { id: 'tight', name: 'Tight', px: 12, gapValue: '12px' },
  { id: 'compact', name: 'Compact', px: 16, gapValue: '16px' },
  { id: 'comfortable', name: 'Comfortable', px: 24, gapValue: '24px' },
  { id: 'relaxed', name: 'Relaxed', px: 28, gapValue: '28px' },
  { id: 'spacious', name: 'Spacious', px: 32, gapValue: '32px' },
  { id: 'airy', name: 'Airy', px: 40, gapValue: '40px' }
];

// DEFAULT SYSTEM STATE
export const DEFAULT_CUSTOMIZATION = {
  designStyle: 'classic',
  colorTheme: 'default',
  typography: 'inter',
  borderRadius: 'medium',
  shadow: 'soft',
  spacing: 'comfortable'
};

/**
 * Generate CSS custom properties dictionary from customization state
 */
export function getCustomizationCssVariables(state) {
  const current = { ...DEFAULT_CUSTOMIZATION, ...state };

  const themeObj = COLOR_THEMES.find(t => t.id === current.colorTheme) || COLOR_THEMES[0];
  const typoObj = TYPOGRAPHY_OPTIONS.find(t => t.id === current.typography) || TYPOGRAPHY_OPTIONS[0];
  const radiusObj = BORDER_RADIUS_OPTIONS.find(r => r.id === current.borderRadius) || BORDER_RADIUS_OPTIONS[3];
  const shadowObj = SHADOW_OPTIONS.find(s => s.id === current.shadow) || SHADOW_OPTIONS[2];
  const spacingObj = SPACING_OPTIONS.find(s => s.id === current.spacing) || SPACING_OPTIONS[2];

  return {
    ...themeObj.vars,
    '--bento-font-family': typoObj.fontFamily,
    '--bento-radius': radiusObj.value,
    '--bento-radius-px': `${radiusObj.numValue}px`,
    '--bento-shadow': shadowObj.cssValue,
    '--bento-gap': spacingObj.gapValue,
    '--bento-gap-px': `${spacingObj.px}px`
  };
}

/**
 * Get active theme family ('light' or 'dark')
 */
export function getThemeFamily(themeId) {
  const theme = COLOR_THEMES.find(t => t.id === themeId);
  return theme ? theme.family : 'light';
}
