import HtmlElem from "../../HtmlElem";
import {
  CameraOverlay,
  CameraEnvironmentChangeOverlay,
  CameraScreenColorsOverlay,
} from "./cameraOverlays";
import {
  createCanvas,
  getHSLColorForPixel,
  IHSLRange,
} from "../../../GEEN_PYTHON";
import Point from "../../../Point";
import convert from "color-convert";
import { ColorCombinerBlob } from "../../../ColorCombinerBlob";
import { approxCos, approxSin } from "../../../trig";
import { DetectCircle } from "../../../Circle";
import { Rectangle } from "../../../Rectangle";
import { DetectionBlob } from "../../../DetectionBlob";
import { rgb2lab, lab2rgb } from "../../../lab";
const deltaE = require("delta-e");

export class Camera extends HtmlElem {
  preferredResolutionWidth = 1920;
  preferredResolutionHeight = 1080;
  // preferredResolutionWidth = 352;
  // preferredResolutionHeight = 240;

  get elem(): HTMLVideoElement {
    return document.querySelector("#camera");
  }

  private addOverlays() {
    const elem = this.elem;
    const videoWidth = elem.videoWidth;
    const videoHeight = elem.videoHeight;
    const cameraOverlay = new CameraOverlay();
    const cameraEnvOverlay = new CameraEnvironmentChangeOverlay();
    const cameraScreenColorsOverlay = new CameraScreenColorsOverlay();
    cameraOverlay.width = videoWidth;
    cameraEnvOverlay.width = videoWidth;
    cameraScreenColorsOverlay.width = videoWidth;
    cameraOverlay.height = videoHeight;
    cameraEnvOverlay.height = videoHeight;
    cameraScreenColorsOverlay.height = videoHeight;
  }

  private removeEdgeNoise(edgePixels: Point[], canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const modifiedPixels = imageData.data;
    const originalPixels = new Uint8ClampedArray(imageData.data);

    function pixelAt(x: number, y: number) {
      const i = y * (canvas.width * 4) + x * 4;
      return originalPixels[i];
    }

    const directionSearchSize = 15;
    edgePixels.forEach((pixel) => {
      const searchSizeLeft =
        pixel.x - directionSearchSize >= 0 ? directionSearchSize : pixel.x;
      const searchSizeRight =
        pixel.x + directionSearchSize < canvas.width
          ? directionSearchSize
          : canvas.width - 1 - pixel.x;
      const searchSizeTop =
        pixel.y - directionSearchSize >= 0 ? directionSearchSize : pixel.y;
      const searchSizeBottom =
        pixel.y + directionSearchSize < canvas.height
          ? directionSearchSize
          : canvas.height - 1 - pixel.y;

      let horizontalWeight = 0;
      let verticalWeight = 0;
      for (
        let x = pixel.x - searchSizeLeft;
        x < pixel.x + searchSizeRight;
        x++
      ) {
        if (pixelAt(x, pixel.y) > 1) {
          horizontalWeight++;
        }
      }
      for (
        let y = pixel.y - searchSizeTop;
        y < pixel.y + searchSizeBottom;
        y++
      ) {
        if (pixelAt(pixel.x, y) > 1) {
          verticalWeight++;
        }
      }

      if (
        !(
          horizontalWeight > (searchSizeLeft + searchSizeRight) * 0.25 &&
          verticalWeight > (searchSizeTop + searchSizeBottom) * 0.25
        )
      ) {
        const i = pixel.y * (canvas.width * 4) + pixel.x * 4;
        modifiedPixels[i] = 0;
        modifiedPixels[i + 1] = 0;
        modifiedPixels[i + 2] = 0;
      }
    });

    ctx.putImageData(imageData, 0, 0);
  }

