import { Camera } from "./jsHtml/master/camera/camera";
import Point from "./Point";
import {
  getHSLColorForPixel,
  isSimilarHSLColor,
  IHSLRange,
  IHSLColor,
  rgbToHsl,
  hslToRgb,
} from "./GEEN_PYTHON";
import * as convert from "color-convert";
import { ColorCombinerBlob } from "./ColorCombinerBlob";
import { closestSimpleColor } from "../ISCC_NBS_color_dict";
import { DetectionBlob } from "./DetectionBlob";

export class ScreenDetector {
  previousFrame: HTMLCanvasElement;
  static detectionColor1: IHSLColor = rgbToHsl(0, 0, 127.5);
  static detectionColor2: IHSLColor = rgbToHsl(127.5, 0, 0);
  static orientationColor: IHSLColor = rgbToHsl(255, 150, 0);

  detect(
    camera: Camera,
    envColorRange: IHSLRange,
    screenColorRange1: IHSLRange,
    blobPixelMaxRange: number
  ): {
    detectionBlobs: DetectionBlob[];
    changedPixels: Point[];
    pixelsWithScreenColors: Point[];
  } {
    if (!this.previousFrame) {
      this.previousFrame = camera.snap();
      return {
        detectionBlobs: [],
        changedPixels: [],
        pixelsWithScreenColors: [],
      };
    }

    const previousFrameCtx = this.previousFrame.getContext("2d");
    const previousFramePixelData = previousFrameCtx.getImageData(
        0,
        0,
        this.previousFrame.width,
        this.previousFrame.height
      ),
      previousFramePixels = previousFramePixelData.data;

    const newFrame = camera.snap();
    const newFrameCtx = newFrame.getContext("2d");
    const newFramePixelData = newFrameCtx.getImageData(
        0,
        0,
        newFrame.width,
        newFrame.height
      ),
      newFramePixels = newFramePixelData.data;

    let detectionBlobs: DetectionBlob[] = [];
    // Pixels that are of similar color to the wanted screen.
    const screenColorPixels: Point[] = [];
    // Pixels that changed between this and the previous frame.
    const envChangePixels: Point[] = [];

    for (let y = 0; y < newFrame.height; y++) {
      for (let x = 0; x < newFrame.width; x++) {
        const prevFrameColor = getHSLColorForPixel(
          x,
          y,
          this.previousFrame.width,
          previousFramePixels
        );
        const newFrameColor = getHSLColorForPixel(
          x,
          y,
          newFrame.width,
          newFramePixels
        );
        const newFrameColorIsSimilarFromPrevFrame = isSimilarHSLColor(
          newFrameColor,
          prevFrameColor,
          envColorRange
        );
        const newFrameIsColor1 = isSimilarHSLColor(
          newFrameColor,
          ScreenDetector.detectionColor1,
          screenColorRange1
        );
        const newFrameIsColor2 = isSimilarHSLColor(
          newFrameColor,
          ScreenDetector.detectionColor2,
          screenColorRange1
        );
        const newFrameIsOrientationColor = isSimilarHSLColor(
          newFrameColor,
          ScreenDetector.orientationColor,
          screenColorRange1
        );
        const prevFrameIsColor1 = isSimilarHSLColor(
          prevFrameColor,
          ScreenDetector.detectionColor1,
          screenColorRange1
        );
        const prevFrameIsColor2 = isSimilarHSLColor(
          prevFrameColor,
          ScreenDetector.detectionColor2,
          screenColorRange1
        );
        const prevFrameIsOrientationColor = isSimilarHSLColor(
          prevFrameColor,
          ScreenDetector.orientationColor,
          screenColorRange1
        );

        if (
          newFrameIsColor1 ||
          newFrameIsColor2 ||
          newFrameIsOrientationColor
        ) {
          screenColorPixels.push(new Point(x, y));
        }

        if (
          !newFrameColorIsSimilarFromPrevFrame ||
          true // TODO: Change this.
        ) {
          envChangePixels.push(new Point(x, y));
          if (
            (newFrameIsColor1 && prevFrameIsColor2) ||
            (prevFrameIsColor1 && newFrameIsColor2) ||
            (newFrameIsOrientationColor && prevFrameIsColor1) ||
            (newFrameIsOrientationColor && prevFrameIsColor2) ||
            (prevFrameIsOrientationColor && newFrameIsColor1) ||
            (prevFrameIsOrientationColor && newFrameIsColor2)
          ) {
            const point = new Point(x, y);
            if (detectionBlobs.length == 0) {
              const blob = new DetectionBlob(point, blobPixelMaxRange);
              blob.isOrientationBlob =
                prevFrameIsOrientationColor || newFrameIsOrientationColor;
              detectionBlobs.push(blob);
            } else {
              let foundBlob = false;
              for (let i = 0; i < detectionBlobs.length; i++) {
                const blob = detectionBlobs[i];
                if (blob.isCloseEnough(point)) {
                  blob.add(point);
                  blob.isOrientationBlob =
                    prevFrameIsOrientationColor || newFrameIsOrientationColor;
                  foundBlob = true;
                  break;
                }
              }
              if (!foundBlob) {
                const blob = new DetectionBlob(point, blobPixelMaxRange);
                blob.isOrientationBlob =
                  prevFrameIsOrientationColor || newFrameIsOrientationColor;
                detectionBlobs.push(blob);
              }
            }
          }
        }
      }
    }
    this.previousFrame = newFrame;

    return {
      detectionBlobs: detectionBlobs,
      changedPixels: envChangePixels,
      pixelsWithScreenColors: screenColorPixels,
    };
  }
}

