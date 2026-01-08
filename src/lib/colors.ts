export const DEFAULT_COLOR_FILL = "#FFFFFF";
export const DEFAULT_BORDER_COLOR = "#D9D9D9";
export const DEFAULT_TEXT_COLOR = "#656565";

const FALLBACK_SWATCH_GROUPS: string[][] = [
  ["#B71C1C", "#D32F2F", "#F44336", "#E57373", "#FFCDD2"],
  ["#880E4F", "#C2185B", "#E91E63", "#F06292", "#F8BBD0"],
  ["#4A148C", "#7B1FA2", "#9C27B0", "#BA68C8", "#E1BEE7"],
  ["#311B92", "#512DA8", "#673AB7", "#9575CD", "#D1C4E9"],
  ["#1A237E", "#303F9F", "#3F51B5", "#7986CB", "#C5CAE9"],
  ["#0D47A1", "#1976D2", "#2196F3", "#64B5F6", "#BBDEFB"],
  ["#01579B", "#0288D1", "#03A9F4", "#4FC3F7", "#B3E5FC"],
  ["#006064", "#0097A7", "#00BCD4", "#4DD0E1", "#B2EBF2"],
  ["#004D40", "#00796B", "#009688", "#4DB6AC", "#B2DFDB"],
  ["#194D33", "#388E3C", "#4CAF50", "#81C784", "#C8E6C9"],
  ["#33691E", "#689F38", "#8BC34A", "#AED581", "#DCEDC8"],
  ["#827717", "#AFB42B", "#CDDC39", "#DCE775", "#F0F4C3"],
  ["#F57F17", "#FBC02D", "#FFEB3B", "#FFF176", "#FFF9C4"],
  ["#FF6F00", "#FFA000", "#FFC107", "#FFD54F", "#FFECB3"],
  ["#E65100", "#F57C00", "#FF9800", "#FFB74D", "#FFE0B2"],
  ["#BF360C", "#E64A19", "#FF5722", "#FF8A65", "#FFCCBC"],
  ["#3E2723", "#5D4037", "#795548", "#A1887F", "#D7CCC8"],
  ["#263238", "#455A64", "#607D8B", "#90A4AE", "#CFD8DC"],
  ["#000000", "#525252", "#969696", "#D9D9D9", "#FFFFFF"],
] ;

const loadSwatchGroups = (): string[][] | undefined => {
  try {
    /* eslint-disable-next-line global-require */
    const swatchesModule = require("react-color/lib/components/swatches/Swatches");
    const rawSwatches = swatchesModule?.Swatches;
    const colors = rawSwatches?.defaultProps?.colors;
    if (!Array.isArray(colors)) {
      return undefined;
    }
    return colors
      .map((group: unknown) =>
        Array.isArray(group)
          ? group
              .map((color) =>
                typeof color === "string" && color.trim().length > 0 ? color : null,
              )
              .filter((color): color is string => Boolean(color))
          : [],
      )
      .filter((group) => group.length > 0);
  } catch {
    return undefined;
  }
};

const normalizeSwatchHex = (hex: string): string => hex.trim().toUpperCase();

export const USER_SWATCH_GROUPS: readonly string[][] =
  loadSwatchGroups()?.map((group) => group.map(normalizeSwatchHex)) ??
  FALLBACK_SWATCH_GROUPS;

const USER_SWATCH_LIST = Array.from(
  new Set(USER_SWATCH_GROUPS.flat()),
);

export const USER_SWATCH_COLORS = USER_SWATCH_LIST;

type Rgb = { r: number; g: number; b: number };

type ColorTriplet = {
  fill?: string;
  border?: string;
  text?: string;
};

const HEX_COLOR_PATTERN = /^#([0-9A-F]{6})$/i;

const normalizeHex = (hex: string): string | null => {
  if (!hex) {
    return null;
  }

  let value = hex.trim();
  if (!value.startsWith("#")) {
    value = `#${value}`;
  }

  const digits = value.slice(1);

  if (digits.length === 3 || digits.length === 4) {
    const expanded = digits
      .slice(0, 3)
      .split("")
      .map((char) => char + char)
      .join("");
    return `#${expanded.toUpperCase()}`;
  }

  if (digits.length === 6 || digits.length === 8) {
    return `#${digits.slice(0, 6).toUpperCase()}`;
  }

  return null;
};

const hexToRgb = (hex: string): Rgb | null => {
  const normalized = normalizeHex(hex);
  if (!normalized || !HEX_COLOR_PATTERN.test(normalized)) {
    return null;
  }

  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
};

const USER_SWATCH_WITH_RGB = USER_SWATCH_LIST.map((hex) => ({
  hex,
  rgb: hexToRgb(hex),
})).filter((entry) => entry.rgb !== null) as { hex: string; rgb: Rgb }[];

const colorDistance = (a: Rgb, b: Rgb): number => {
  return (
    Math.pow(a.r - b.r, 2) +
    Math.pow(a.g - b.g, 2) +
    Math.pow(a.b - b.b, 2)
  );
};

export const clampHexToUserSwatch = (hex: string): string => {
  const color = hexToRgb(hex);
  if (!color || USER_SWATCH_WITH_RGB.length === 0) {
    return hex;
  }

  let closestHex = USER_SWATCH_WITH_RGB[0].hex;
  let minDistance = Number.POSITIVE_INFINITY;

  USER_SWATCH_WITH_RGB.forEach((candidate) => {
    const distance = colorDistance(candidate.rgb, color);
    if (distance < minDistance) {
      minDistance = distance;
      closestHex = candidate.hex;
    }
  });

  return closestHex;
};

export const clampPaletteToUserColors = <T extends ColorTriplet>(palette: T): T => {
  const normalized = { ...palette };
  if (palette.fill) {
    normalized.fill = clampHexToUserSwatch(palette.fill);
  }
  if (palette.border) {
    normalized.border = clampHexToUserSwatch(palette.border);
  }
  if (palette.text) {
    normalized.text = clampHexToUserSwatch(palette.text);
  }
  return normalized;
};
