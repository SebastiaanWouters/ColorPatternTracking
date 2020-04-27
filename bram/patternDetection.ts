import { Camera } from "./jsHtml/master/camera/camera";
import Point from "./Point";
import {
  getHSLColorForPixel,
  isSimilarHSLColor,
  IHSLRange,
  IHSLColor,
  rgbToHsl,
  hslToRgb,
  getRGBAColorForPixel,
} from "./GEEN_PYTHON";
import * as convert from "color-convert";
import { ColorCombinerBlob } from "./ColorCombinerBlob";
import { closestSimpleColor } from "../ISCC_NBS_color_dict";
import { DetectionBlob } from "./DetectionBlob";

export class PatternDetector {
  static patternColor1: IHSLColor = rgbToHsl(255, 0, 0);
  static patternColor2: IHSLColor = rgbToHsl(0, 255, 0);
  static patternColor3: IHSLColor = rgbToHsl(0, 0, 255);
  static magentaColor: IHSLColor = rgbToHsl(255, 0, 255);
  static greenBlueColor: IHSLColor = rgbToHsl(0, 255, 255);
  static redGreenColor: IHSLColor = rgbToHsl(255, 255, 0);

  
  /**
   * Given a snapshot of the camera of the master, divide all the pixels with red/green/blue 
   * colors in to seperate lists (these lists contain the positions of the pixels as points)
   * 
   * 
   * @param patternSnap 
   * @param Color1Range 
   * @param Color2Range 
   * @param Color3Range 
   * @param accuracy 
   */
  detect(
    patternSnap: HTMLCanvasElement,
    Color1Range: IHSLRange,
    Color2Range: IHSLRange,
    Color3Range: IHSLRange,
    accuracy: number
  ): {
    detectedPoints1: Point[],
    detectedPoints2: Point[],
    detectedPoints3: Point[]
  } {
    const patternSnapCtx = patternSnap.getContext("2d");
    const patternSnapPixelData = patternSnapCtx.getImageData(
        0,
        0,
        patternSnap.width,
        patternSnap.height
      ),
      patternSnapPixels = patternSnapPixelData.data;


    // Pixels that changed between this and the previous frame.
    const detectionPoints1: Point[] = [];
    const detectionPoints2: Point[] = [];
    const detectionPoints3: Point[] = [];

    console.log(Color1Range.hRange);
    
    for (let y = 0; y < patternSnap.height; y += accuracy) {
      for (let x = 0; x < patternSnap.width; x += accuracy) {
        const currColor = getHSLColorForPixel(
          x,
          y,
          patternSnap.width,
          patternSnapPixels
        );
        const similarToColor1 = isSimilarHSLColor(
          currColor,
          PatternDetector.patternColor1,
          Color1Range
        );
        const similarToColor2 = isSimilarHSLColor(
          currColor,
          PatternDetector.patternColor2,
          Color2Range
        );
        const similarToColor3 = isSimilarHSLColor(
          currColor,
          PatternDetector.patternColor3,
          Color3Range
        );

        if (similarToColor1) {
            detectionPoints1.push(new Point(x,y))
        } 
        else if (similarToColor2) {
          detectionPoints2.push(new Point(x,y))
        } 
        else if (similarToColor3) {
          detectionPoints3.push(new Point(x,y))
        }
      }
    }  

    return {
      detectedPoints1: detectionPoints1,
      detectedPoints2: detectionPoints2,
      detectedPoints3: detectionPoints3,
    };
  }

