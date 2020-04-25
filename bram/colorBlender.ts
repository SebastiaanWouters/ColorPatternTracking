import Point from "./Point";
import { createCanvas, IRGBAColor, rgbToHsl, hslToRgb } from "./GEEN_PYTHON";

export function blendImageColors(screenCanvas: HTMLCanvasElement) {
  const blendedCanvas = createCanvas(screenCanvas.width, screenCanvas.height);
  const blendedCanvasCtx = blendedCanvas.getContext("2d");
  blendedCanvasCtx.drawImage(screenCanvas, 0, 0);
  const pixelBlurBlockRadius = 4;

  const screenCtx = screenCanvas.getContext("2d");
  const originalPixelData = screenCtx.getImageData(
      0,
      0,
      screenCanvas.width,
      screenCanvas.height
    ),
    originalPixels = originalPixelData.data;
  const manipulatedPixelData = blendedCanvasCtx.getImageData(
      0,
      0,
      blendedCanvas.width,
      blendedCanvas.height
    ),
    manipulatedPixels = manipulatedPixelData.data;

  for (let y = 0; y < screenCanvas.height; y++) {
    for (let x = 0; x < screenCanvas.width; x++) {
      const linearizedIndex = (screenCanvas.width * y + x) * 4;
      let avgR: number = 0;
      let avgG: number = 0;
      let avgB: number = 0;
      let pixelsAveraged = 0;
      for (
        let innerY = y - pixelBlurBlockRadius;
        innerY < y + pixelBlurBlockRadius;
        innerY++
      ) {
        for (
          let innerX = x - pixelBlurBlockRadius;
          innerX < x + pixelBlurBlockRadius;
          innerX++
        ) {
          if (
            innerX >= 0 &&
            innerY >= 0 &&
            innerX < screenCanvas.width &&
            innerY < screenCanvas.height
          ) {
            const innerLinearizedIndex =
              (screenCanvas.width * innerY + innerX) * 4;
            avgR += Math.pow(originalPixels[innerLinearizedIndex], 2);
            avgG += Math.pow(originalPixels[innerLinearizedIndex + 1], 2);
            avgB += Math.pow(originalPixels[innerLinearizedIndex + 2], 2);

            pixelsAveraged++;
          }
        }
      }
      avgR = Math.sqrt(avgR / pixelsAveraged);
      avgG = Math.sqrt(avgG / pixelsAveraged);
      avgB = Math.sqrt(avgB / pixelsAveraged);
      manipulatedPixels[linearizedIndex] = avgR;
      manipulatedPixels[linearizedIndex + 1] = avgG;
      manipulatedPixels[linearizedIndex + 2] = avgB;
    }
  }
  blendedCanvasCtx.putImageData(manipulatedPixelData, 0, 0);
  return blendedCanvas;
}

export function removeSandL(screenCanvas: HTMLCanvasElement) {
  const blendedCanvas = createCanvas(screenCanvas.width, screenCanvas.height);
  const blendedCanvasCtx = blendedCanvas.getContext("2d");
  blendedCanvasCtx.drawImage(screenCanvas, 0, 0);
  const pixelBlurBlockRadius = 4;

  const screenCtx = screenCanvas.getContext("2d");
  const originalPixelData = screenCtx.getImageData(
      0,
      0,
      screenCanvas.width,
      screenCanvas.height
    ),
    originalPixels = originalPixelData.data;
  const manipulatedPixelData = blendedCanvasCtx.getImageData(
      0,
      0,
      blendedCanvas.width,
      blendedCanvas.height
    ),
    manipulatedPixels = manipulatedPixelData.data;

  for (let y = 0; y < screenCanvas.height; y++) {
    for (let x = 0; x < screenCanvas.width; x++) {
      const linearizedIndex = (screenCanvas.width * y + x) * 4;
      const hslColor = rgbToHsl(
        originalPixels[linearizedIndex],
        originalPixels[linearizedIndex + 1],
        originalPixels[linearizedIndex + 2]
      );
      const rgb = hslToRgb(hslColor.h, 0.1, 0.1);
      manipulatedPixels[linearizedIndex] = rgb.r;
      manipulatedPixels[linearizedIndex + 1] = rgb.g;
      manipulatedPixels[linearizedIndex + 2] = rgb.b;
    }
  }
  blendedCanvasCtx.putImageData(manipulatedPixelData, 0, 0);
  return blendedCanvas;
}

export function exaturateBlue(screenCanvas: HTMLCanvasElement) {
  const blendedCanvas = createCanvas(screenCanvas.width, screenCanvas.height);
  const blendedCanvasCtx = blendedCanvas.getContext("2d");
  blendedCanvasCtx.drawImage(screenCanvas, 0, 0);
  const pixelBlurBlockRadius = 4;

  const screenCtx = screenCanvas.getContext("2d");
  const originalPixelData = screenCtx.getImageData(
      0,
      0,
      screenCanvas.width,
      screenCanvas.height
    ),
    originalPixels = originalPixelData.data;
  const manipulatedPixelData = blendedCanvasCtx.getImageData(
      0,
      0,
      blendedCanvas.width,
      blendedCanvas.height
    ),
    manipulatedPixels = manipulatedPixelData.data;

  for (let y = 0; y < screenCanvas.height; y++) {
    for (let x = 0; x < screenCanvas.width; x++) {
      const linearizedIndex = (screenCanvas.width * y + x) * 4;
      if (
        originalPixels[linearizedIndex + 2] > 255 * 0.75 &&
        originalPixels[linearizedIndex] < 255 * 0.3 &&
        originalPixels[linearizedIndex + 1] < 255 * 0.75
      ) {
        const hslColor = rgbToHsl(
          originalPixels[linearizedIndex],
          originalPixels[linearizedIndex + 1],
          originalPixels[linearizedIndex + 2]
        );
        if (hslColor.h > 180 && hslColor.h < 270) {
          manipulatedPixels[linearizedIndex + 2] = 255;
        } else {
          manipulatedPixels[linearizedIndex + 2] = 0;
        }
      } else {
        manipulatedPixels[linearizedIndex + 2] = 0;
      }
    }
  }
  blendedCanvasCtx.putImageData(manipulatedPixelData, 0, 0);
  return blendedCanvas;
}