  async start(): Promise<void> {
    const video = this.elem;

    if (navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { min: this.preferredResolutionWidth },
            height: { min: this.preferredResolutionHeight },
          },
        });
        video.srcObject = stream;
        return new Promise((resolve, _) => {
          video.oncanplay = () => {
            this.addOverlays();
            resolve();
          };
        });
      } catch (e) {
        return new Promise((_, rej) => rej(e));
      }
    } else {
      return new Promise((_, rej) => rej("Could not get user media..."));
    }
  }

  snap(): HTMLCanvasElement {
    const elem = this.elem;
    const videoWidth = elem.videoWidth;
    const videoHeight = elem.videoHeight;
    const canvas = createCanvas(videoWidth, videoHeight);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(elem, 0, 0);
    return canvas;
  }

  difference(imgData1: ImageData, imgData2: ImageData) {
    const range: IHSLRange = {
      hRange: 50,
      sRange: 40,
      lRange: 40,
    };

    const pixels1 = imgData1.data;
    const pixels2 = imgData2.data;

    for (let i = 0; i < pixels1.length; i += 4) {
      const hsl1 = convert.rgb.hsl.raw([
        pixels1[i],
        pixels1[i + 1],
        pixels1[i + 2],
      ]);
      const hsl2 = convert.rgb.hsl.raw([
        pixels2[i],
        pixels2[i + 1],
        pixels2[i + 2],
      ]);
      const hDist = Math.min(
        Math.abs(hsl1[0] - hsl2[0]),
        360 - Math.abs(hsl1[0] - hsl2[0])
      );
      const sDist = Math.abs(hsl1[1] - hsl2[1]);
      const lDist = Math.abs(hsl1[2] - hsl2[2]);

      if (
        !(
          hDist <= range.hRange &&
          sDist <= range.sRange &&
          lDist <= range.lRange
        )
      ) {
        pixels2[i] = 0;
        pixels2[i + 1] = 0;
        pixels2[i + 2] = 0;
      }
    }
  }

  whiteBalanceGrayWorld(imageData: ImageData) {
    const pixels = imageData.data;

    let avgR = 0;
    let avgG = 0;
    let avgB = 0;
    let pixelAmt = pixels.length / 4;
    for (let i = 0; i < pixels.length; i += 4) {
      avgR += pixels[i];
      avgG += pixels[i + 1];
      avgB += pixels[i + 2];
    }
    avgR /= pixelAmt;
    avgG /= pixelAmt;
    avgB /= pixelAmt;
    const gray = avgR + avgG + avgB;
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] *= gray / avgR;
      pixels[i + 1] *= gray / avgG;
      pixels[i + 2] *= gray / avgB;
    }
  }

  whiteBalancePerfectReflector(imageData: ImageData) {
    const pixels = imageData.data;

    let max = 0;
    let maxR = 0;
    let maxG = 0;
    let maxB = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const sum = r + g + b;
      if (sum > max) {
        max = sum;
        maxR = r;
        maxG = g;
        maxB = b;
      }
    }
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] /= maxR;
      pixels[i + 1] /= maxG;
      pixels[i + 2] /= maxB;
    }
  }

  colorRegionDetect(coloredCanvas: HTMLCanvasElement): ColorCombinerBlob[] {
    const ctx = coloredCanvas.getContext("2d");
    const imageData = ctx.getImageData(
        0,
        0,
        coloredCanvas.width,
        coloredCanvas.height
      ),
      pixels = imageData.data;

    let blobs: ColorCombinerBlob[] = [];

    for (let y = 0; y < coloredCanvas.height; y++) {
      for (let x = 0; x < coloredCanvas.width; x++) {
        let newFrameColor = getHSLColorForPixel(
          x,
          y,
          coloredCanvas.width,
          pixels
        );

        const detectionHue = 240;
        const absDistanceInHue = Math.abs(detectionHue - newFrameColor.h);

        if (
          newFrameColor.l < 80 &&
          newFrameColor.s > 0 &&
          newFrameColor.h >= 295 &&
          newFrameColor.h <= 340
        ) {
          const point = new Point(x, y);
          if (blobs.length == 0) {
            blobs.push(new ColorCombinerBlob(point, newFrameColor, 5));
          } else {
            let foundBlob = false;
            for (let i = 0; i < blobs.length; i++) {
              const blob = blobs[i];
              if (blob.isCloseEnough(point)) {
                blob.add(point, newFrameColor);
                foundBlob = true;
                break;
              }
            }
            if (!foundBlob) {
              blobs.push(new ColorCombinerBlob(point, newFrameColor, 5));
            }
          }
        }
      }
    }
    return blobs;
  }

  darkRegionDetect(coloredCanvas: HTMLCanvasElement): ColorCombinerBlob[] {
    const ctx = coloredCanvas.getContext("2d");
    const imageData = ctx.getImageData(
        0,
        0,
        coloredCanvas.width,
        coloredCanvas.height
      ),
      pixels = imageData.data;

    let blobs: ColorCombinerBlob[] = [];

    for (let i = 0; i < pixels.length; i += 4) {
      const hsl = convert.rgb.hsl.raw([
        pixels[i],
        pixels[i + 1],
        pixels[i + 2],
      ]);
      if (hsl[2] < 50) {
        const x = i % coloredCanvas.width;
        const y = Math.floor(i / coloredCanvas.width);
        const point = new Point(x, y);
        if (blobs.length == 0) {
          blobs.push(new ColorCombinerBlob(point, { h: 0, s: 0, l: 0 }, 5));
        } else {
          let foundBlob = false;
          for (let i = 0; i < blobs.length; i++) {
            const blob = blobs[i];
            if (blob.isCloseEnough(point)) {
              blob.add(point, { h: 0, s: 0, l: 0 });
              foundBlob = true;
              break;
            }
          }
          if (!foundBlob) {
            blobs.push(new ColorCombinerBlob(point, { h: 0, s: 0, l: 0 }, 5));
          }
        }
      }
    }

    return blobs;
  }

  onlyNearWhiteColors(imageData: ImageData) {
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const hsl = convert.rgb.hsl.raw([data[i], data[i + 1], data[i + 2]]);
      if (hsl[2] < 75) {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
      }
    }
  }

  onlyDarkColors(imageData: ImageData) {
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const hsl = convert.rgb.hsl.raw([data[i], data[i + 1], data[i + 2]]);
      if (hsl[2] > 75 || hsl[2] < 20) {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
      }
    }
  }

  filterBasedOnSaturation(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const hsl = convert.rgb.hsl.raw([data[i], data[i + 1], data[i + 2]]);
      if (hsl[1] < 20) {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  applyGaussianBlur(imageData: ImageData) {
    const modifiedPixels = imageData.data;
    const originalPixels = new Uint8ClampedArray(imageData.data);
    const width = imageData.width;
    const height = imageData.height;

    const kernel = [
      [0.0625, 0.125, 0.0625],
      [0.125, 0.25, 0.125],
      [0.0625, 0.125, 0.0625],
    ];

    function redAt(x: number, y: number) {
      const i = y * (width * 4) + x * 4;
      return originalPixels[i];
    }

    function greenAt(x: number, y: number) {
      const i = y * (width * 4) + x * 4;
      return originalPixels[i + 1];
    }

    function blueAt(x: number, y: number) {
      const i = y * (width * 4) + x * 4;
      return originalPixels[i + 2];
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const red =
          kernel[0][0] * redAt(x - 1, y - 1) +
          kernel[0][1] * redAt(x, y - 1) +
          kernel[0][2] * redAt(x + 1, y - 1) +
          kernel[1][0] * redAt(x - 1, y) +
          kernel[1][1] * redAt(x, y) +
          kernel[1][2] * redAt(x + 1, y) +
          kernel[2][0] * redAt(x - 1, y + 1) +
          kernel[2][1] * redAt(x, y + 1) +
          kernel[2][2] * redAt(x + 1, y + 1);

        const green =
          kernel[0][0] * greenAt(x - 1, y - 1) +
          kernel[0][1] * greenAt(x, y - 1) +
          kernel[0][2] * greenAt(x + 1, y - 1) +
          kernel[1][0] * greenAt(x - 1, y) +
          kernel[1][1] * greenAt(x, y) +
          kernel[1][2] * greenAt(x + 1, y) +
          kernel[2][0] * greenAt(x - 1, y + 1) +
          kernel[2][1] * greenAt(x, y + 1) +
          kernel[2][2] * greenAt(x + 1, y + 1);

        const blue =
          kernel[0][0] * blueAt(x - 1, y - 1) +
          kernel[0][1] * blueAt(x, y - 1) +
          kernel[0][2] * blueAt(x + 1, y - 1) +
          kernel[1][0] * blueAt(x - 1, y) +
          kernel[1][1] * blueAt(x, y) +
          kernel[1][2] * blueAt(x + 1, y) +
          kernel[2][0] * blueAt(x - 1, y + 1) +
          kernel[2][1] * blueAt(x, y + 1) +
          kernel[2][2] * blueAt(x + 1, y + 1);

        const i = y * (width * 4) + x * 4;
        modifiedPixels[i] = red;
        modifiedPixels[i + 1] = green;
        modifiedPixels[i + 2] = blue;
      }
    }
  }

  applyBigGaussianBlur(imageData: ImageData) {
    const modifiedPixels = imageData.data;
    const originalPixels = new Uint8ClampedArray(imageData.data);
    const width = imageData.width;
    const height = imageData.height;

    const div = 159;
    const kernel = [
      [2 / div, 4 / div, 5 / div, 4 / div, 2 / div],
      [4 / div, 9 / div, 12 / div, 9 / div, 4 / div],
      [5 / div, 12 / div, 15 / div, 12 / div, 5 / div],
      [4 / div, 9 / div, 12 / div, 9 / div, 4 / div],
      [2 / div, 4 / div, 5 / div, 4 / div, 2 / div],
    ];

    function redAt(x: number, y: number) {
      const i = y * (width * 4) + x * 4;
      return originalPixels[i];
    }

    function greenAt(x: number, y: number) {
      const i = y * (width * 4) + x * 4;
      return originalPixels[i + 1];
    }

    function blueAt(x: number, y: number) {
      const i = y * (width * 4) + x * 4;
      return originalPixels[i + 2];
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const red =
          kernel[0][0] * redAt(x - 2, y - 2) +
          kernel[0][1] * redAt(x - 1, y - 2) +
          kernel[0][2] * redAt(x, y - 2) +
          kernel[0][3] * redAt(x + 1, y - 2) +
          kernel[0][4] * redAt(x + 2, y - 2) +
          kernel[1][0] * redAt(x - 2, y - 1) +
          kernel[1][1] * redAt(x - 1, y - 1) +
          kernel[1][2] * redAt(x, y - 1) +
          kernel[1][3] * redAt(x + 1, y - 1) +
          kernel[1][4] * redAt(x + 2, y - 1) +
          kernel[2][0] * redAt(x - 2, y) +
          kernel[2][1] * redAt(x - 1, y) +
          kernel[2][2] * redAt(x, y) +
          kernel[2][3] * redAt(x + 1, y) +
          kernel[2][4] * redAt(x + 2, y) +
          kernel[3][0] * redAt(x - 2, y + 1) +
          kernel[3][1] * redAt(x - 1, y + 1) +
          kernel[3][2] * redAt(x, y + 1) +
          kernel[3][3] * redAt(x + 1, y + 1) +
          kernel[3][4] * redAt(x + 2, y + 1) +
          kernel[4][0] * redAt(x - 2, y + 2) +
          kernel[4][1] * redAt(x - 1, y + 2) +
          kernel[4][2] * redAt(x, y + 2) +
          kernel[4][3] * redAt(x + 1, y + 2) +
          kernel[4][4] * redAt(x + 2, y + 2);

        const green =
          kernel[0][0] * greenAt(x - 2, y - 2) +
          kernel[0][1] * greenAt(x - 1, y - 2) +
          kernel[0][2] * greenAt(x, y - 2) +
          kernel[0][3] * greenAt(x + 1, y - 2) +
          kernel[0][4] * greenAt(x + 2, y - 2) +
          kernel[1][0] * greenAt(x - 2, y - 1) +
          kernel[1][1] * greenAt(x - 1, y - 1) +
          kernel[1][2] * greenAt(x, y - 1) +
          kernel[1][3] * greenAt(x + 1, y - 1) +
          kernel[1][4] * greenAt(x + 2, y - 1) +
          kernel[2][0] * greenAt(x - 2, y) +
          kernel[2][1] * greenAt(x - 1, y) +
          kernel[2][2] * greenAt(x, y) +
          kernel[2][3] * greenAt(x + 1, y) +
          kernel[2][4] * greenAt(x + 2, y) +
          kernel[3][0] * greenAt(x - 2, y + 1) +
          kernel[3][1] * greenAt(x - 1, y + 1) +
          kernel[3][2] * greenAt(x, y + 1) +
          kernel[3][3] * greenAt(x + 1, y + 1) +
          kernel[3][4] * greenAt(x + 2, y + 1) +
          kernel[4][0] * greenAt(x - 2, y + 2) +
          kernel[4][1] * greenAt(x - 1, y + 2) +
          kernel[4][2] * greenAt(x, y + 2) +
          kernel[4][3] * greenAt(x + 1, y + 2) +
          kernel[4][4] * greenAt(x + 2, y + 2);

        const blue =
          kernel[0][0] * blueAt(x - 2, y - 2) +
          kernel[0][1] * blueAt(x - 1, y - 2) +
          kernel[0][2] * blueAt(x, y - 2) +
          kernel[0][3] * blueAt(x + 1, y - 2) +
          kernel[0][4] * blueAt(x + 2, y - 2) +
          kernel[1][0] * blueAt(x - 2, y - 1) +
          kernel[1][1] * blueAt(x - 1, y - 1) +
          kernel[1][2] * blueAt(x, y - 1) +
          kernel[1][3] * blueAt(x + 1, y - 1) +
          kernel[1][4] * blueAt(x + 2, y - 1) +
          kernel[2][0] * blueAt(x - 2, y) +
          kernel[2][1] * blueAt(x - 1, y) +
          kernel[2][2] * blueAt(x, y) +
          kernel[2][3] * blueAt(x + 1, y) +
          kernel[2][4] * blueAt(x + 2, y) +
          kernel[3][0] * blueAt(x - 2, y + 1) +
          kernel[3][1] * blueAt(x - 1, y + 1) +
          kernel[3][2] * blueAt(x, y + 1) +
          kernel[3][3] * blueAt(x + 1, y + 1) +
          kernel[3][4] * blueAt(x + 2, y + 1) +
          kernel[4][0] * blueAt(x - 2, y + 2) +
          kernel[4][1] * blueAt(x - 1, y + 2) +
          kernel[4][2] * blueAt(x, y + 2) +
          kernel[4][3] * blueAt(x + 1, y + 2) +
          kernel[4][4] * blueAt(x + 2, y + 2);

        const i = y * (width * 4) + x * 4;
        modifiedPixels[i] = red;
        modifiedPixels[i + 1] = green;
        modifiedPixels[i + 2] = blue;
      }
    }
  }

  applyBigGaussianBlurAndGrayScale(imageData: ImageData) {
    const modifiedPixels = imageData.data;
    const originalPixels = new Uint8ClampedArray(imageData.data);
    const width = imageData.width;
    const height = imageData.height;

    const div = 159;
    const kernel: Float32Array = new Float32Array([
      2 / div,
      4 / div,
      5 / div,
      4 / div,
      2 / div,
      4 / div,
      9 / div,
      12 / div,
      9 / div,
      4 / div,
      5 / div,
      12 / div,
      15 / div,
      12 / div,
      5 / div,
      4 / div,
      9 / div,
      12 / div,
      9 / div,
      4 / div,
      2 / div,
      4 / div,
      5 / div,
      4 / div,
      2 / div,
    ]);

    // const div = 273;
    // const kernel: Float32Array = new Float32Array([
    //   1 / div,
    //   4 / div,
    //   7 / div,
    //   4 / div,
    //   1 / div,
    //   4 / div,
    //   16 / div,
    //   26 / div,
    //   16 / div,
    //   4 / div,
    //   7 / div,
    //   26 / div,
    //   41 / div,
    //   26 / div,
    //   7 / div,
    //   4 / div,
    //   16 / div,
    //   26 / div,
    //   16 / div,
    //   4 / div,
    //   1 / div,
    //   4 / div,
    //   7 / div,
    //   4 / div,
    //   1 / div,
    // ]);

    function redAt(x: number, y: number) {
      const i = y * (width * 4) + x * 4;
      return originalPixels[i];
    }

    function greenAt(x: number, y: number) {
      const i = y * (width * 4) + x * 4;
      return originalPixels[i + 1];
    }

    function blueAt(x: number, y: number) {
      const i = y * (width * 4) + x * 4;
      return originalPixels[i + 2];
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0;
        let g = 0;
        let b = 0;
        let x_k = -2;
        let y_k = -2;
        for (let k = 0; k < kernel.length; k++) {
          r += kernel[k] * redAt(x + x_k, y + y_k);
          g += kernel[k] * greenAt(x + x_k, y + y_k);
          b += kernel[k] * blueAt(x + x_k, y + y_k);
          if (++x_k > 2) {
            x_k = -2;
            y_k++;
          }
        }
        const i = y * (width * 4) + x * 4;
        const gray = (r + g + b) / 3;
        // const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        modifiedPixels[i] = gray;
        modifiedPixels[i + 1] = gray;
        modifiedPixels[i + 2] = gray;
      }
    }
  }

  applySharpen(imageData: ImageData) {
    const modifiedPixels = imageData.data;
    const originalPixels = new Uint8ClampedArray(imageData.data);
    const width = imageData.width;
    const height = imageData.height;

    const kernel: Int8Array = new Int8Array([0, -1, 0, -1, 5, -1, 0, -1, 0]);

    function redAt(x: number, y: number) {
      const i = y * (width * 4) + x * 4;
      return originalPixels[i];
    }

    function greenAt(x: number, y: number) {
      const i = y * (width * 4) + x * 4;
      return originalPixels[i + 1];
    }

    function blueAt(x: number, y: number) {
      const i = y * (width * 4) + x * 4;
      return originalPixels[i + 2];
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0;
        let g = 0;
        let b = 0;
        let x_k = -1;
        let y_k = -1;
        for (let k = 0; k < kernel.length; k++) {
          r += kernel[k] * redAt(x + x_k, y + y_k);
          g += kernel[k] * greenAt(x + x_k, y + y_k);
          b += kernel[k] * blueAt(x + x_k, y + y_k);
          if (++x_k > 1) {
            x_k = -1;
            y_k++;
          }
        }
        const i = y * (width * 4) + x * 4;
        modifiedPixels[i] = r < 0 ? 0 : r > 255 ? 255 : r;
        modifiedPixels[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
        modifiedPixels[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
      }
    }
  }

  toGrayScale(imageData: ImageData) {
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = avg; // red
      data[i + 1] = avg; // green
      data[i + 2] = avg; // blue
    }
  }

  // Altered version from: https://github.com/miguelmota/sobel
  applySobelEdgeFilterOnLightPixels(imageData: ImageData) {
    this.whiteBalanceGrayWorld(imageData);
    this.onlyNearWhiteColors(imageData);
    this.applyBigGaussianBlurAndGrayScale(imageData);
    this.applySharpen(imageData);
    const modifiedPixels = imageData.data;
    const originalPixels = new Uint8ClampedArray(imageData.data);
    const width = imageData.width;
    const height = imageData.height;

    const kernelX = new Int8Array([-1, 0, 1, -2, 0, 2, -1, 0, 1]);
    const kernelY = new Int8Array([-1, -2, -1, 0, 0, 0, 1, 2, 1]);

    const edgePoints: Point[] = [];

    function pixelAt(x: number, y: number) {
      const i = y * (width * 4) + x * 4;
      return originalPixels[i];
    }

    const edgeNeglectDist = 10;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * (width * 4) + x * 4;
        if (
          x - edgeNeglectDist < 0 ||
          y - edgeNeglectDist < 0 ||
          x > width - edgeNeglectDist ||
          y > height - edgeNeglectDist
        ) {
          modifiedPixels[i] = 0;
          modifiedPixels[i + 1] = 0;
          modifiedPixels[i + 2] = 0;
          continue;
        }

        let gx = 0;
        let gy = 0;
        let x_k = -1;
        let y_k = -1;
        for (let k = 0; k < kernelX.length; k++) {
          const pixelVal = pixelAt(x + x_k, y + y_k);
          gx += kernelX[k] * pixelVal;
          gy += kernelY[k] * pixelVal;
          if (++x_k > 1) {
            x_k = -1;
            y_k++;
          }
        }

        const gradientMagnitude = Math.sqrt(gx * gx + gy * gy);
        // const gradientDirection = (Math.atan(gy / gx) * 180) / Math.PI;

        // if (gradientMagnitude <= 22.5 || gradientMagnitude > 157.5) {

        // }

        const threshold = 1442 * 0.5;
        // const threshold = 1442 * 0.25;
        if (gradientMagnitude > threshold) {
          modifiedPixels[i] = 255;
          modifiedPixels[i + 1] = 255;
          modifiedPixels[i + 2] = 255;
          edgePoints.push(new Point(x, y));
        } else {
          modifiedPixels[i] = 0;
          modifiedPixels[i + 1] = 0;
          modifiedPixels[i + 2] = 0;
        }
      }
    }

    return edgePoints;
  }

  filterEdgePixels(edgePixels: Point[], coloredCanvas: HTMLCanvasElement) {
    const searchBlobs = this.colorRegionDetect(coloredCanvas);
    const pixelsInBlobs: Point[] = [];
    searchBlobs.forEach((blob) => {
      edgePixels.forEach((pixel) => {
        if (blob.contains(pixel)) {
          pixelsInBlobs.push(pixel);
        }
      });
    });
    return pixelsInBlobs;
  }

  filterNonBlockyAreas(edgePixels: Point[]) {
    const kernel = [
      [1, 1, 1],
      [1, 0, 1],
      [1, 1, 1],
    ];

    // The value will either be 1 or 0.
    function valAt(x: number, y: number) {
      return edgePixels.find((pixel) => pixel.x == x && pixel.y == y) ? 1 : 0;
    }

    const filteredPixels: Point[] = [];
    edgePixels.forEach((pixel) => {
      const x = pixel.x;
      const y = pixel.y;
      const total =
        kernel[0][0] * valAt(x - 1, y - 1) +
        kernel[0][1] * valAt(x, y - 1) +
        kernel[0][2] * valAt(x + 1, y - 1) +
        kernel[1][0] * valAt(x - 1, y) +
        kernel[1][2] * valAt(x + 1, y) +
        kernel[2][0] * valAt(x - 1, y + 1) +
        kernel[2][1] * valAt(x, y + 1) +
        kernel[2][2] * valAt(x + 1, y + 1);

      if (total > 5) {
        filteredPixels.push(pixel);
      }
    });
    return filteredPixels;
  }

  filterPixelsNotCloseToCornerColor(
    edgePixels: Point[],
    coloredCanvas: HTMLCanvasElement
  ) {
    const ctx = coloredCanvas.getContext("2d");
    const imageData = ctx.getImageData(
      0,
      0,
      coloredCanvas.width,
      coloredCanvas.height
    );
    const pixels = imageData.data;

    const redHue = 0;
    const blueHue = 240;

    function hueAt(x: number, y: number) {
      const i = y * (coloredCanvas.width * 4) + x * 4;
      return convert.rgb.hsl.raw([pixels[i], pixels[i + 1], pixels[i + 2]])[0];
    }

    const filteredPixels: Point[] = [];

    const maxSearchRange = 1;
    for (let pixelIndex = 0; pixelIndex < edgePixels.length; pixelIndex++) {
      const pixel = edgePixels[pixelIndex];
      for (
        let y = pixel.y - maxSearchRange;
        y < pixel.y + maxSearchRange;
        y++
      ) {
        for (
          let x = pixel.x - maxSearchRange;
          x < pixel.x + maxSearchRange;
          x++
        ) {
          const hue = hueAt(x, y);
          const distToRed = Math.min(
            Math.abs(redHue - hue),
            360 - Math.abs(redHue - hue)
          );
          const distToBlue = Math.min(
            Math.abs(blueHue - hue),
            360 - Math.abs(blueHue - hue)
          );
          if (distToBlue < 50 || distToRed < 20) {
            filteredPixels.push(pixel);
          }
        }
      }
    }

    return filteredPixels;
  }

  filterToRegions(edgePixels: Point[]) {
    const regions: Array<Point[]> = [];

    const maxDistToRegionSq = 4 * 4;
    let foundRegion = false;
    for (let i = 0; i < edgePixels.length; i++) {
      const pixel = edgePixels[i];
      for (let j = 0; j < regions.length; j++) {
        const region = regions[j];
        for (let k = 0; k < region.length; k++) {
          const regionPixel = region[k];
          if (pixel.distanceSq(regionPixel) < maxDistToRegionSq) {
            region.push(pixel);
            foundRegion = true;
            break;
          }
        }
        if (foundRegion) {
          break;
        }
      }
      if (!foundRegion) {
        regions.push([pixel]);
      }
      foundRegion = false;
    }

    return regions;
  }

  findPointsOfInterest(edgePixels: Point[], coloredCanvas: HTMLCanvasElement) {
    const ctx = coloredCanvas.getContext("2d");
    const imageData = ctx.getImageData(
      0,
      0,
      coloredCanvas.width,
      coloredCanvas.height
    );
    const pixels = imageData.data;
    const width = imageData.width;

    const maxDistBetweenCircleSq = Math.pow(30, 2);
    const pointsOfInterest: Point[] = [];

    ctx.fillStyle = "rgba(255, 0, 0, 1)";
    edgePixels.forEach((pixel) => {
      const cx = pixel.x;
      const cy = pixel.y;
      let newCircle = true;
      for (let i = 0; i < pointsOfInterest.length; i++) {
        if (
          pointsOfInterest[i].distanceSq(new Point(cx, cy)) <
          maxDistBetweenCircleSq
        ) {
          pointsOfInterest[i].x = (pointsOfInterest[i].x + cx) / 2;
          pointsOfInterest[i].y = (pointsOfInterest[i].y + cy) / 2;
          newCircle = false;
          break;
        }
      }
      if (newCircle) {
        pointsOfInterest.push(new Point(cx, cy));
      }
    });

    return pointsOfInterest;
  }

  searchHuesAroundEdges(edgePixels: Point[], canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    const huePixels: Point[] = [];

    function rgbAt(x: number, y: number): [number, number, number] {
      const i = y * (canvas.width * 4) + x * 4;
      return [pixels[i], pixels[i + 1], pixels[i + 2]];
    }

    function isInHueRange(hueA: number, hueB: number) {
      return Math.min(Math.abs(hueA - hueB), 360 - Math.abs(hueA - hueB)) < 1;
    }

    function isInLightRange(lightA: number, lightB: number) {
      return Math.abs(lightA - lightB) < 25;
    }

    function isInSaturationRange(satA: number, satB: number) {
      return Math.abs(satA - satB) < 10;
    }

    function pushIfInHueAndLightRange(
      pixel: Point,
      hsl: [number, number, number]
    ) {
      if (
        (isInHueRange(240, hsl[0]) || isInHueRange(360, hsl[0])) &&
        isInLightRange(25, hsl[1]) &&
        isInSaturationRange(100, hsl[2])
      ) {
        huePixels.push(pixel);
      }
    }

    edgePixels.forEach((pixel, edgePixelIndex) => {
      if (pixel.x > 0) {
        // check left
        const hsl = convert.rgb.hsl.raw(rgbAt(pixel.x - 1, pixel.y));
        pushIfInHueAndLightRange(pixel, hsl);
      }
      if (pixel.x < canvas.width - 1) {
        // check right
        const hsl = convert.rgb.hsl.raw(rgbAt(pixel.x + 1, pixel.y));
        pushIfInHueAndLightRange(pixel, hsl);
      }
      if (pixel.y > 0) {
        // check top
        const hsl = convert.rgb.hsl.raw(rgbAt(pixel.x, pixel.y - 1));
        pushIfInHueAndLightRange(pixel, hsl);
      }
      if (pixel.y < canvas.height - 1) {
        // check bottom
        const hsl = convert.rgb.hsl.raw(rgbAt(pixel.x, pixel.y + 1));
        pushIfInHueAndLightRange(pixel, hsl);
      }
      if (pixel.x > 0 && pixel.y > 0) {
        // check top-left
        const hsl = convert.rgb.hsl.raw(rgbAt(pixel.x - 1, pixel.y - 1));
        pushIfInHueAndLightRange(pixel, hsl);
      }
      if (pixel.x < canvas.width - 1 && pixel.y > 0) {
        // check top-right
        const hsl = convert.rgb.hsl.raw(rgbAt(pixel.x + 1, pixel.y - 1));
        pushIfInHueAndLightRange(pixel, hsl);
      }
      if (pixel.x < canvas.width - 1 && pixel.y < canvas.height - 1) {
        // check bottom-right
        const hsl = convert.rgb.hsl.raw(rgbAt(pixel.x + 1, pixel.y + 1));
        pushIfInHueAndLightRange(pixel, hsl);
      }
      if (pixel.x > 0 && pixel.y < canvas.height - 1) {
        // check bottom-left
        const hsl = convert.rgb.hsl.raw(rgbAt(pixel.x - 1, pixel.y + 1));
        pushIfInHueAndLightRange(pixel, hsl);
      }
    });

    return huePixels;
  }

  filterToColorNeighborEdges(edgePixels: Point[], canvas: HTMLCanvasElement) {
    const searchDist = 1;
    const threshold = 2;

    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    const filteredPixels: Point[] = [];

    function hueAt(x: number, y: number) {
      const i = y * (canvas.width * 4) + x * 4;
      return convert.rgb.hsl.raw([pixels[i], pixels[i + 1], pixels[i + 2]])[0];
    }

    function lightAt(x: number, y: number) {
      const i = y * (canvas.width * 4) + x * 4;
      return convert.rgb.hsl.raw([pixels[i], pixels[i + 1], pixels[i + 2]])[2];
    }

    function saturationAt(x: number, y: number) {
      const i = y * (canvas.width * 4) + x * 4;
      return convert.rgb.hsl.raw([pixels[i], pixels[i + 1], pixels[i + 2]])[1];
    }

    edgePixels.forEach((pixel) => {
      let colorCount = 0;
      for (let y = pixel.y - searchDist; y < pixel.y + searchDist; y++) {
        for (let x = pixel.x - searchDist; x < pixel.x + searchDist; x++) {
          const hue = hueAt(x, y);
          const sat = saturationAt(x, y);
          const light = lightAt(x, y);
          if (hue <= 270 && hue >= 200 && light <= 85 && sat >= 0) {
            colorCount++;
            if (colorCount >= threshold) {
              filteredPixels.push(pixel);
              break;
            }
          }
        }
        if (colorCount >= threshold) {
          break;
        }
      }
    });

    return filteredPixels;
  }

  // This was an enourmous help: https://imagej.nih.gov/ij/plugins/download/Hough_Circles.java
  circularHoughTransform(
    edgePixels: Point[],
    avgVotes: number,
    canvas: HTMLCanvasElement
  ): [DetectCircle[], number] {
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "rgba(0, 255, 0, 0.01)";
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    const radiusStep = 1;
    const minRadius = 10;
    const maxRadius = 30;
    const depth = Math.floor((maxRadius - minRadius) / radiusStep) + 1;

    // [vote_p0_0...vote_p0_depth, vote_p1_0...vote_p1_depth, ...]
    const acc: Uint32Array = new Uint32Array((pixels.length / 4) * depth);

    const circles: Array<DetectCircle> = [];
    const acceptableVoteThreshold = 5;

    let maxVotes = -1;
    let bestX = 0;
    let bestY = 0;
    let bestR = 0;
    for (let k = 0; k < edgePixels.length; k++) {
      const pixel = edgePixels[k];
      const x = pixel.x;
      const y = pixel.y;
      for (let r = 0; r < depth; r++) {
        const radius = r * radiusStep + minRadius;
        for (let degrees = 0; degrees < 360; degrees += 5) {
          const a = Math.round(x + radius * approxCos(degrees));
          const b = Math.round(y + radius * approxSin(degrees));
          const i = b * (canvas.width * depth) + a * depth + r;
          if (i >= 0 && i < acc.length) {
            const votes = ++acc[i];
            if (votes > maxVotes) {
              maxVotes = votes;
              bestX = a;
              bestY = b;
              bestR = radius;
            }
            if (votes > acceptableVoteThreshold) {
              let circle =
                circles.find((circle) => circle.x == a && circle.y == b) ||
                new DetectCircle(new Point(a, b), radius, votes);
              circle.radius = radius;
              circle.votes = votes;
              circles.push(circle);
            }
          }
        }
      }
    }

    let top10avgVote: number = 25;
    circles.sort((a, b) => b.votes - a.votes);

    return [circles, top10avgVote];
  }
}

