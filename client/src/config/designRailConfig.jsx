import { Palette, Type, Layers, LayoutGrid, RotateCcw } from 'lucide-react';
import DesignStyleFlyout from '../components/customization/DesignStyleFlyout';
import ColorThemeFlyout from '../components/customization/ColorThemeFlyout';
import TypographyFlyout from '../components/customization/TypographyFlyout';
import BorderRadiusFlyout from '../components/customization/BorderRadiusFlyout';
import ShadowFlyout from '../components/customization/ShadowFlyout';
import SpacingFlyout from '../components/customization/SpacingFlyout';

// Custom SVG Icons for pixel-perfect rail symbols
export const ColorDotsIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7.5" cy="7.5" r="3.5" fill={color} fillOpacity="0.9" />
    <circle cx="16.5" cy="7.5" r="3.5" fill={color} fillOpacity="0.6" />
    <circle cx="7.5" cy="16.5" r="3.5" fill={color} fillOpacity="0.4" />
    <circle cx="16.5" cy="16.5" r="3.5" fill={color} fillOpacity="0.8" />
  </svg>
);

export const AaGlyphIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <text x="3" y="16" fontFamily="Inter, sans-serif" fontSize="13" fontWeight="800" fill={color}>A</text>
    <text x="13" y="17" fontFamily="Inter, sans-serif" fontSize="10" fontWeight="600" fill={color}>a</text>
  </svg>
);

export const RoundedSquareIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="16" height="16" rx="6" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="8" cy="8" r="1.5" fill={color} />
  </svg>
);

export const DepthShadowIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="12" height="12" rx="3" stroke={color} strokeWidth="1.8" fill="none" />
    <path d="M8 20H17C18.6569 20 20 18.6569 20 17V8" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const RAIL_CATEGORIES = [
  {
    id: 'style',
    title: 'Design Style',
    shortTitle: 'Style',
    icon: Palette,
    FlyoutComponent: DesignStyleFlyout,
    description: '12 aesthetic surfaces, glassmorphism & depths'
  },
  {
    id: 'theme',
    title: 'Color Theme',
    shortTitle: 'Theme',
    icon: ColorDotsIcon,
    FlyoutComponent: ColorThemeFlyout,
    description: '16 light & dark curated color palettes'
  },
  {
    id: 'typography',
    title: 'Typography',
    shortTitle: 'Fonts',
    icon: AaGlyphIcon,
    FlyoutComponent: TypographyFlyout,
    description: '13 typefaces for headings & profile text'
  },
  {
    id: 'radius',
    title: 'Border Radius',
    shortTitle: 'Radius',
    icon: RoundedSquareIcon,
    FlyoutComponent: BorderRadiusFlyout,
    description: '8 corner curvatures from sharp to pill'
  },
  {
    id: 'shadow',
    title: 'Shadow',
    shortTitle: 'Shadow',
    icon: DepthShadowIcon,
    FlyoutComponent: ShadowFlyout,
    description: '8 elevation depths and dimensional effects'
  },
  {
    id: 'spacing',
    title: 'Spacing',
    shortTitle: 'Spacing',
    icon: LayoutGrid,
    FlyoutComponent: SpacingFlyout,
    description: '6 grid gap densities from tight to airy'
  }
];

export const RESET_ACTION = {
  id: 'reset',
  title: 'Reset to Default',
  shortTitle: 'Reset',
  icon: RotateCcw,
  description: 'Revert all styles and tokens to system defaults'
};
