/**
 * Design Tokens - iOS System Colors
 * Baseado no Human Interface Guidelines da Apple
 */

export const colors = {
  light: {
    // System Colors
    blue: "#007AFF",
    green: "#34C759",
    indigo: "#5856D6",
    orange: "#FF9500",
    pink: "#FF2D55",
    purple: "#AF52DE",
    red: "#FF3B30",
    teal: "#5AC8FA",
    yellow: "#FFCC00",
    
    // Gray Scale
    gray: {
      1: "#8E8E93",
      2: "#AEAEB2",
      3: "#C7C7CC",
      4: "#D1D1D6",
      5: "#E5E5EA",
      6: "#F2F2F7",
    },
    
    // System Backgrounds
    background: {
      primary: "#FFFFFF",
      secondary: "#F2F2F7",
      tertiary: "#FFFFFF",
    },
    
    // System Labels
    label: {
      primary: "#000000",
      secondary: "rgba(60, 60, 67, 0.6)",
      tertiary: "rgba(60, 60, 67, 0.3)",
      quaternary: "rgba(60, 60, 67, 0.18)",
    },
    
    // Separators
    separator: {
      opaque: "#C6C6C8",
      nonOpaque: "rgba(60, 60, 67, 0.29)",
    },
  },
  
  dark: {
    // System Colors
    blue: "#0A84FF",
    green: "#32D74B",
    indigo: "#5E5CE6",
    orange: "#FF9F0A",
    pink: "#FF375F",
    purple: "#BF5AF2",
    red: "#FF453A",
    teal: "#64D2FF",
    yellow: "#FFD60A",
    
    // Gray Scale
    gray: {
      1: "#8E8E93",
      2: "#636366",
      3: "#48484A",
      4: "#3A3A3C",
      5: "#2C2C2E",
      6: "#1C1C1E",
    },
    
    // System Backgrounds
    background: {
      primary: "#000000",
      secondary: "#1C1C1E",
      tertiary: "#2C2C2E",
    },
    
    // System Labels
    label: {
      primary: "#FFFFFF",
      secondary: "rgba(235, 235, 245, 0.6)",
      tertiary: "rgba(235, 235, 245, 0.3)",
      quaternary: "rgba(235, 235, 245, 0.18)",
    },
    
    // Separators
    separator: {
      opaque: "#38383A",
      nonOpaque: "rgba(84, 84, 88, 0.65)",
    },
  },
};

/**
 * List Colors - iOS Reminders default palette
 */
export const listColors = [
  { id: "blue", name: "Azul", light: "#007AFF", dark: "#0A84FF" },
  { id: "orange", name: "Laranja", light: "#FF9500", dark: "#FF9F0A" },
  { id: "red", name: "Vermelho", light: "#FF3B30", dark: "#FF453A" },
  { id: "yellow", name: "Amarelo", light: "#FFCC00", dark: "#FFD60A" },
  { id: "green", name: "Verde", light: "#34C759", dark: "#32D74B" },
  { id: "purple", name: "Roxo", light: "#AF52DE", dark: "#BF5AF2" },
  { id: "pink", name: "Rosa", light: "#FF2D55", dark: "#FF375F" },
  { id: "brown", name: "Marrom", light: "#A2845E", dark: "#AC8E68" },
  { id: "cyan", name: "Ciano", light: "#5AC8FA", dark: "#64D2FF" },
  { id: "indigo", name: "Índigo", light: "#5856D6", dark: "#5E5CE6" },
];

/**
 * Typography - iOS System Font Sizes
 */
export const typography = {
  largeTitle: {
    fontSize: "34px",
    lineHeight: "41px",
    fontWeight: "400",
  },
  title1: {
    fontSize: "28px",
    lineHeight: "34px",
    fontWeight: "400",
  },
  title2: {
    fontSize: "22px",
    lineHeight: "28px",
    fontWeight: "400",
  },
  title3: {
    fontSize: "20px",
    lineHeight: "25px",
    fontWeight: "400",
  },
  headline: {
    fontSize: "17px",
    lineHeight: "22px",
    fontWeight: "600",
  },
  body: {
    fontSize: "17px",
    lineHeight: "22px",
    fontWeight: "400",
  },
  callout: {
    fontSize: "16px",
    lineHeight: "21px",
    fontWeight: "400",
  },
  subheadline: {
    fontSize: "15px",
    lineHeight: "20px",
    fontWeight: "400",
  },
  footnote: {
    fontSize: "13px",
    lineHeight: "18px",
    fontWeight: "400",
  },
  caption1: {
    fontSize: "12px",
    lineHeight: "16px",
    fontWeight: "400",
  },
  caption2: {
    fontSize: "11px",
    lineHeight: "13px",
    fontWeight: "400",
  },
};

/**
 * Spacing - iOS standard spacing
 */
export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  base: "16px", // iOS default horizontal padding
  lg: "20px",
  xl: "24px",
  "2xl": "32px",
};

/**
 * Border Radius - iOS standard corner radius
 */
export const borderRadius = {
  sm: "8px",
  md: "10px",
  lg: "14px",
  xl: "18px",
  full: "9999px",
};

/**
 * Timing - Animation durations
 */
export const timing = {
  fast: "0.15s",
  base: "0.2s",
  medium: "0.3s",
  slow: "0.4s",
};

/**
 * Easing - Animation easing functions
 */
export const easing = {
  ease: "ease",
  easeIn: "ease-in",
  easeOut: "ease-out",
  easeInOut: "ease-in-out",
  spring: "cubic-bezier(0.68, -0.55, 0.265, 1.55)", // iOS spring animation
};