export class Camera2 extends HtmlElem {
  preferredResolutionWidth = 1920;
  preferredResolutionHeight = 1080;
  // preferredResolutionWidth = 352;
  // preferredResolutionHeight = 240;

  get elem(): HTMLVideoElement {
    return document.querySelector("#camera");
  }

  private addOverlays() {
    const elem = this.elem;
    const videoWidth = elem.videoWidth;
    const videoHeight = elem.videoHeight;
    const cameraOverlay = new CameraOverlay();
    const cameraEnvOverlay = new CameraEnvironmentChangeOverlay();
    const cameraScreenColorsOverlay = new CameraScreenColorsOverlay();
    cameraOverlay.width = videoWidth;
    cameraEnvOverlay.width = videoWidth;
    cameraScreenColorsOverlay.width = videoWidth;
    cameraOverlay.height = videoHeight;
    cameraEnvOverlay.height = videoHeight;
    cameraScreenColorsOverlay.height = videoHeight;
  }

  async start(): Promise<void> {
    const video = this.elem;

    if (navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { max: this.preferredResolutionWidth },
            height: { max: this.preferredResolutionHeight },
          },
        });
        video.srcObject = stream;
        return new Promise((resolve, _) => {
          video.oncanplay = () => {
            this.addOverlays();
            resolve();
          };
        });
      } catch (e) {
        return new Promise((_, rej) => rej(e));
      }
    } else {
      return new Promise((_, rej) => rej("Could not get user media..."));
    }
  }

  snap(): HTMLCanvasElement {
    const elem = this.elem;
    const videoWidth = elem.videoWidth;
    const videoHeight = elem.videoHeight;
    const canvas = createCanvas(videoWidth, videoHeight);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(elem, 0, 0);
    return canvas;
  }

  difference(imgData1: ImageData, imgData2: ImageData) {
    const range: IHSLRange = {
      hRange: 50,
      sRange: 40,
      lRange: 40,
    };

    const pixels1 = imgData1.data;
    const pixels2 = imgData2.data;

    for (let i = 0; i < pixels1.length; i += 4) {
      const hsl1 = convert.rgb.hsl.raw([
        pixels1[i],
        pixels1[i + 1],
        pixels1[i + 2],
      ]);
      const hsl2 = convert.rgb.hsl.raw([
        pixels2[i],
        pixels2[i + 1],
        pixels2[i + 2],
      ]);
      const hDist = Math.min(
        Math.abs(hsl1[0] - hsl2[0]),
        360 - Math.abs(hsl1[0] - hsl2[0])
      );
      const sDist = Math.abs(hsl1[1] - hsl2[1]);
      const lDist = Math.abs(hsl1[2] - hsl2[2]);

      if (
        !(
          hDist <= range.hRange &&
          sDist <= range.sRange &&
          lDist <= range.lRange
        )
      ) {
        pixels2[i] = pixels2[i];
        pixels2[i + 1] = pixels2[i + 1];
        pixels2[i + 2] = pixels2[i + 2];
      } else {
        pixels2[i] = 0;
        pixels2[i + 1] = 0;
        pixels2[i + 2] = 0;
      }
    }
  }

  difference1(blancoImgData: ImageData, coloredCanvasData: ImageData) {
    const blancoPixels = blancoImgData.data;
    const coloredPixels = coloredCanvasData.data;

    for (let i = 0; i < blancoPixels.length; i += 4) {
      const blancoFrameColor = convert.rgb.hsl.raw([
        blancoPixels[i],
        blancoPixels[i + 1],
        blancoPixels[i + 2],
      ]);
      const coloredFrameColor = convert.rgb.hsl.raw([
        coloredPixels[i],
        coloredPixels[i + 1],
        coloredPixels[i + 2],
      ]);
      const blancoFrameColorIsRed =
        blancoFrameColor[0] < 50 || blancoFrameColor[0] > 330;
      const coloredFrameIsBlue =
        coloredFrameColor[0] >= 200 && coloredFrameColor[0] <= 270;
      if (
        blancoFrameColorIsRed &&
        blancoFrameColor[2] < 75 &&
        (coloredFrameColor[2] > 75 || coloredFrameIsBlue)
      ) {
        coloredPixels[i] = coloredPixels[i];
        coloredPixels[i + 1] = coloredPixels[i + 1];
        coloredPixels[i + 2] = coloredPixels[i + 2];
      } else {
        coloredPixels[i] = 0;
        coloredPixels[i + 1] = 0;
        coloredPixels[i + 2] = 0;
      }
    }
  }

  whiteBalance(imageData: ImageData) {
    const pixels = imageData.data;

    let avgR = 0;
    let avgG = 0;
    let avgB = 0;
    let pixelAmt = pixels.length / 4;
    for (let i = 0; i < pixels.length; i += 4) {
      avgR += pixels[i];
      avgG += pixels[i + 1];
      avgB += pixels[i + 2];
    }
    avgR /= pixelAmt;
    avgG /= pixelAmt;
    avgB /= pixelAmt;
    const gray = avgR + avgG + avgB;
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] *= gray / avgR;
      pixels[i + 1] *= gray / avgG;
      pixels[i + 2] *= gray / avgB;
    }
  }

  onlyNearWhiteColors(imageData: ImageData) {
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const hsl = convert.rgb.hsl.raw([data[i], data[i + 1], data[i + 2]]);
      if (hsl[2] < 75) {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
      }
    }
  }

  applyBigGaussianBlurAndGrayScale(imageData: ImageData) {
    const modifiedPixels = imageData.data;
    const originalPixels = new Uint8ClampedArray(imageData.data);
    const width = imageData.width;
    const height = imageData.height;

    const div = 159;
    const kernel: Float32Array = new Float32Array([
      2 / div,
      4 / div,
      5 / div,
      4 / div,
      2 / div,
      4 / div,
      9 / div,
      12 / div,
      9 / div,
      4 / div,
      5 / div,
      12 / div,
      15 / div,
      12 / div,
      5 / div,
      4 / div,
      9 / div,
      12 / div,
      9 / div,
      4 / div,
      2 / div,
      4 / div,
      5 / div,
      4 / div,
      2 / div,
    ]);

    function redAt(x: number, y: number) {
      const i = y * (width * 4) + x * 4;
      return originalPixels[i];
    }

    function greenAt(x: number, y: number) {
      const i = y * (width * 4) + x * 4;
      return originalPixels[i + 1];
    }

    function blueAt(x: number, y: number) {
      const i = y * (width * 4) + x * 4;
      return originalPixels[i + 2];
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0;
        let g = 0;
        let b = 0;
        let x_k = -2;
        let y_k = -2;
        for (let k = 0; k < kernel.length; k++) {
          r += kernel[k] * redAt(x + x_k, y + y_k);
          g += kernel[k] * greenAt(x + x_k, y + y_k);
          b += kernel[k] * blueAt(x + x_k, y + y_k);
          if (++x_k > 2) {
            x_k = -2;
            y_k++;
          }
        }
        const i = y * (width * 4) + x * 4;
        const gray = (r + g + b) / 3;
        // const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        modifiedPixels[i] = gray;
        modifiedPixels[i + 1] = gray;
        modifiedPixels[i + 2] = gray;
      }
    }
  }

  applySharpen(imageData: ImageData) {
    const modifiedPixels = imageData.data;
    const originalPixels = new Uint8ClampedArray(imageData.data);
    const width = imageData.width;
    const height = imageData.height;

    const kernel: Int8Array = new Int8Array([0, -1, 0, -1, 5, -1, 0, -1, 0]);

    function redAt(x: number, y: number) {
      const i = y * (width * 4) + x * 4;
      return originalPixels[i];
    }

    function greenAt(x: number, y: number) {
      const i = y * (width * 4) + x * 4;
      return originalPixels[i + 1];
    }

    function blueAt(x: number, y: number) {
      const i = y * (width * 4) + x * 4;
      return originalPixels[i + 2];
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0;
        let g = 0;
        let b = 0;
        let x_k = -1;
        let y_k = -1;
        for (let k = 0; k < kernel.length; k++) {
          r += kernel[k] * redAt(x + x_k, y + y_k);
          g += kernel[k] * greenAt(x + x_k, y + y_k);
          b += kernel[k] * blueAt(x + x_k, y + y_k);
          if (++x_k > 1) {
            x_k = -1;
            y_k++;
          }
        }
        const i = y * (width * 4) + x * 4;
        modifiedPixels[i] = r < 0 ? 0 : r > 255 ? 255 : r;
        modifiedPixels[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
        modifiedPixels[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
      }
    }
  }

  toGrayScale(imageData: ImageData) {
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = avg; // red
      data[i + 1] = avg; // green
      data[i + 2] = avg; // blue
    }
  }

  findBlobs(imageData: ImageData) {
    const pixels = imageData.data;

    const detectionBlobs: DetectionBlob[] = [];

    for (let y = 0; y < imageData.height; y++) {
      for (let x = 0; x < imageData.width; x++) {
        const i = y * (imageData.width * 4) + x * 4;
        const [hue, sat, light] = convert.rgb.hsl([
          pixels[i],
          pixels[i + 1],
          pixels[i + 2],
        ]);
        if (hue > 220 && hue <= 260 && light <= 75 && light >= 10) {
          const point = new Point(x, y);
          const blob =
            detectionBlobs.find((blob) => blob.isIn(point)) ||
            detectionBlobs.find((blob) => blob.isCloseEnough(point));
          if (blob) {
            blob.add(point);
          } else {
            detectionBlobs.push(new DetectionBlob(point, 5));
          }
        }
      }
    }

    return detectionBlobs;
  }

  // Altered version from: https://github.com/miguelmota/sobel
  applySobelEdgeFilter(imageData: ImageData) {
    const modifiedPixels = imageData.data;
    const originalPixels = new Uint8ClampedArray(imageData.data);
    const width = imageData.width;
    const height = imageData.height;

    const kernelX = new Int8Array([-1, 0, 1, -2, 0, 2, -1, 0, 1]);
    const kernelY = new Int8Array([-1, -2, -1, 0, 0, 0, 1, 2, 1]);

    const edgePoints: Point[] = [];

    function pixelAt(x: number, y: number) {
      const i = y * (width * 4) + x * 4;
      return originalPixels[i];
    }

    const edgeNeglectDist = 10;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * (width * 4) + x * 4;
        if (
          x - edgeNeglectDist < 0 ||
          y - edgeNeglectDist < 0 ||
          x > width - edgeNeglectDist ||
          y > height - edgeNeglectDist
        ) {
          modifiedPixels[i] = 0;
          modifiedPixels[i + 1] = 0;
          modifiedPixels[i + 2] = 0;
          continue;
        }

        let gx = 0;
        let gy = 0;
        let x_k = -1;
        let y_k = -1;
        for (let k = 0; k < kernelX.length; k++) {
          const pixelVal = pixelAt(x + x_k, y + y_k);
          gx += kernelX[k] * pixelVal;
          gy += kernelY[k] * pixelVal;
          if (++x_k > 1) {
            x_k = -1;
            y_k++;
          }
        }

        const gradientMagnitude = Math.sqrt(gx * gx + gy * gy);
        // const gradientDirection = (Math.atan(gy / gx) * 180) / Math.PI;

        // if (gradientMagnitude <= 22.5 || gradientMagnitude > 157.5) {

        // }

        const threshold = 1442 * 0.5;
        // const threshold = 1442 * 0.25;
        if (gradientMagnitude > threshold) {
          modifiedPixels[i] = 255;
          modifiedPixels[i + 1] = 255;
          modifiedPixels[i + 2] = 255;
          edgePoints.push(new Point(x, y));
        } else {
          modifiedPixels[i] = 0;
          modifiedPixels[i + 1] = 0;
          modifiedPixels[i + 2] = 0;
        }
      }
    }

    return edgePoints;
  }

  filterToColorNeighborEdges(edgePixels: Point[], canvas: HTMLCanvasElement) {
    const searchDist = 1;
    const threshold = 2;

    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    const filteredPixels: Point[] = [];

    function hueAt(x: number, y: number) {
      const i = y * (canvas.width * 4) + x * 4;
      return convert.rgb.hsl.raw([pixels[i], pixels[i + 1], pixels[i + 2]])[0];
    }

    function lightAt(x: number, y: number) {
      const i = y * (canvas.width * 4) + x * 4;
      return convert.rgb.hsl.raw([pixels[i], pixels[i + 1], pixels[i + 2]])[2];
    }

    function saturationAt(x: number, y: number) {
      const i = y * (canvas.width * 4) + x * 4;
      return convert.rgb.hsl.raw([pixels[i], pixels[i + 1], pixels[i + 2]])[1];
    }

    edgePixels.forEach((pixel) => {
      let colorCount = 0;
      for (let y = pixel.y - searchDist; y < pixel.y + searchDist; y++) {
        for (let x = pixel.x - searchDist; x < pixel.x + searchDist; x++) {
          const hue = hueAt(x, y);
          const sat = saturationAt(x, y);
          const light = lightAt(x, y);
          if (hue <= 270 && hue >= 200 && light <= 85 && sat >= 0) {
            colorCount++;
            if (colorCount >= threshold) {
              filteredPixels.push(pixel);
              break;
            }
          }
        }
        if (colorCount >= threshold) {
          break;
        }
      }
    });

    return filteredPixels;
  }

  // This was an enourmous help: https://imagej.nih.gov/ij/plugins/download/Hough_Circles.java
  circularHoughTransform(
    edgePixels: Point[],
    avgVotes: number,
    canvas: HTMLCanvasElement
  ): [DetectCircle[], number] {
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "rgba(0, 255, 0, 0.01)";
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    const radiusStep = 1;
    const minRadius = 10;
    const maxRadius = 30;
    const depth = Math.floor((maxRadius - minRadius) / radiusStep) + 1;

    // [vote_p0_0...vote_p0_depth, vote_p1_0...vote_p1_depth, ...]
    const acc: Uint32Array = new Uint32Array((pixels.length / 4) * depth);

    const circles: Array<DetectCircle> = [];
    const acceptableVoteThreshold = 5;

    let maxVotes = -1;
    let bestX = 0;
    let bestY = 0;
    let bestR = 0;
    for (let k = 0; k < edgePixels.length; k++) {
      const pixel = edgePixels[k];
      const x = pixel.x;
      const y = pixel.y;
      for (let r = 0; r < depth; r++) {
        const radius = r * radiusStep + minRadius;
        for (let degrees = 0; degrees < 360; degrees += 5) {
          const a = Math.round(x + radius * approxCos(degrees));
          const b = Math.round(y + radius * approxSin(degrees));
          const i = b * (canvas.width * depth) + a * depth + r;
          if (i >= 0 && i < acc.length) {
            const votes = ++acc[i];
            if (votes > maxVotes) {
              maxVotes = votes;
              bestX = a;
              bestY = b;
              bestR = radius;
            }
            if (votes > acceptableVoteThreshold) {
              let circle =
                circles.find((circle) => circle.x == a && circle.y == b) ||
                new DetectCircle(new Point(a, b), radius, votes);
              circle.radius = radius;
              circle.votes = votes;
              circles.push(circle);
            }
          }
        }
      }
    }

    let top10avgVote: number = 25;
    circles.sort((a, b) => b.votes - a.votes);

    return [circles, top10avgVote];
  }

  findCornerIndicators(circle: DetectCircle, imageData: ImageData) {
    const indicatorBlobs: DetectionBlob[] = [];
    const box = circle.box();
    const blobMaxRange = 1;

    const pixels = imageData.data;

    function hueAt(x: number, y: number) {
      const i = y * (imageData.width * 4) + x * 4;
      return convert.rgb.hsl.raw([pixels[i], pixels[i + 1], pixels[i + 2]])[0];
    }
    function lightAt(x: number, y: number) {
      const i = y * (imageData.width * 4) + x * 4;
      return convert.rgb.hsl.raw([pixels[i], pixels[i + 1], pixels[i + 2]])[2];
    }

    for (let y = box.y; y < box.y + box.height; y++) {
      for (let x = box.x; x < box.x + box.height; x++) {
        const point = new Point(x, y);
        if (circle.isIn(point)) {
          const hue = hueAt(x, y);
          const light = lightAt(x, y);
          if (hue >= 70 && hue <= 150 && light < 70) {
            if (indicatorBlobs.length == 0) {
              indicatorBlobs.push(new DetectionBlob(point, blobMaxRange));
            } else {
              let foundBlob = false;
              for (let i = 0; i < indicatorBlobs.length; i++) {
                const blob = indicatorBlobs[i];
                if (blob.isCloseEnough(point)) {
                  blob.add(point);
                  foundBlob = true;
                  break;
                }
              }
              if (!foundBlob) {
                indicatorBlobs.push(new DetectionBlob(point, blobMaxRange));
              }
            }
          }
        }
      }
    }

    return indicatorBlobs;
  }
}

