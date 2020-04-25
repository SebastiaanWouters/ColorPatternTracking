import { Camera } from "./jsHtml/master/camera/camera";
import Point from "./Point";
import * as convert from "color-convert";
import {
  ReducedColorsNames,
  ISCC_NBS_COLORS_to_REDUCED_COLORS,
  ISCC_NBS_COLOR_DICT,
  SIMPLE_COLORS_DICT,
} from "../ISCC_NBS_color_dict";

export interface ILabColor {
  l: number;
  a: number;
  b: number;
}

export interface ILabRange {
  l: number;
  a: number;
  b: number;
}

export function labDistanceSq(a: ILabColor, b: ILabColor) {
  return (
    Math.pow(a.l - b.l, 2) + Math.pow(a.a - b.a, 2) + Math.pow(a.b - b.b, 2)
  );
}

export function getLABColorForPixel(
  x: number,
  y: number,
  width: number,
  pixels: Uint8ClampedArray
): ILabColor {
  const i = y * (width * 4) + x * 4;
  return rgbToLab(pixels[i], pixels[i + 1], pixels[i + 2]);
}

export function isSimilarLABColor(
  colorA: ILabColor,
  colorB: ILabColor,
  params: ILabRange
): boolean {
  if (
    Math.abs(colorA.l - colorB.l) <= params.l &&
    Math.abs(colorA.a - colorB.a) <= params.a &&
    Math.abs(colorA.b - colorB.b) <= params.b
  ) {
    return true;
  }
  return false;
}

export function rgbToLab(r: number, g: number, b: number) {
  const labArr = convert.rgb.lab.raw([r, g, b]);
  return {
    l: labArr[0],
    a: labArr[1],
    b: labArr[2],
  };
}

export function detectLabColorsInRange(
  camera: Camera,
  detectionColors: ILabColor[],
  range: ILabRange
): Point[] {
  const newFrame = camera.snap();
  const newFrameCtx = newFrame.getContext("2d");
  const newFramePixelData = newFrameCtx.getImageData(
      0,
      0,
      newFrame.width,
      newFrame.height
    ),
    newFramePixels = newFramePixelData.data;

  const detectedPoints: Point[] = [];

  for (let y = 0; y < newFrame.height; y++) {
    for (let x = 0; x < newFrame.width; x++) {
      const newFrameColor = getLABColorForPixel(
        x,
        y,
        newFrame.width,
        newFramePixels
      );

      for (let i = 0; i < detectionColors.length; i++) {
        if (isSimilarLABColor(newFrameColor, detectionColors[i], range)) {
          detectedPoints.push(new Point(x, y));
          break;
        }
      }
    }
  }

  return detectedPoints;
}
