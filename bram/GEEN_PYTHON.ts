import SlaveScreen from "./SlaveScreen";
import Point from "./Point";
import Line from "./Line";
import * as convert from "color-convert";

export function sortCorners(
  corners: Point[]
): {
  LeftUp: Point;
  RightUp: Point;
  RightUnder: Point;
  LeftUnder: Point;
} {
  //sorteer
  corners = [...corners];
  corners.sort((a, b) => {
    const res = a.x - b.x;
    if (res === 0) {
      return a.y - b.y;
    }
    return res;
  });
  let LeftUp: Point;
  let RightUp: Point;
  let RightUnder: Point;
  let LeftUnder: Point;
  if (corners[0].y < corners[1].y) {
    LeftUp = corners[0];
    LeftUnder = corners[1];
  } else {
    LeftUp = corners[1];
    LeftUnder = corners[0];
  }
  if (corners[2].y < corners[3].y) {
    RightUp = corners[2];
    RightUnder = corners[3];
  } else {
    RightUp = corners[3];
    RightUnder = corners[2];
  }

  return {
    LeftUp,
    LeftUnder,
    RightUp,
    RightUnder,
  };
}

export interface IRGBAColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface IHSLRange {
  hRange: number;
  sRange: number;
  lRange: number;
}

export interface IHSLColor {
  h: number;
  s: number;
  l: number;
}

export function getRGBAColorForPixel(
  x: number,
  y: number,
  width: number,
  pixels: Uint8ClampedArray
): IRGBAColor {
  const i = y * (width * 4) + x * 4;
  return {
    r: pixels[i],
    g: pixels[i + 1],
    b: pixels[i + 2],
    a: pixels[i + 3],
  };
}

export function getHSLColorForPixel(
  x: number,
  y: number,
  width: number,
  pixels: Uint8ClampedArray
): IHSLColor {
  const rgba = getRGBAColorForPixel(x, y, width, pixels);
  const hsl = convert.rgb.hsl([rgba.r, rgba.g, rgba.b]);
  return { h: hsl[0], s: hsl[1], l: hsl[2] };
}

export function isSimilarHSLColor(
  colorA: IHSLColor,
  colorB: IHSLColor,
  params: IHSLRange
): boolean {
  if (
    Math.min(
      Math.abs(colorA.h - colorB.h),
      360 - Math.abs(colorA.h - colorB.h)
    ) <= params.hRange &&
    Math.abs(colorA.s - colorB.s) <= params.sRange &&
    Math.abs(colorA.l - colorB.l) <= params.lRange
  ) {
    return true;
  }
  return false;
}

export function rgbToHsl(r: number, g: number, b: number): IHSLColor {
  const hsl = convert.rgb.hsl([r, g, b]);
  return { h: hsl[0], s: hsl[1], l: hsl[2] };
}

export function hslToRgb(
  hue: number,
  saturation: number,
  lightness: number
): IRGBAColor {
  const rgb = convert.hsl.rgb([hue, saturation, lightness]);
  return { r: rgb[0], g: rgb[1], b: rgb[2], a: 255 };
}

export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      resolve(img);
    };
    img.onerror = (err) => {
      reject(err);
    };
  });
}

function colorRatioInBlock(
  startPoint: Point,
  blockSize: number,
  screenCanvas: HTMLCanvasElement,
  colorToBeSimilarTo: IHSLColor,
  colorRange: IHSLRange,
  pixels: Uint8ClampedArray
): number {
  const endPoint = new Point(
    startPoint.x + blockSize,
    startPoint.y + blockSize
  );

  let hits = 0;
  let totalPixelsInBlock = 0;

  for (let y = startPoint.y; y < endPoint.y; y++) {
    for (let x = startPoint.x; x < endPoint.x; x++) {
      const linearizedIndex = (screenCanvas.width * y + x) * 4;
      const color = rgbToHsl(
        pixels[linearizedIndex],
        pixels[linearizedIndex + 1],
        pixels[linearizedIndex + 2]
      );
      if (isSimilarHSLColor(color, colorToBeSimilarTo, colorRange)) {
        hits++;
      }
      totalPixelsInBlock++;
    }
  }

  return hits / totalPixelsInBlock;
}

async function wait(dt: number) {
  return new Promise((resolve, reject) => {
    setInterval(resolve, dt);
  });
}

export async function matchToNewCorner(
  point: Point,
  screenCanvas: HTMLCanvasElement,
  cornerColor: IHSLColor,
  colorRange: IHSLRange
) {
  const blockSize = Math.round(screenCanvas.height * 0.05); // 5% of screen size.
  const blocksToInvestigateRadius = 2; // We'll look at max 2 blocks in all directions (including diagonals) from the original corner block.

  const screenCtx = screenCanvas.getContext("2d");
  const pixelData = screenCtx.getImageData(
      0,
      0,
      screenCanvas.width,
      screenCanvas.height
    ),
    pixels = pixelData.data;

  let highestPinkRatio = 0;
  let highestPinkBlockStart: Point = new Point(0, 0);

  const startY = point.y - blockSize * blocksToInvestigateRadius;
  const startX = point.x - blockSize * blocksToInvestigateRadius;
  const endY = point.y + blockSize * blocksToInvestigateRadius;
  const endX = point.x + blockSize * blocksToInvestigateRadius;
  for (let y = startY; y < endY; y += blockSize) {
    for (let x = startX; x < endX; x += blockSize) {
      if (
        x < 0 ||
        y < 0 ||
        x >= screenCanvas.width ||
        y >= screenCanvas.height
      ) {
        continue;
      }
      const currentBlockPinkRatio = colorRatioInBlock(
        new Point(x, y),
        blockSize,
        screenCanvas,
        cornerColor,
        colorRange,
        pixels
      );
      if (currentBlockPinkRatio > highestPinkRatio) {
        highestPinkRatio = currentBlockPinkRatio;
        highestPinkBlockStart = new Point(x, y);
      }
    }
  }
  return highestPinkBlockStart;
}
