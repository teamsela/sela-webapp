type RgbColor = {
  r: number;
  g: number;
  b: number;
};

const clampColorChannel = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

const hexToRgb = (hex: string): RgbColor | null => {
  if (!hex) return null;

  let normalized = hex.trim();
  if (normalized.startsWith("#")) {
    normalized = normalized.slice(1);
  }

  if (normalized.length === 3) {
    normalized = normalized
      .split("")
      .map((char) => char + char)
      .join("");
  }

  if (normalized.length !== 6) {
    return null;
  }

  const parsed = Number.parseInt(normalized, 16);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
};

const rgbToHex = ({ r, g, b }: RgbColor) =>
  `#${clampColorChannel(r).toString(16).padStart(2, "0")}${clampColorChannel(g)
    .toString(16)
    .padStart(2, "0")}${clampColorChannel(b).toString(16).padStart(2, "0")}`.toUpperCase();

const mixColors = (base: string, target: string, ratio: number) => {
  const safeRatio = Number.isFinite(ratio) ? Math.max(0, Math.min(1, ratio)) : 0;
  const baseRgb = hexToRgb(base);
  const targetRgb = hexToRgb(target);
  if (!baseRgb || !targetRgb) {
    return base;
  }

  const mixChannel = (from: number, to: number) => from + (to - from) * safeRatio;
  return rgbToHex({
    r: mixChannel(baseRgb.r, targetRgb.r),
    g: mixChannel(baseRgb.g, targetRgb.g),
    b: mixChannel(baseRgb.b, targetRgb.b),
  });
};

export const lightenColor = (hex: string, amount: number) => mixColors(hex, "#FFFFFF", amount);

export const darkenColor = (hex: string, amount: number) => mixColors(hex, "#000000", amount);

const getRelativeLuminance = (hex: string): number | null => {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;

  const normalizeChannel = (value: number) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  };

  const r = normalizeChannel(rgb.r);
  const g = normalizeChannel(rgb.g);
  const b = normalizeChannel(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const getContrastRatio = (foreground: string, background: string): number => {
  const lumForeground = getRelativeLuminance(foreground);
  const lumBackground = getRelativeLuminance(background);
  if (lumForeground === null || lumBackground === null) {
    return 0;
  }

  const [lighter, darker] =
    lumForeground > lumBackground ? [lumForeground, lumBackground] : [lumBackground, lumForeground];
  return (lighter + 0.05) / (darker + 0.05);
};

export const getReadableThemeVariant = (
  themeColor: string,
  backgroundColor: string,
  options?: { lightenRatio?: number; darkenRatio?: number }
) => {
  const { lightenRatio = 0.35, darkenRatio = 0.45 } = options ?? {};

  const background = backgroundColor || "#FFFFFF";
  const themeLight = lightenColor(themeColor, lightenRatio);
  const themeDark = darkenColor(themeColor, darkenRatio);

  const contrastWithLight = getContrastRatio(themeLight, background);
  const contrastWithDark = getContrastRatio(themeDark, background);

  if (contrastWithLight === 0 && contrastWithDark === 0) {
    return themeColor;
  }

  return contrastWithLight >= contrastWithDark ? themeLight : themeDark;
};

export const getReadableTextColor = (
  backgroundColor: string,
  options?: { lightColor?: string; darkColor?: string }
) => {
  const { lightColor = "#FFFFFF", darkColor = "#656565" } = options ?? {};

  const background = backgroundColor || "#FFFFFF";
  const contrastWithLight = getContrastRatio(lightColor, background);
  const contrastWithDark = getContrastRatio(darkColor, background);

  if (contrastWithLight === 0 && contrastWithDark === 0) {
    return darkColor;
  }

  return contrastWithLight > contrastWithDark ? lightColor : darkColor;
};