// export class ScreenDetector {
//   currentFrame: HTMLCanvasElement;
//   previousFrame: HTMLCanvasElement;
//   static cornerDetectionColor: IHSLColor = rgbToHsl(0, 0, 255);
//   static circleOrientationColor: IHSLColor = rgbToHsl(127.5, 0, 0);
//   static circleColor: IHSLColor = rgbToHsl(42.5, 127.5, 0);
//   static circleRange: IHSLRange = {
//     hRange: 50,
//     sRange: 50,
//     lRange: 50,
//   };
//   static blobMaxPixelRange = 5;

//   colorRegionDetect(camera: Camera): DetectionBlob[] {
//     const newFrame = camera.snap();
//     this.currentFrame = newFrame;
//     const newFrameCtx = newFrame.getContext("2d");
//     const newFramePixelData = newFrameCtx.getImageData(
//         0,
//         0,
//         newFrame.width,
//         newFrame.height
//       ),
//       newFramePixels = newFramePixelData.data;

//     let blobs: DetectionBlob[] = [];

//     for (let y = 0; y < newFrame.height; y++) {
//       for (let x = 0; x < newFrame.width; x++) {
//         let newFrameColor = getHSLColorForPixel(
//           x,
//           y,
//           newFrame.width,
//           newFramePixels
//         );

//         const absDistanceInHue = Math.abs(
//           ScreenDetector.cornerDetectionColor.h - newFrameColor.h
//         );
//         // Some real rough exclusion of pixels that will surely not be of interest
//         // to reduce computation time.
//         if (
//           newFrameColor.l < 75 &&
//           // newFrameColor.l < 70 &&
//           // newFrameColor.s > 50 &&
//           // Math.min(absDistanceInHue, 360 - absDistanceInHue) < 40
//           newFrameColor.h <= 180 &&
//           newFrameColor.h >= 260
//         ) {
//           const labColor = convert.hsl.lab.raw([
//             newFrameColor.h,
//             newFrameColor.s,
//             newFrameColor.l,
//           ]);
//           const point = new Point(x, y);
//           if (blobs.length == 0) {
//             blobs.push(
//               new DetectionBlob(point, ScreenDetector.blobMaxPixelRange)
//             );
//           } else {
//             let foundBlob = false;
//             for (let i = 0; i < blobs.length; i++) {
//               const blob = blobs[i];
//               if (blob.isCloseEnough(point)) {
//                 blob.add(point);
//                 foundBlob = true;
//                 break;
//               }
//             }
//             if (!foundBlob) {
//               blobs.push(
//                 new DetectionBlob(point, ScreenDetector.blobMaxPixelRange)
//               );
//             }
//           }
//         }
//       }
//     }
//     return blobs;
//   }

//   filterActualCorners(blobs: ColorCombinerBlob[]) {
//     if (blobs.length == 0) {
//       return [];
//     }
//     const frame = this.currentFrame;
//     const frameCtx = frame.getContext("2d");
//     const framePixelData = frameCtx.getImageData(
//         0,
//         0,
//         frame.width,
//         frame.height
//       ),
//       framePixels = framePixelData.data;

//     let topLeft: { totalMatchedPixels: number; blob: ColorCombinerBlob } = {
//       totalMatchedPixels: 0,
//       blob: null,
//     };
//     let potentialOtherCorners: {
//       totalMatchedPixels: number;
//       blob: ColorCombinerBlob;
//     }[] = [];

//     blobs.forEach((blob) => {
//       let orientationPixels = 0;
//       let otherCirclePixels = 0;
//       for (let y = blob.topLeft.y; y < blob.topLeft.y + blob.height; y++) {
//         for (let x = blob.topLeft.x; x < blob.topLeft.x + blob.width; x++) {
//           const pixelColor = getHSLColorForPixel(
//             x,
//             y,
//             frame.width,
//             framePixels
//           );
//           if (
//             isSimilarHSLColor(
//               pixelColor,
//               ScreenDetector.circleOrientationColor,
//               ScreenDetector.circleRange
//             )
//           ) {
//             orientationPixels++;
//           }
//           if (
//             isSimilarHSLColor(
//               pixelColor,
//               ScreenDetector.circleColor,
//               ScreenDetector.circleRange
//             )
//           ) {
//             otherCirclePixels++;
//           }
//           if (orientationPixels > topLeft.totalMatchedPixels) {
//             topLeft = { totalMatchedPixels: orientationPixels, blob };
//           } else {
//             potentialOtherCorners.push({
//               totalMatchedPixels: otherCirclePixels,
//               blob,
//             });
//           }
//         }
//       }
//     });

//     if (!topLeft.blob || potentialOtherCorners.length < 3) {
//       return [];
//     }

//     potentialOtherCorners = potentialOtherCorners.sort(
//       (a, b) => b.totalMatchedPixels - a.totalMatchedPixels
//     );
//     const otherCorners = [potentialOtherCorners[0].blob];
//     for (let i = 1; i < potentialOtherCorners.length; i++) {
//       if (
//         otherCorners.filter((blob) =>
//           blob.overlap(potentialOtherCorners[i].blob)
//         ).length == 0
//       ) {
//         otherCorners.push(potentialOtherCorners[i].blob);
//       }
//       if (otherCorners.length == 3) {
//         break;
//       }
//     }

//     if (otherCorners.length != 3) {
//       return [];
//     }

//     topLeft.blob.color = { h: 120, s: 100, l: 50 };
//     otherCorners[0].color = { h: 0, s: 100, l: 50 };
//     otherCorners[1].color = { h: 0, s: 100, l: 50 };
//     otherCorners[2].color = { h: 0, s: 100, l: 50 };
//     return [topLeft.blob, otherCorners[0], otherCorners[1], otherCorners[2]];
//   }
// }
