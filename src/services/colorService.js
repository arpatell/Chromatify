import ColorThief from 'colorthief';
const convert = require('color-convert');

const DEFAULT_VIBRANT_COLOR = [116, 96, 255];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const hueDistance = (h1, h2) => {
  const diff = Math.abs(h1 - h2);
  return Math.min(diff, 360 - diff);
};

const toHsl = (rgbColor) => convert.rgb.hsl(rgbColor);

const getChannelSpread = (rgbColor) => Math.max(...rgbColor) - Math.min(...rgbColor);

const parseHexToRgb = (hexColor) => {
  if (typeof hexColor !== 'string') {
    return null;
  }

  const normalized = hexColor.trim().replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }

  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
};

const toRgbColor = (value) => {
  if (Array.isArray(value) && value.length === 3) {
    return value;
  }
  return parseHexToRgb(value);
};

const isLowQualityColor = (rgbColor) => {
  const [, saturation, lightness] = toHsl(rgbColor);
  const channelSpread = getChannelSpread(rgbColor);
  return saturation < 26 || lightness < 17 || lightness > 88 || channelSpread < 18;
};

const getVibrancyScore = (rgbColor) => {
  const [, saturation, lightness] = toHsl(rgbColor);
  const channelSpread = getChannelSpread(rgbColor);
  const balancedLightness = 1 - Math.abs(lightness - 56) / 56;
  return saturation * 1.65 + channelSpread * 0.55 + balancedLightness * 42;
};

const getDistinctColors = (colors, limit = 3) => {
  const ranked = colors
    .map((rgb) => ({ rgb, score: getVibrancyScore(rgb), hsl: toHsl(rgb) }))
    .sort((a, b) => b.score - a.score);

  const selected = [];
  for (const entry of ranked) {
    const isDistinct = selected.every((existing) => {
      const hueGap = hueDistance(existing.hsl[0], entry.hsl[0]);
      const satGap = Math.abs(existing.hsl[1] - entry.hsl[1]);
      const lightGap = Math.abs(existing.hsl[2] - entry.hsl[2]);
      return hueGap > 22 || satGap > 12 || lightGap > 12;
    });

    if (isDistinct) {
      selected.push(entry);
    }
    if (selected.length === limit) {
      break;
    }
  }

  if (selected.length < limit) {
    for (const entry of ranked) {
      if (selected.find((existing) => existing.rgb.join(',') === entry.rgb.join(','))) {
        continue;
      }
      selected.push(entry);
      if (selected.length === limit) {
        break;
      }
    }
  }

  return selected.map((entry) => entry.rgb);
};

const scorePalette = (palette) => {
  const candidates = palette.filter((color) => Array.isArray(color) && color.length === 3);
  if (!candidates.length) {
    return [];
  }

  const colorfulCandidates = candidates.filter((color) => !isLowQualityColor(color));
  const effectivePool = colorfulCandidates.length ? colorfulCandidates : candidates;

  return effectivePool
    .map((rgb) => ({ rgb, score: getVibrancyScore(rgb) }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.rgb);
};

export const extractColor = async (url) => {
  try {
    const image = new Image();
    image.crossOrigin = 'Anonymous';
    image.src = url;

    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });

    const colorThief = new ColorThief();
    const palette = colorThief.getPalette(image, 10, 5) || [];
    const rankedPalette = scorePalette(palette);

    if (rankedPalette.length > 0) {
      return rankedPalette[0];
    }

    const fallbackColor = colorThief.getColor(image);
    return fallbackColor || DEFAULT_VIBRANT_COLOR;
  } catch (error) {
    console.error('Error extracting color:', error);
    return DEFAULT_VIBRANT_COLOR;
  }
};

export const calculateAuraColor = (songColors) => {
  if (!songColors?.length) {
    return DEFAULT_VIBRANT_COLOR;
  }

  const vividColors = scorePalette(songColors).slice(0, 6);
  if (!vividColors.length) {
    return DEFAULT_VIBRANT_COLOR;
  }

  let hueX = 0;
  let hueY = 0;
  let satSum = 0;
  let lightnessSum = 0;
  let totalWeight = 0;

  vividColors.forEach((rgbColor) => {
    const [hue, saturation, lightness] = toHsl(rgbColor);
    const vibrancyWeight = Math.max(0.1, getVibrancyScore(rgbColor) / 100);
    const saturationWeight = Math.pow(saturation / 100, 1.22);
    const lightnessBalance = clamp(1 - Math.abs(lightness - 56) / 60, 0.2, 1);
    const weight = vibrancyWeight * saturationWeight * lightnessBalance;

    const hueRadians = (hue * Math.PI) / 180;
    hueX += Math.cos(hueRadians) * weight;
    hueY += Math.sin(hueRadians) * weight;
    satSum += saturation * weight;
    lightnessSum += lightness * weight;
    totalWeight += weight;
  });

  if (!totalWeight) {
    return DEFAULT_VIBRANT_COLOR;
  }

  const blendedHue = (Math.atan2(hueY, hueX) * 180) / Math.PI;
  const normalizedHue = Math.round((blendedHue + 360) % 360);
  const blendedSat = clamp(Math.round((satSum / totalWeight) * 1.12), 58, 95);
  const blendedLightness = clamp(Math.round((lightnessSum / totalWeight) * 0.98 + 4), 42, 69);

  return convert.hsl.rgb([normalizedHue, blendedSat, blendedLightness]);
};