export class Camera3 extends HtmlElem {
  preferredResolutionWidth = 1920;
  preferredResolutionHeight = 1080;
  // preferredResolutionWidth = 352;
  // preferredResolutionHeight = 240;

  get elem(): HTMLVideoElement {
    return document.querySelector("#camera");
  }

  private addOverlays() {
    const elem = this.elem;
    const videoWidth = elem.videoWidth;
    const videoHeight = elem.videoHeight;
    const cameraOverlay = new CameraOverlay();
    const cameraEnvOverlay = new CameraEnvironmentChangeOverlay();
    const cameraScreenColorsOverlay = new CameraScreenColorsOverlay();
    cameraOverlay.width = videoWidth;
    cameraEnvOverlay.width = videoWidth;
    cameraScreenColorsOverlay.width = videoWidth;
    cameraOverlay.height = videoHeight;
    cameraEnvOverlay.height = videoHeight;
    cameraScreenColorsOverlay.height = videoHeight;
  }

  async start(): Promise<void> {
    const video = this.elem;

    if (navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { max: this.preferredResolutionWidth },
            height: { max: this.preferredResolutionHeight },
          },
        });
        video.srcObject = stream;
        return new Promise((resolve, _) => {
          video.oncanplay = () => {
            this.addOverlays();
            resolve();
          };
        });
      } catch (e) {
        return new Promise((_, rej) => rej(e));
      }
    } else {
      return new Promise((_, rej) => rej("Could not get user media..."));
    }
  }

  snap(scale?: number): HTMLCanvasElement {
    scale = scale || 1;
    const elem = this.elem;
    const videoWidth = elem.videoWidth * scale;
    const videoHeight = elem.videoHeight * scale;
    const canvas = createCanvas(videoWidth, videoHeight);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(elem, 0, 0, videoWidth, videoHeight);
    return canvas;
  }

  differenceBnW(grayScaleData1: ImageData, grayScaleData2: ImageData): Point[] {
    const pixels1 = grayScaleData1.data;
    const pixels2 = grayScaleData2.data;

    const diffPixels: Point[] = [];

    for (let y = 0; y < grayScaleData1.height; y++) {
      for (let x = 0; x < grayScaleData1.width; x++) {
        const i = y * (grayScaleData1.width * 4) + x * 4;
        const diff = Math.abs(pixels2[i] - pixels1[i]);
        if (diff >= 75) {
          diffPixels.push(new Point(x, y));
        }
      }
    }

    return diffPixels;
  }

  whiteBalance(imageData: ImageData) {
    const pixels = imageData.data;

    let avgR = 0;
    let avgG = 0;
    let avgB = 0;
    let pixelAmt = pixels.length / 4;
    for (let i = 0; i < pixels.length; i += 4) {
      avgR += pixels[i];
      avgG += pixels[i + 1];
      avgB += pixels[i + 2];
    }
    avgR /= pixelAmt;
    avgG /= pixelAmt;
    avgB /= pixelAmt;
    const gray = avgR + avgG + avgB;
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] *= gray / avgR;
      pixels[i + 1] *= gray / avgG;
      pixels[i + 2] *= gray / avgB;
    }
  }

  onlyNearWhiteColors(imageData: ImageData) {
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const hsl = convert.rgb.hsl.raw([data[i], data[i + 1], data[i + 2]]);
      if (hsl[2] < 75) {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
      }
    }
  }

  applyBigGaussianBlurAndGrayScale(imageData: ImageData) {
    const modifiedPixels = imageData.data;
    const originalPixels = new Uint8ClampedArray(imageData.data);
    const width = imageData.width;
    const height = imageData.height;

    const div = 159;
    const kernel: Float32Array = new Float32Array([
      2 / div,
      4 / div,
      5 / div,
      4 / div,
      2 / div,
      4 / div,
      9 / div,
      12 / div,
      9 / div,
      4 / div,
      5 / div,
      12 / div,
      15 / div,
      12 / div,
      5 / div,
      4 / div,
      9 / div,
      12 / div,
      9 / div,
      4 / div,
      2 / div,
      4 / div,
      5 / div,
      4 / div,
      2 / div,
    ]);

    function redAt(x: number, y: number) {
      const i = y * (width * 4) + x * 4;
      if (i < 0 || i >= modifiedPixels.length) {
        return 0;
      }
      return originalPixels[i];
    }

    function greenAt(x: number, y: number) {
      const i = y * (width * 4) + x * 4;
      if (i < 0 || i >= modifiedPixels.length) {
        return 0;
      }
      return originalPixels[i + 1];
    }

    function blueAt(x: number, y: number) {
      const i = y * (width * 4) + x * 4;
      if (i < 0 || i >= modifiedPixels.length) {
        return 0;
      }
      return originalPixels[i + 2];
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0;
        let g = 0;
        let b = 0;
        let x_k = -2;
        let y_k = -2;
        for (let k = 0; k < kernel.length; k++) {
          r += kernel[k] * redAt(x + x_k, y + y_k);
          g += kernel[k] * greenAt(x + x_k, y + y_k);
          b += kernel[k] * blueAt(x + x_k, y + y_k);
          if (++x_k > 2) {
            x_k = -2;
            y_k++;
          }
        }
        const i = y * (width * 4) + x * 4;
        const gray = (r + g + b) / 3;
        // const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        modifiedPixels[i] = gray;
        modifiedPixels[i + 1] = gray;
        modifiedPixels[i + 2] = gray;
      }
    }
  }

  applyBigGaussianBlur(imageData: ImageData) {
    const modifiedPixels = imageData.data;
    const originalPixels = new Uint8ClampedArray(imageData.data);
    const width = imageData.width;
    const height = imageData.height;

    const div = 159;
    const kernel: Float32Array = new Float32Array([
      2 / div,
      4 / div,
      5 / div,
      4 / div,
      2 / div,
      4 / div,
      9 / div,
      12 / div,
      9 / div,
      4 / div,
      5 / div,
      12 / div,
      15 / div,
      12 / div,
      5 / div,
      4 / div,
      9 / div,
      12 / div,
      9 / div,
      4 / div,
      2 / div,
      4 / div,
      5 / div,
      4 / div,
      2 / div,
    ]);

    function redAt(x: number, y: number) {
      const i = y * (width * 4) + x * 4;
      if (i < 0 || i >= modifiedPixels.length) {
        return 0;
      }
      return originalPixels[i];
    }

    function greenAt(x: number, y: number) {
      const i = y * (width * 4) + x * 4;
      if (i < 0 || i >= modifiedPixels.length) {
        return 0;
      }
      return originalPixels[i + 1];
    }

    function blueAt(x: number, y: number) {
      const i = y * (width * 4) + x * 4;
      if (i < 0 || i >= modifiedPixels.length) {
        return 0;
      }
      return originalPixels[i + 2];
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0;
        let g = 0;
        let b = 0;
        let x_k = -2;
        let y_k = -2;
        for (let k = 0; k < kernel.length; k++) {
          r += kernel[k] * redAt(x + x_k, y + y_k);
          g += kernel[k] * greenAt(x + x_k, y + y_k);
          b += kernel[k] * blueAt(x + x_k, y + y_k);
          if (++x_k > 2) {
            x_k = -2;
            y_k++;
          }
        }
        const i = y * (width * 4) + x * 4;
        modifiedPixels[i] = r;
        modifiedPixels[i + 1] = g;
        modifiedPixels[i + 2] = b;
      }
    }
  }

  applySharpen(imageData: ImageData) {
    const modifiedPixels = imageData.data;
    const originalPixels = new Uint8ClampedArray(imageData.data);
    const width = imageData.width;
    const height = imageData.height;

    const kernel: Int8Array = new Int8Array([0, -1, 0, -1, 5, -1, 0, -1, 0]);

    function redAt(x: number, y: number) {
      const i = y * (width * 4) + x * 4;
      return originalPixels[i];
    }

    function greenAt(x: number, y: number) {
      const i = y * (width * 4) + x * 4;
      return originalPixels[i + 1];
    }

    function blueAt(x: number, y: number) {
      const i = y * (width * 4) + x * 4;
      return originalPixels[i + 2];
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0;
        let g = 0;
        let b = 0;
        let x_k = -1;
        let y_k = -1;
        for (let k = 0; k < kernel.length; k++) {
          r += kernel[k] * redAt(x + x_k, y + y_k);
          g += kernel[k] * greenAt(x + x_k, y + y_k);
          b += kernel[k] * blueAt(x + x_k, y + y_k);
          if (++x_k > 1) {
            x_k = -1;
            y_k++;
          }
        }
        const i = y * (width * 4) + x * 4;
        modifiedPixels[i] = r < 0 ? 0 : r > 255 ? 255 : r;
        modifiedPixels[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
        modifiedPixels[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
      }
    }
  }

  toGrayScale(imageData: ImageData) {
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      // const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      data[i] = gray; // red
      data[i + 1] = gray; // green
      data[i + 2] = gray; // blue
    }
  }

  findBlobs(imageData: ImageData) {
    const pixels = imageData.data;

    let detectionBlobs: DetectionBlob[] = [];

    for (let y = 0; y < imageData.height; y++) {
      for (let x = 0; x < imageData.width; x++) {
        const i = y * (imageData.width * 4) + x * 4;
        const [hue, sat, light] = convert.rgb.hsl([
          pixels[i],
          pixels[i + 1],
          pixels[i + 2],
        ]);
        if (hue > 30 && hue <= 70 && light <= 75 && light >= 10) {
          const point = new Point(x, y);
          const blob =
            detectionBlobs.find((blob) => blob.isIn(point)) ||
            detectionBlobs.find((blob) => blob.isCloseEnough(point));
          if (blob) {
            blob.add(point);
          } else {
            detectionBlobs.push(new DetectionBlob(point, 20));
          }
        }
      }
    }

    detectionBlobs = detectionBlobs.filter(
      (b) => b.area > imageData.height * imageData.width * 0.005
    );

    return detectionBlobs;
  }

  findCenterBlob(blobs: DetectionBlob[], imageData: ImageData) {
    const pixels = imageData.data;

    let centerBlobs: DetectionBlob[] = [];

    for (let b = 0; b < blobs.length; b++) {
      const blob = blobs[b];
      for (let y = blob.topLeft.y; y < blob.bottomLeft.y; y++) {
        for (let x = blob.topLeft.x; x < blob.topRight.x; x++) {
          const i = y * (imageData.width * 4) + x * 4;
          const [hue, sat, light] = convert.rgb.hsl([
            pixels[i],
            pixels[i + 1],
            pixels[i + 2],
          ]);
          if (hue >= 50 && hue <= 70 && light <= 75 && light >= 10) {
            const point = new Point(x, y);
            const blob =
              centerBlobs.find((blob) => blob.isIn(point)) ||
              centerBlobs.find((blob) => blob.isCloseEnough(point));
            if (blob) {
              blob.add(point);
            } else {
              centerBlobs.push(new DetectionBlob(point, 10));
            }
          }
        }
      }
    }

    // centerBlobs = centerBlobs.filter(
    //   (b) => b.area > imageData.height * imageData.width * 0.001
    // );

    return centerBlobs;
  }

  findBlobsInPoints(points: Point[]) {
    const blobs: DetectionBlob[] = [];
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const blob = blobs.find((blob) => blob.isCloseEnough(point));
      if (blob) {
        blob.add(point);
      } else {
        blobs.push(new DetectionBlob(point, 2));
      }
    }
    return blobs;
  }

  findBlobsInPointsSweepLine(points: Point[]) {
    if (points.length == 0) return [];
    if (points.length == 1) return [new DetectionBlob(points[0], 0)];

    points = points.sort((b, a) => b.x - a.x);
    const maxXDistSq = 50 * 50;
    const blobThreshold = 7;
    const blobs: DetectionBlob[] = [
      new DetectionBlob(points[0], blobThreshold),
    ];

    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      let foundExistingBlob = false;
      for (let j = blobs.length - 1; j >= 0; j--) {
        const blob = blobs[j];
        // if (blob.shortestDistanceSqTo(point) > maxXDistSq) {
        //   break;
        // } else
        if (blob.isCloseEnough(point)) {
          blob.add(point);
          foundExistingBlob = true;
        }
      }
      if (!foundExistingBlob) {
        blobs.push(new DetectionBlob(point, blobThreshold));
      }
    }

    return blobs;
  }

  findBlobsInPoints2(points: Point[]) {
    if (points.length == 0) return [];
    const blobs: DetectionBlob[] = [];
    let totalPointsBlobbed = 0;

    function findNotBlobbedPoint() {
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        let foundBlob = false;
        for (let b = 0; b < blobs.length; b++) {
          const blob = blobs[b];
          if (blob.isIn(point)) {
            foundBlob = true;
            break;
          }
        }
        if (!foundBlob) return point;
      }
      console.log("shit");
    }

    while (totalPointsBlobbed != points.length) {
      const blob = new DetectionBlob(findNotBlobbedPoint(), 2);
      totalPointsBlobbed++;
      points.forEach((point) => {
        if (blob.isIn(point)) {
          blob.add(point);
          totalPointsBlobbed++;
        }
      });
    }

    return blobs;
  }

  // Altered version from: https://github.com/miguelmota/sobel
  applySobelEdgeFilter(imageData: ImageData) {
    const modifiedPixels = imageData.data;
    const originalPixels = new Uint8ClampedArray(imageData.data);
    const width = imageData.width;
    const height = imageData.height;

    const kernelX = new Int8Array([-1, 0, 1, -2, 0, 2, -1, 0, 1]);
    const kernelY = new Int8Array([-1, -2, -1, 0, 0, 0, 1, 2, 1]);

    const edgePoints: Point[] = [];

    function pixelAt(x: number, y: number) {
      const i = y * (width * 4) + x * 4;
      return originalPixels[i];
    }

    const edgeNeglectDist = 10;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * (width * 4) + x * 4;
        if (
          x - edgeNeglectDist < 0 ||
          y - edgeNeglectDist < 0 ||
          x > width - edgeNeglectDist ||
          y > height - edgeNeglectDist
        ) {
          modifiedPixels[i] = 0;
          modifiedPixels[i + 1] = 0;
          modifiedPixels[i + 2] = 0;
          continue;
        }

        let gx = 0;
        let gy = 0;
        let x_k = -1;
        let y_k = -1;
        for (let k = 0; k < kernelX.length; k++) {
          const pixelVal = pixelAt(x + x_k, y + y_k);
          gx += kernelX[k] * pixelVal;
          gy += kernelY[k] * pixelVal;
          if (++x_k > 1) {
            x_k = -1;
            y_k++;
          }
        }

        const gradientMagnitude = Math.sqrt(gx * gx + gy * gy);
        // const gradientDirection = (Math.atan(gy / gx) * 180) / Math.PI;

        // if (gradientMagnitude <= 22.5 || gradientMagnitude > 157.5) {

        // }

        // const threshold = 1442 * 0.5;
        const threshold = 1442 * 0.35;
        if (gradientMagnitude > threshold) {
          modifiedPixels[i] = 255;
          modifiedPixels[i + 1] = 255;
          modifiedPixels[i + 2] = 255;
          edgePoints.push(new Point(x, y));
        } else {
          modifiedPixels[i] = 0;
          modifiedPixels[i + 1] = 0;
          modifiedPixels[i + 2] = 0;
        }
      }
    }

    return edgePoints;
  }

  filterToColorNeighborEdges(edgePixels: Point[], canvas: HTMLCanvasElement) {
    const searchDist = 1;
    const threshold = 2;

    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    const filteredPixels: Point[] = [];

    function hueAt(x: number, y: number) {
      const i = y * (canvas.width * 4) + x * 4;
      return convert.rgb.hsl.raw([pixels[i], pixels[i + 1], pixels[i + 2]])[0];
    }

    function lightAt(x: number, y: number) {
      const i = y * (canvas.width * 4) + x * 4;
      return convert.rgb.hsl.raw([pixels[i], pixels[i + 1], pixels[i + 2]])[2];
    }

    function saturationAt(x: number, y: number) {
      const i = y * (canvas.width * 4) + x * 4;
      return convert.rgb.hsl.raw([pixels[i], pixels[i + 1], pixels[i + 2]])[1];
    }

    edgePixels.forEach((pixel) => {
      let colorCount = 0;
      for (let y = pixel.y - searchDist; y < pixel.y + searchDist; y++) {
        for (let x = pixel.x - searchDist; x < pixel.x + searchDist; x++) {
          const hue = hueAt(x, y);
          const sat = saturationAt(x, y);
          const light = lightAt(x, y);
          if (hue <= 280 && hue >= 180) {
            colorCount++;
            if (colorCount >= threshold) {
              filteredPixels.push(pixel);
              break;
            }
          }
        }
        if (colorCount >= threshold) {
          break;
        }
      }
    });

    return filteredPixels;
  }

  filterToBlobs(
    edgePixels: Point[],
    blobs: DetectionBlob[],
    nopeBlobs: DetectionBlob[]
  ) {
    const filteredPixels: Point[] = [];
    for (let i = 0; i < edgePixels.length; i++) {
      const pixel = edgePixels[i];
      const blob = blobs.find((blob) => blob.isIn(pixel));
      if (blob && !nopeBlobs.find((b) => b.isIn(pixel))) {
        filteredPixels.push(pixel);
      }
    }
    return filteredPixels;
  }

  // This was an enourmous help: https://imagej.nih.gov/ij/plugins/download/Hough_Circles.java
  circularHoughTransform(
    edgePixels: Point[],
    canvas: HTMLCanvasElement
  ): DetectCircle[] {
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "rgba(0, 255, 0, 0.01)";
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    const radiusStep = 1;
    const minRadius = 6;
    const maxRadius = 15;
    const depth = Math.floor((maxRadius - minRadius) / radiusStep) + 1;

    // [vote_p0_0...vote_p0_depth, vote_p1_0...vote_p1_depth, ...]
    const acc: Uint32Array = new Uint32Array((pixels.length / 4) * depth);

    const circles: Array<DetectCircle> = [];
    const acceptableVoteThreshold = 5;

    for (let k = 0; k < edgePixels.length; k++) {
      const pixel = edgePixels[k];
      const x = pixel.x;
      const y = pixel.y;
      for (let r = 0; r < depth; r++) {
        const radius = r * radiusStep + minRadius;
        for (let degrees = 0; degrees < 360; degrees += 5) {
          const a = Math.round(x + radius * approxCos(degrees));
          const b = Math.round(y + radius * approxSin(degrees));
          const i = b * (canvas.width * depth) + a * depth + r;
          if (i >= 0 && i < acc.length) {
            const votes = ++acc[i];
            if (votes > acceptableVoteThreshold) {
              let circle =
                circles.find((circle) => circle.x == a && circle.y == b) ||
                new DetectCircle(new Point(a, b), radius, votes);
              circle.radius = radius;
              circle.votes = votes;
              circles.push(circle);
            }
          }
        }
      }
    }

    circles.sort((a, b) => b.votes - a.votes);

    return circles;
  }

  findCornerIndicators(circle: DetectCircle, imageData: ImageData) {
    const indicatorBlobs: DetectionBlob[] = [];
    const box = circle.box();
    const blobMaxRange = 1;

    const pixels = imageData.data;

    function hueAt(x: number, y: number) {
      const i = y * (imageData.width * 4) + x * 4;
      return convert.rgb.hsl.raw([pixels[i], pixels[i + 1], pixels[i + 2]])[0];
    }
    function lightAt(x: number, y: number) {
      const i = y * (imageData.width * 4) + x * 4;
      return convert.rgb.hsl.raw([pixels[i], pixels[i + 1], pixels[i + 2]])[2];
    }

    for (let y = box.y; y < box.y + box.height; y++) {
      for (let x = box.x; x < box.x + box.height; x++) {
        const point = new Point(x, y);
        if (circle.isIn(point)) {
          const hue = hueAt(x, y);
          const light = lightAt(x, y);
          if (hue >= 70 && hue <= 150 && light < 70) {
            if (indicatorBlobs.length == 0) {
              indicatorBlobs.push(new DetectionBlob(point, blobMaxRange));
            } else {
              let foundBlob = false;
              for (let i = 0; i < indicatorBlobs.length; i++) {
                const blob = indicatorBlobs[i];
                if (blob.isCloseEnough(point)) {
                  blob.add(point);
                  foundBlob = true;
                  break;
                }
              }
              if (!foundBlob) {
                indicatorBlobs.push(new DetectionBlob(point, blobMaxRange));
              }
            }
          }
        }
      }
    }

    return indicatorBlobs;
  }

  detectMotion(prevFrameData: ImageData, currFrameData: ImageData) {
    const prevPixels = prevFrameData.data;
    const currPixels = currFrameData.data;

    const motionPixels: Point[] = [];

    for (let y = 0; y < currFrameData.height; y++) {
      for (let x = 0; x < currFrameData.width; x++) {
        const i = y * (currFrameData.width * 4) + x * 4;
        const maxDiff = 50;
        const rDiff = Math.abs(currPixels[i] - prevPixels[i]);
        const gDiff = Math.abs(currPixels[i + 1] - prevPixels[i + 1]);
        const bDiff = Math.abs(currPixels[i + 2] - prevPixels[i + 2]);
        if (rDiff > maxDiff || gDiff > maxDiff || bDiff > maxDiff) {
          motionPixels.push(new Point(x, y));
        }
      }
    }
    return motionPixels;
  }

  detectLightChange(prevFrameData: ImageData, currFrameData: ImageData) {
    const prevPixels = prevFrameData.data;
    const currPixels = currFrameData.data;

    const pixels: Point[] = [];

    for (let y = 0; y < currFrameData.height; y++) {
      for (let x = 0; x < currFrameData.width; x++) {
        const i = y * (currFrameData.width * 4) + x * 4;
        const prevHsl = convert.rgb.hsl.raw([
          prevPixels[i],
          prevPixels[i + 1],
          prevPixels[i + 2],
        ]);
        const currHsl = convert.rgb.hsl.raw([
          currPixels[i],
          currPixels[i + 1],
          currPixels[i + 2],
        ]);
        const maxDiff = 7;
        if (Math.abs(currHsl[2] - prevHsl[2]) > maxDiff) {
          pixels.push(new Point(x, y));
        }
      }
    }
    return pixels;
  }

  detectSaturationChange(prevFrameData: ImageData, currFrameData: ImageData) {
    const prevPixels = prevFrameData.data;
    const currPixels = currFrameData.data;

    const pixels: Point[] = [];

    for (let y = 0; y < currFrameData.height; y++) {
      for (let x = 0; x < currFrameData.width; x++) {
        const i = y * (currFrameData.width * 4) + x * 4;
        const prevHsl = convert.rgb.hsl.raw([
          prevPixels[i],
          prevPixels[i + 1],
          prevPixels[i + 2],
        ]);
        const currHsl = convert.rgb.hsl.raw([
          currPixels[i],
          currPixels[i + 1],
          currPixels[i + 2],
        ]);
        const maxDiff = 75;
        if (Math.abs(currHsl[1] - prevHsl[1]) > maxDiff) {
          pixels.push(new Point(x, y));
        }
      }
    }
    return pixels;
  }

  detectBigColorDifferences(
    prevFrameData: ImageData,
    currFrameData: ImageData
  ) {
    const prevPixels = prevFrameData.data;
    const currPixels = currFrameData.data;

    const pixels: Point[] = [];

    let totalChange = 0;

    for (let y = 0; y < currFrameData.height; y++) {
      for (let x = 0; x < currFrameData.width; x++) {
        const i = y * (currFrameData.width * 4) + x * 4;
        const prevLab = convert.rgb.lab([
          prevPixels[i],
          prevPixels[i + 1],
          prevPixels[i + 2],
        ]);
        const currLab = convert.rgb.lab([
          currPixels[i],
          currPixels[i + 1],
          currPixels[i + 2],
        ]);
        const maxDiff = 40;
        const diff = deltaE.getDeltaE00(
          {
            L: prevLab[0],
            A: prevLab[1],
            B: prevLab[2],
          },
          {
            L: currLab[0],
            A: currLab[1],
            B: currLab[2],
          }
        );
        if (diff > maxDiff) {
          pixels.push(new Point(x, y));
        }
        totalChange += diff;
      }
    }
    console.log("Avg color dist: " + totalChange / (prevPixels.length / 4));
    return pixels;
  }

  pointsToImgData(points: Point[], width: number, height: number) {
    const imgData = new ImageData(width, height);
    const pixels = imgData.data;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const j = p.y * (width * 4) + p.x * 4;
      pixels[j] = 255;
      pixels[j + 1] = 255;
      pixels[j + 1] = 255;
    }
    return imgData;
  }

  maartensRareAlgoritme(
    prevFrameData: ImageData,
    currFrameData: ImageData,
    arrayToPushTo: Point[]
  ) {
    const prevPixels = prevFrameData.data;
    const currPixels = currFrameData.data;
    const prevGrayData = new ImageData(
      prevFrameData.width,
      prevFrameData.height
    );
    prevGrayData.data.set(prevPixels);
    this.toGrayScale(prevGrayData);
    const prevGrayPixels = prevGrayData.data;
    const currGrayData = new ImageData(
      currFrameData.width,
      currFrameData.height
    );

    currGrayData.data.set(currPixels);
    this.toGrayScale(currGrayData);
    const currGrayPixels = currGrayData.data;

    const pixels: Point[] = [];

    for (let i = 0; i < currPixels.length; i += 4) {
      const maxRgbDiff = 50;
      const rDiff = Math.abs(currPixels[i] - prevPixels[i]);
      const gDiff = Math.abs(currPixels[i + 1] - prevPixels[i + 1]);
      const bDiff = Math.abs(currPixels[i + 2] - prevPixels[i + 2]);

      const bnwDiff = Math.abs(currGrayPixels[i] - prevGrayPixels[i]);

      const currHsl = convert.rgb.hsl([
        currPixels[i],
        currPixels[i + 1],
        currPixels[i + 2],
      ]);
      const isCorrectColor =
        currHsl[0] >= 180 &&
        currHsl[0] <= 260 &&
        currHsl[2] >= 30 &&
        currHsl[2] <= 70;

      if (
        (bnwDiff >= 75 ||
          rDiff > maxRgbDiff ||
          gDiff > maxRgbDiff ||
          bDiff > maxRgbDiff) &&
        isCorrectColor
      ) {
        const x = (i / 4) % currFrameData.width;
        const y = Math.floor(i / 4 / currFrameData.width);
        pixels.push(new Point(x, y));
        arrayToPushTo.push(new Point(x, y));
      }
    }

    return pixels;
  }

  filter8Neighbors(
    pixelsToFilter: Point[],
    imgData: ImageData,
    threshold: number
  ) {
    const pixels = imgData.data;

    const filteredPoints: Point[] = [];

    for (let p = 0; p < pixelsToFilter.length; p++) {
      const point = pixelsToFilter[p];
      let neighborCount = 0;
      const leftIndex = point.y * (imgData.width * 4) + (point.x - 1) * 4;
      const topLeftIndex =
        (point.y - 1) * (imgData.width * 4) + (point.x - 1) * 4;
      const topIndex = (point.y - 1) * (imgData.width * 4) + point.x * 4;
      const topRightIndex =
        (point.y - 1) * (imgData.width * 4) + (point.x + 1) * 4;
      const rightIndex = point.y * (imgData.width * 4) + (point.x + 1) * 4;
      const bottomRightIndex =
        (point.y + 1) * (imgData.width * 4) + (point.x + 1) * 4;
      const bottomIndex = (point.y + 1) * (imgData.width * 4) + point.x * 4;
      const bottomLeftIndex =
        (point.y + 1) * (imgData.width * 4) + (point.x - 1) * 4;
      if (pixels[leftIndex] == 255) neighborCount++;
      if (pixels[topLeftIndex] == 255) neighborCount++;
      if (pixels[topIndex] == 255) neighborCount++;
      if (pixels[topRightIndex] == 255) neighborCount++;
      if (pixels[rightIndex] == 255) neighborCount++;
      if (pixels[bottomRightIndex] == 255) neighborCount++;
      if (pixels[bottomIndex] == 255) neighborCount++;
      if (pixels[bottomLeftIndex] == 255) neighborCount++;

      if (neighborCount >= threshold) {
        filteredPoints.push(point);
      }
    }

    return filteredPoints;
  }

  filterPointsToColor(
    points: Point[],
    rgb: [number, number, number],
    imgData: ImageData
  ) {
    const pixels = imgData.data;
    const labColor = convert.rgb.lab(rgb);

    const filteredPoints: Point[] = [];
    for (let p = 0; p < points.length; p++) {
      const point = points[p];
      const i = point.y * (imgData.width * 4) + point.x * 4;
      const pixelLabColor = convert.rgb.lab([
        pixels[i],
        pixels[i + 1],
        pixels[i + 2],
      ]);
      const maxDiff = 40;
      const diff = deltaE.getDeltaE00(
        {
          L: labColor[0],
          A: labColor[1],
          B: labColor[2],
        },
        {
          L: pixelLabColor[0],
          A: pixelLabColor[1],
          B: pixelLabColor[2],
        }
      );
      if (diff > maxDiff) {
        filteredPoints.push(point);
      }
    }

    return filteredPoints;
  }

  filterToAreas(edgePoints: Point[]): Array<Point[]> {
    if (edgePoints.length == 0) return [];

    const sweepWidth = 1;

    const xSortedPoints = edgePoints.sort((a, b) => a.x - b.x);
    const xAreas: Array<Point[]> = [[xSortedPoints[0]]];
    for (let i = 1; i < xSortedPoints.length; i++) {
      const point = xSortedPoints[i];
      const lastArea = xAreas[xAreas.length - 1];
      const lastPointInArea = lastArea[lastArea.length - 1];
      if (point.x - lastPointInArea.x <= sweepWidth) {
        lastArea.push(point);
      } else {
        xAreas.push([point]);
      }
    }

    const areas: Array<Point[]> = [];
    for (let i = 0; i < xAreas.length; i++) {
      const sortedYInArea = xAreas[i].sort((a, b) => a.y - b.y);
      for (let j = 0; j < sortedYInArea.length; j++) {
        const point = sortedYInArea[j];
        if (j == 0) {
          areas.push([point]);
          continue;
        }
        const lastArea = areas[areas.length - 1];
        const lastPointInArea = lastArea[lastArea.length - 1];
        if (point.y - lastPointInArea.y <= sweepWidth) {
          lastArea.push(point);
        } else {
          areas.push([point]);
        }
      }
    }

    return areas;
  }

  filterMotionToBlobs(motionPixels: Point[], blobs: DetectionBlob[]) {
    const filteredPixels: Point[] = [];
    motionPixels.forEach((pixel) => {
      if (blobs.find((b) => b.isIn(pixel))) {
        filteredPixels.push(pixel);
      }
    });
    return filteredPixels;
  }
}
