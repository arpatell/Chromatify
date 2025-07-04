import ColorThief from 'colorthief';
import axios from 'axios';
const convert = require('color-convert');

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
    const color = colorThief.getColor(image);
    if (color) {
      return color;
    } else {
      return [255, 255, 255];
    }
  } catch (error) {
    console.error('Error extracting color:', error);
    return [255, 255, 255];
  }
};

export const calculateAuraColor = (songColors) => {
  const hslColors = songColors.map(rgb => convert.rgb.hsl(rgb));
  const sortedHslColors = hslColors.sort((a, b) => b[2] - a[2]);

  const dominantColor = sortedHslColors[0];

  let redSum = 0, greenSum = 0, blueSum = 0;
  let multiplier = 1;

  for (let i = 0; i < songColors.length; i++) {
    const rgb = convert.hsl.rgb(hslColors[i]);
    let modifiedRed = dominantColor[0] + ((rgb[0] - dominantColor[0]) * multiplier);
    let modifiedGreen = dominantColor[1] + ((rgb[1] - dominantColor[1]) * multiplier);
    let modifiedBlue = dominantColor[2] + ((rgb[2] - dominantColor[2]) * multiplier);
    modifiedRed = Math.min(Math.max(modifiedRed, 0), 255);
    modifiedGreen = Math.min(Math.max(modifiedGreen, 0), 255);
    modifiedBlue = Math.min(Math.max(modifiedBlue, 0), 255);
    redSum += modifiedRed;
    greenSum += modifiedGreen;
    blueSum += modifiedBlue;
    multiplier += 0.1;
  }
  const averageRed = Math.round(redSum / songColors.length);
  const averageGreen = Math.round(greenSum / songColors.length);
  const averageBlue = Math.round(blueSum / songColors.length);
  const auraColor = [averageRed, averageGreen, averageBlue];
  return auraColor;
};

export const getTop3Colors = async (songColors) => {
  if (songColors.length < 3) {
    return [];
  }
  if (songColors.length === 3) {
    return [songColors[0], songColors[1], songColors[2]];
  }
  const colorCounts = {};
  songColors.forEach(color => {
    const key = color.join(',');
    colorCounts[key] = (colorCounts[key] || 0) + 1;
  });
  const sortedColors = Object.keys(colorCounts).sort((a, b) => colorCounts[b] - colorCounts[a]);
  const dominantColor = sortedColors[0].split(',').map(Number);
  const secondColor = sortedColors[1].split(',').map(Number);
  const thirdColor = sortedColors[2].split(',').map(Number);
  return [dominantColor, secondColor, thirdColor];
};

export const getColorName = async (rgbColor) => {
    try {
        const response = await axios.get(`https://www.thecolorapi.com/id?rgb=${rgbColor.join(',')}`);
        return response.data.name.value;
    } catch (error) {
        console.error('Error retrieving color name:', error);
        return 'Unknown';
    }
};

export const arrayToHex = (rgbColor) => {
  if (!rgbColor) {
    return '';
  }
  return '#' + rgbColor.map(c => {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};