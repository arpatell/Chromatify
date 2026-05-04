import { arrayToHex, calculateAuraColor, getAuraStyleProfile, getTop3Colors } from './colorService';

const convert = require('color-convert');

const getSaturation = (rgbColor) => convert.rgb.hsl(rgbColor)[1];
const getLightness = (rgbColor) => convert.rgb.hsl(rgbColor)[2];
const getChannelSpread = (rgbColor) => Math.max(...rgbColor) - Math.min(...rgbColor);

describe('colorService vibrant behavior', () => {
  test('calculateAuraColor keeps vibrant output for mixed energetic palettes', () => {
    const songColors = [
      [232, 67, 147],
      [56, 182, 255],
      [255, 194, 46],
      [152, 94, 255],
      [98, 228, 171],
      [255, 114, 83],
      [43, 132, 255],
    ];

    const aura = calculateAuraColor(songColors);
    expect(getSaturation(aura)).toBeGreaterThanOrEqual(58);
    expect(getLightness(aura)).toBeGreaterThanOrEqual(40);
    expect(getLightness(aura)).toBeLessThanOrEqual(72);
    expect(getChannelSpread(aura)).toBeGreaterThanOrEqual(35);
  });

  test('calculateAuraColor avoids muddy output when neutrals are mixed in', () => {
    const songColors = [
      [246, 242, 236],
      [32, 31, 39],
      [111, 103, 96],
      [96, 209, 255],
      [255, 142, 191],
      [118, 96, 255],
      [124, 228, 163],
    ];

    const aura = calculateAuraColor(songColors);
    expect(getSaturation(aura)).toBeGreaterThanOrEqual(56);
    expect(getChannelSpread(aura)).toBeGreaterThanOrEqual(32);
  });

  test('getTop3Colors returns distinct colorful picks', async () => {
    const songColors = [
      [235, 92, 189],
      [227, 85, 181],
      [84, 197, 255],
      [73, 188, 245],
      [255, 210, 79],
      [250, 204, 74],
      [44, 44, 48],
      [245, 241, 238],
    ];

    const top3 = await getTop3Colors(songColors);
    expect(top3).toHaveLength(3);
    top3.forEach((color) => {
      expect(getSaturation(color)).toBeGreaterThanOrEqual(50);
      expect(getChannelSpread(color)).toBeGreaterThanOrEqual(30);
    });
  });

  test('arrayToHex clamps and formats channels', () => {
    expect(arrayToHex([255, 32, 171])).toBe('#ff20ab');
    expect(arrayToHex([300, -20, 12.4])).toBe('#ff000c');
  });

  test('getAuraStyleProfile picks neon cool for high energy palettes', () => {
    const profile = getAuraStyleProfile([
      [88, 232, 255],
      [120, 92, 255],
      [255, 84, 180],
      [255, 192, 54],
    ]);

    expect(profile.id).toBe('neon-cool');
  });

  test('getAuraStyleProfile picks pastel cute for soft palettes', () => {
    const profile = getAuraStyleProfile([
      [255, 206, 228],
      [194, 220, 255],
      [207, 241, 234],
      [246, 233, 255],
    ]);

    expect(profile.id).toBe('pastel-cute');
  });
});