  /**
   * Given three sets of pixels which are respectively blue, green and red. Function checks if there are pixels
   * close to each other that are part of the three sets. This means that the three colors are found in close proximity of 
   * each other and thus are a centerPoint probably
   * 
   */
  calculateCenter(Points1: Point[], Points2 : Point[], Points3 : Point[], range : number, accuracy : number) : {
    centeredPoints: Point[],
  } {
    let centerPoints : Point[] = [];
    let nearColor2 = false;
    let nearColor3 = false;
    let tooClose = false;

    for (let p1 = 0; p1 < Points1.length; p1 += accuracy) {
      let pointX = Points1[p1].x
      let pointY = Points1[p1].y
      for (let xIndex = pointX - range; xIndex < pointX + range; xIndex++) {
        for (let yIndex = pointY - range; yIndex < pointY + range; yIndex++) {
          for (let p2 = 0; p2 < Points2.length; p2 += accuracy) {
            let point2X = Points2[p2].x
            let point2Y = Points2[p2].y
            if (point2X == xIndex && yIndex == point2Y) {
              nearColor2 = true;
              break;
            }
          }

          for (let p3 = 0; p3 < Points3.length; p3 += accuracy) {
            let point3X = Points3[p3].x
            let point3Y = Points3[p3].y
            if (point3X == xIndex && yIndex == point3Y) {
              nearColor3 = true;
              break;
            }
            
          }
          if (nearColor2 && nearColor3) {break;}

        }
        if (nearColor2 && nearColor3) {break;}
      }

      if (nearColor2 && nearColor3) {
        //console.log(pointX + " " + pointY);
        if (centerPoints.length >= 1) {
          for (let i = 0; i < centerPoints.length; i++) {
            if (centerPoints[i].distanceTo(Points1[p1]) < 13) {
              tooClose = true;
              //console.log(pointX + " " + pointY);
            }

          }
        } else {
          tooClose = false;
          //console.log(pointX + " " + pointY);
        } 
        if (!tooClose) {
          centerPoints.push(Points1[p1]);
        }
    
      }
      tooClose = false;
      nearColor2 = false;
      nearColor3 = false;

    }

    return {
      centeredPoints: centerPoints
    };

  }
  /**
   * Given a set of corners and the canvas on which they were found, calculating which corner is
   * leftUpper/rightUnder/leftUnder/rightUpper...
   */
  getCornerIdentifier(canvas: HTMLCanvasElement, Points: Point[], colorRange: IHSLRange) : {
    identifierList: number[]
    } {

      let identifiers : number[] = [];
      let magentaCounter = 0;
      let greenBlueCounter = 0;
      let redGreenCounter = 0;
      let blackCounter = 0;
      let magentaFound = false;
      let greenBlueFound = false;
      let redGreenFound = false;
      let blackFound = false;

      const canvasCtx = canvas.getContext("2d");
      const canvasPixelData = canvasCtx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      ),
      canvasPixels = canvasPixelData.data;
      
      Points.forEach(  (point) => {

      for (let y = point.y; y < point.y + 130; y += 1) {
          const currColor = getHSLColorForPixel(
            point.x,
            y,
            canvas.width,
            canvasPixels
          );
          const currColorRGBA = getRGBAColorForPixel(
            point.x,
            y,
            canvas.width,
            canvasPixels
          );
          
            const similarToMagenta = isSimilarHSLColor(
            currColor,
            PatternDetector.magentaColor,
            colorRange
            );

            const similarToGreenBlue = isSimilarHSLColor(
            currColor,
            PatternDetector.greenBlueColor,
            colorRange
            );

            /**const similarToRedGreen = isSimilarHSLColor(
            currColor,
            PatternDetector.redGreenColor,
            colorRange
            );*/

            const similarToBlack = (currColorRGBA.r < 50 && currColorRGBA.g < 50 && currColorRGBA.b < 50) 

            if (similarToMagenta) {
              console.log("magenta found: " +  currColor.h + " " + currColor.s + " " + currColor.l)
              magentaCounter += 1;
            }
            /**if (similarToRedGreen) {
              console.log("redGreen found: " +  currColor.h + " " + currColor.s + " " + currColor.l)
              redGreenCounter += 1;
            }*/
            if (similarToGreenBlue) {
              console.log("green blue found: " +  currColor.h + " " + currColor.s + " " + currColor.l)
              greenBlueCounter += 1;
            }
            if (similarToBlack) {
              console.log("black found: " +  currColor.h + " " + currColor.s + " " + currColor.l)
              blackCounter += 1;
            }

            if (magentaCounter > 3) {
              magentaFound = true;
            }
            /**else if (redGreenCounter > 3) {
              redGreenFound = true;
            }*/
            else if (greenBlueCounter > 3) {
              greenBlueFound = true;
            }
            else if (blackCounter > 3) {
              blackFound = true;
            }

            if (magentaFound) {
              identifiers.push(1);
              break;
            }
            /**if (redGreenFound) {
              identifiers.push(2);
              break;
            }*/
            if (greenBlueFound) {
              identifiers.push(3);
              break;
            }
            if (blackFound) {
              identifiers.push(4);
              break;
            }

          }
          
      if (!greenBlueFound && !redGreenFound && !magentaFound && !blackFound) {
            identifiers.push(4)
      }
      magentaCounter = 0;
      blackCounter = 0;
      redGreenCounter = 0;
      greenBlueCounter = 0;
      magentaFound = false;
      greenBlueFound = false;
      redGreenFound = false;
      blackFound = false;

    });      



      return {
        identifierList: identifiers
      };
  }

  
}