export const getTop3Colors = async (songColors) => {
  if (!songColors?.length) {
    return [];
  }
  return getDistinctColors(songColors, 3);
};

export const getAuraStyleProfile = (colors) => {
  const rgbColors = (colors || [])
    .map((color) => toRgbColor(color))
    .filter((color) => Array.isArray(color) && color.length === 3);

  if (!rgbColors.length) {
    return {
      id: 'pastel-cute',
      label: 'Pastel Cute',
      description: 'Soft, playful, and airy tones with a warm mood.',
      surfaceGradient:
        'linear-gradient(132deg, rgba(255, 196, 223, 0.3) 0%, rgba(188, 214, 255, 0.3) 56%, rgba(213, 244, 238, 0.26) 100%)',
    };
  }

  const metrics = rgbColors.reduce(
    (acc, color) => {
      const [, saturation, lightness] = toHsl(color);
      acc.saturation += saturation;
      acc.lightness += lightness;
      acc.spread += getChannelSpread(color);
      return acc;
    },
    { saturation: 0, lightness: 0, spread: 0 }
  );

  const count = rgbColors.length;
  const avgSaturation = metrics.saturation / count;
  const avgLightness = metrics.lightness / count;
  const avgSpread = metrics.spread / count;
  const colorEnergy = avgSaturation * 0.68 + avgSpread * 0.52 - Math.abs(avgLightness - 60) * 0.18;
  const isNeon = (avgSaturation >= 68 && avgSpread >= 82 && avgLightness <= 66) || colorEnergy >= 102;

  if (isNeon) {
    return {
      id: 'neon-cool',
      label: 'Neon Cool',
      description: 'High-energy, bold contrast, and electric glow.',
      surfaceGradient:
        'linear-gradient(132deg, rgba(128, 105, 255, 0.3) 0%, rgba(89, 225, 255, 0.28) 52%, rgba(255, 174, 217, 0.24) 100%)',
    };
  }

  return {
    id: 'pastel-cute',
    label: 'Pastel Cute',
    description: 'Soft, playful, and airy tones with a warm mood.',
    surfaceGradient:
      'linear-gradient(132deg, rgba(255, 196, 223, 0.3) 0%, rgba(188, 214, 255, 0.3) 56%, rgba(213, 244, 238, 0.26) 100%)',
  };
};

const HUE_NAMES = [
  { name: 'Rose', min: 340, max: 360 },
  { name: 'Coral', min: 0, max: 24 },
  { name: 'Amber', min: 24, max: 52 },
  { name: 'Lime', min: 52, max: 83 },
  { name: 'Mint', min: 83, max: 138 },
  { name: 'Aqua', min: 138, max: 182 },
  { name: 'Sky', min: 182, max: 212 },
  { name: 'Azure', min: 212, max: 240 },
  { name: 'Indigo', min: 240, max: 266 },
  { name: 'Violet', min: 266, max: 295 },
  { name: 'Fuchsia', min: 295, max: 320 },
  { name: 'Raspberry', min: 320, max: 340 },
];

const getHueFamily = (hue) => {
  const family = HUE_NAMES.find((entry) => hue >= entry.min && hue < entry.max);
  return family ? family.name : 'Spectrum';
};

const getToneWord = (saturation, lightness) => {
  if (saturation > 82 && lightness > 44) return 'Electric';
  if (saturation > 70) return 'Neon';
  if (saturation > 56) return 'Vivid';
  if (lightness > 72) return 'Soft';
  return 'Lush';
};

export const getColorName = async (rgbColor) => {
  if (!rgbColor?.length) {
    return 'Unknown';
  }
  const [hue, saturation, lightness] = toHsl(rgbColor);
  const hueFamily = getHueFamily(hue);
  return `${getToneWord(saturation, lightness)} ${hueFamily}`;
};

export const arrayToHex = (rgbColor) => {
  if (!rgbColor) {
    return '';
  }
  return `#${rgbColor
    .map((channelValue) => {
      const bounded = clamp(Math.round(channelValue), 0, 255);
      const hex = bounded.toString(16);
      return hex.length === 1 ? `0${hex}` : hex;
    })
    .join('')}`;
};
