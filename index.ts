import {
  loadImage,
  createCanvas,
  IRGBAColor,
  matchToNewCorner,
  IHSLRange,
  rgbToHsl,
  hslToRgb,
} from "./bram/GEEN_PYTHON";
import Point from "./bram/Point";
import SlaveScreen from "./bram/SlaveScreen";
import {
  blendImageColors,
  removeSandL,
  exaturateBlue,
} from "./bram/colorBlender";
import { Camera, Camera2, Camera3 } from "./bram/jsHtml/master/camera/camera";
import { ScreenDetector } from "./bram/screenDetection";
import { PatternDetector } from "./bram/patternDetection";
import { DetectionBlob } from "./bram/DetectionBlob";
import {
  ConfirmScreensButton,
  CameraSettingsOpenButton,
} from "./bram/jsHtml/master/camera/camera_buttons";
import {
  CameraOverlay,
  CameraEnvironmentChangeOverlay,
  CameraScreenColorsOverlay,
} from "./bram/jsHtml/master/camera/cameraOverlays";
import { CameraSettings } from "./bram/jsHtml/master/camera/settings/CameraSettings";
import { CameraSettingsCloseButon } from "./bram/jsHtml/master/camera/settings/CameraSettingsCloseButton";
import {
  CameraSettingsEnvRangeButton,
  CameraSettingsScreenRangeButton,
  CameraSettingsBlobRangeButton,
  CameraSettingsPatternRangeButton
} from "./bram/jsHtml/master/camera/settings/cameraSettingsRangeButtons";
import { CameraRangeSelectionContainer } from "./bram/jsHtml/master/camera/settings/CameraRangeSelectionContainer";
import { CameraSlidersContainer } from "./bram/jsHtml/master/camera/settings/cameraSlidersContainers";
import {
  SettingSlidersEnv,
  SettingsSlidersScreen,
  SettingsSlidersBlobRange,
  SettingsSlidersPatternRange
} from "./bram/jsHtml/master/camera/settings/slidersRanges";
import { SettingsSlidersBackButton } from "./bram/jsHtml/master/camera/settings/SettingsSlidersBackButton";
import { MasterHTMLElem } from "./bram/jsHtml/master/MasterHtml";
import IScreenColorDetails from "./bram/IScreenColorDetails";
import { detectLabColorsInRange, rgbToLab } from "./bram/labTest";
import * as convert from "color-convert";
import { DetectCircle } from "./bram/Circle";
import io from "socket.io-client";

const pixelChangeColorRange: IHSLRange = {
  hRange: 110,
  sRange: 100,
  lRange: 100,
};
const similarRedColorRange: IHSLRange = {
  hRange: 65,
  sRange: 40,
  lRange: 25,
};
const similarBlueColorRange: IHSLRange = {
  hRange: 65,
  sRange: 10,
  lRange: 10,
};
const similarPatternColorRange: IHSLRange = {
  hRange: 30,
  sRange: 54,
  lRange: 35,
};
const identifierColorRange: IHSLRange = {
  hRange: 52,
  sRange: 50,
  lRange: 40,
};


let patternAccuracy = 2, patternRange = 6;

const blobPixelDistance = 30;
const blobMatchDistance = 40;

const blue = rgbToHsl(0, 0, 255);
const colorA = rgbToHsl(255, 0, 0);
const colorB = rgbToHsl(0, 255, 255);
const colorC = rgbToHsl(191, 191, 64);

//@ts-ignore
window.range = pixelChangeColorRange;

async function wait(dt: number) {
  return new Promise((res, rej) => {
    setInterval(res, dt);
  });
}

async function pageLoad() {
  return new Promise((resolve, reject) => {
    window.addEventListener("load", resolve);
  });
}

function initMasterUI() {
  new MasterHTMLElem().scale(1);
  window.scrollTo(0, 1);
  
  
  const cameraOverlayCanvas = new CameraOverlay();
  const cameraOverlayCtx = cameraOverlayCanvas.elem.getContext("2d");

  new ConfirmScreensButton().onClick(() => console.log("confirmed"));
  new CameraSettingsOpenButton().onClick(() => {
    new CameraSettings().show();
  });
  new CameraSettingsCloseButon().onClick(() => new CameraSettings().hide());

  const settingsSlidersEnv = new SettingSlidersEnv();
  const settingsSlidersScreen = new SettingsSlidersScreen();
  const settingsSlidersBlobRange = new SettingsSlidersBlobRange();
  const settingsSlidersPatternRange = new SettingsSlidersPatternRange();

  settingsSlidersBlobRange.value = blobPixelDistance;
  settingsSlidersBlobRange.updateText();
  settingsSlidersBlobRange.onValueChange((val) => {
    settingsSlidersBlobRange.updateText();
    cameraOverlayCtx.beginPath();
    cameraOverlayCtx.moveTo(10, 10);
    cameraOverlayCtx.lineTo(10 + val, 10);
    cameraOverlayCtx.closePath();
    cameraOverlayCtx.strokeStyle = "rgb(255, 0, 50)";
    cameraOverlayCtx.stroke();
  });
  new CameraSettingsBlobRangeButton().onClick(() => {
    new CameraRangeSelectionContainer().hide();
    new CameraSlidersContainer().show();
    settingsSlidersBlobRange.show();
    settingsSlidersEnv.hide();
    settingsSlidersScreen.hide();
    settingsSlidersPatternRange.hide();
  });
  
  settingsSlidersPatternRange.hue = similarPatternColorRange.hRange;
  settingsSlidersPatternRange.saturation = similarPatternColorRange.sRange;
  settingsSlidersPatternRange.light = similarPatternColorRange.lRange;
  settingsSlidersPatternRange.accuracy = patternAccuracy;
  settingsSlidersPatternRange.range = patternRange;
  settingsSlidersPatternRange.updateText();
  settingsSlidersPatternRange.onHueChange((hue) => {
    settingsSlidersPatternRange.updateText();
    similarPatternColorRange.hRange = settingsSlidersPatternRange.hue;
  });
  settingsSlidersPatternRange.onSaturationChange((sat) => {
    settingsSlidersPatternRange.updateText();
    similarPatternColorRange.sRange = settingsSlidersPatternRange.saturation;
  });
  settingsSlidersPatternRange.onLightChange((light) => {
    settingsSlidersPatternRange.updateText();
    similarPatternColorRange.lRange = settingsSlidersPatternRange.light;
  });
  settingsSlidersPatternRange.onAccuracyChange((accuracy) => {
    settingsSlidersPatternRange.updateText();
    patternAccuracy = settingsSlidersPatternRange.accuracy;
  });
  settingsSlidersPatternRange.onRangeChange((range) => {
    settingsSlidersPatternRange.updateText();
    patternRange = settingsSlidersPatternRange.range;
  });

  new CameraSettingsPatternRangeButton().onClick(() => {
    new CameraRangeSelectionContainer().hide();
    new CameraSlidersContainer().show();
    settingsSlidersPatternRange.show();
    settingsSlidersBlobRange.hide();
    settingsSlidersEnv.hide();
    settingsSlidersScreen.hide();
  });

  settingsSlidersEnv.hue = pixelChangeColorRange.hRange;
  settingsSlidersEnv.saturation = pixelChangeColorRange.sRange;
  settingsSlidersEnv.light = pixelChangeColorRange.lRange;
  settingsSlidersEnv.onHueChange((_) => settingsSlidersEnv.updateHueText());
  settingsSlidersEnv.onSaturationChange((_) =>
    settingsSlidersEnv.updateSaturationText()
  );
  settingsSlidersEnv.onLightChange((_) => settingsSlidersEnv.updateLightText());
  new CameraSettingsEnvRangeButton().onClick(() => {
    new CameraRangeSelectionContainer().hide();
    new CameraSlidersContainer().show();
    new CameraEnvironmentChangeOverlay().show();
    settingsSlidersEnv.show();
    settingsSlidersBlobRange.hide();
    settingsSlidersScreen.hide();
    settingsSlidersPatternRange.hide();
  });

  settingsSlidersScreen.hue = similarBlueColorRange.hRange;
  settingsSlidersScreen.saturation = similarBlueColorRange.sRange;
  settingsSlidersScreen.light = similarBlueColorRange.lRange;
  settingsSlidersScreen.onHueChange((_) =>
    settingsSlidersScreen.updateHueText()
  );
  settingsSlidersScreen.onSaturationChange((_) =>
    settingsSlidersScreen.updateSaturationText()
  );
  settingsSlidersScreen.onLightChange((_) =>
    settingsSlidersScreen.updateLightText()
  );
  new CameraSettingsScreenRangeButton().onClick(() => {
    new CameraRangeSelectionContainer().hide();
    new CameraSlidersContainer().show();
    new CameraScreenColorsOverlay().show();
    settingsSlidersEnv.hide();
    settingsSlidersBlobRange.hide();
    settingsSlidersScreen.show();
    settingsSlidersPatternRange.hide();
  });

  new SettingsSlidersBackButton().onClick(() => {
    cameraOverlayCtx.clearRect(
      0,
      0,
      cameraOverlayCanvas.width,
      cameraOverlayCanvas.height
    );
    new CameraSlidersContainer().hide();
    new CameraEnvironmentChangeOverlay().hide();
    new CameraScreenColorsOverlay().hide();
    new CameraRangeSelectionContainer().show();
  });
}

async function labCornersTest() {
  await pageLoad();

  initMasterUI();

  const camera = new Camera();
  await camera.start();

  const range = { l: 40, a: 70, b: 50 };
  const settingsSlidersScreen = new SettingsSlidersScreen();
  settingsSlidersScreen.hue = range.l;
  settingsSlidersScreen.saturation = range.a;
  settingsSlidersScreen.light = range.b;
  settingsSlidersScreen.updateHueText();
  settingsSlidersScreen.updateLightText();
  settingsSlidersScreen.updateSaturationText();

  let canDetectAgain = true;
  setInterval(() => {
    if (!canDetectAgain) {
      return;
    }

    canDetectAgain = false;

    // Light
    const green = { l: 0, a: -128, b: 128 }; // OK
    const blue = { l: 0, a: 128, b: -128 }; // OK

    const _ = settingsSlidersScreen.toHSLRange();
    const labRange = {
      l: _.hRange,
      a: _.sRange,
      b: _.lRange,
    };
    const detectedPixels = detectLabColorsInRange(
      camera,
      // [green, blue, red],
      [blue],
      labRange
    );

    const cameraScreenColorsOverlay = new CameraScreenColorsOverlay();
    if (!cameraScreenColorsOverlay.isHidden()) {
      const ctx = cameraScreenColorsOverlay.elem.getContext("2d");
      ctx.clearRect(
        0,
        0,
        cameraScreenColorsOverlay.width,
        cameraScreenColorsOverlay.height
      );
      ctx.fillStyle = "white";
      detectedPixels.forEach((pixel) => ctx.fillRect(pixel.x, pixel.y, 1, 1));
    }
    canDetectAgain = true;
  }, 0);
}

async function colorRegionTest() {
  await pageLoad();

  initMasterUI();

  const camera = new Camera();
  await camera.start();

  const cameraOverlay = new CameraOverlay();
  const ctx = cameraOverlay.elem.getContext("2d");
  const screenDetector = new ScreenDetector();

  let canDetectAgain = true;
  setInterval(() => {
    let startT = Date.now();
    if (!canDetectAgain) {
      return;
    }
    canDetectAgain = false;
    cameraOverlay.clear();

    ctx.fillStyle = "red";
    const dt = Date.now() - startT;
    ctx.fillText("Frame took: " + dt + "ms", 20, 20);

    const blobs = screenDetector.detect(
      camera,
      { hRange: 50, sRange: 50, lRange: 100 },
      { hRange: 50, sRange: 50, lRange: 100 },
      5
    );
    blobs.detectionBlobs.forEach((blob) => {
      blob.draw(ctx);
    });
    canDetectAgain = true;
  }, 0);
}
// colorRegionTest();

async function circlesTest() {
  await pageLoad();

  initMasterUI();

  const camera = new Camera();
  await camera.start();

  const cameraOverlay = new CameraOverlay();
  const ctx = cameraOverlay.elem.getContext("2d");
  const screenDetector = new ScreenDetector();

  let canDetectAgain = true;
  let avgVotes = 30;
  setInterval(() => {
    let startTime = Date.now();
    if (!canDetectAgain) {
      return;
    }
    canDetectAgain = false;
    cameraOverlay.clear();


    const snap = camera.snap();
    const scale = 25 / 100;
    const resizedSnap = createCanvas(
      Math.floor(snap.width * scale),
      Math.floor(snap.height * scale)
    );
    const resizedSnapCtx = resizedSnap.getContext("2d");
    resizedSnapCtx.drawImage(
      snap,
      0,
      0,
      snap.width,
      snap.height,
      0,
      0,
      resizedSnap.width,
      resizedSnap.height
    );
    const resizedSnapImageData = resizedSnapCtx.getImageData(
      0,
      0,
      resizedSnap.width,
      resizedSnap.height
    );
    const sobel = document.createElement("canvas");
    sobel.width = resizedSnap.width;
    sobel.height = resizedSnap.height;
    const sobelCtx = sobel.getContext("2d");
    sobelCtx.drawImage(resizedSnap, 0, 0);
    const sobelImageData = sobelCtx.getImageData(
      0,
      0,
      sobel.width,
      sobel.height
    );
    let edgePixels = camera.applySobelEdgeFilterOnLightPixels(sobelImageData);
    sobelCtx.putImageData(sobelImageData, 0, 0);
    edgePixels = camera.filterToColorNeighborEdges(edgePixels, resizedSnap);
    sobelCtx.fillStyle = "RED";
    edgePixels.forEach((pixel) => {
      sobelCtx.fillRect(pixel.x, pixel.y, 1, 1);
    });
    ctx.drawImage(sobel, 0, 0, snap.width, snap.height);
    

    ctx.fillStyle = "red";
    const dt = Date.now() - startTime;
    ctx.font = "30px Verdana";
    ctx.fillText("Frame took: " + dt + "ms", 20, 20);
    ctx.fillText("Resolution: " + `${snap.width}x${snap.height}`, 20, 40);
    ctx.fillText(
      "Scaled resolution: " + `${resizedSnap.width}x${resizedSnap.height}`,
      20,
      60
    );

    canDetectAgain = true;
  }, 0);
}
// circlesTest();

async function circlesTest2() {
  await pageLoad();

  initMasterUI();

  const camera = new Camera2();
  await camera.start();

  const cameraOverlay = new CameraOverlay();
  const ctx = cameraOverlay.elem.getContext("2d");

  let blancoSnap: HTMLCanvasElement;
  let detectionSnap: HTMLCanvasElement;

  function takeBlanco() {
    blancoSnap = camera.snap();
  }

  function detect() {
    const blancoSnapCtx = blancoSnap.getContext("2d");
    const blancoSnapImageData = blancoSnapCtx.getImageData(
      0,
      0,
      blancoSnap.width,
      blancoSnap.height
    );

    detectionSnap = camera.snap();
    const detectionSnapCtx = detectionSnap.getContext("2d");
    const detectionSnapImageData = detectionSnapCtx.getImageData(
      0,
      0,
      detectionSnap.width,
      detectionSnap.height
    );

    const manipulationCanvas = document.createElement("canvas");
    manipulationCanvas.width = detectionSnap.width;
    manipulationCanvas.height = detectionSnap.height;
    const manipulationCtx = manipulationCanvas.getContext("2d");
    manipulationCtx.drawImage(detectionSnap, 0, 0);
    const manipulationImgData = manipulationCtx.getImageData(
      0,
      0,
      blancoSnap.width,
      blancoSnap.height
    );
    camera.difference1(blancoSnapImageData, manipulationImgData);
    camera.applyBigGaussianBlurAndGrayScale(manipulationImgData);
    camera.applySharpen(manipulationImgData);
    
    manipulationCtx.putImageData(manipulationImgData, 0, 0);

    ctx.drawImage(manipulationCanvas, 0, 0);
  }

  document.getElementById("confirmButton").onclick = () => {
    if (!blancoSnap) {
      takeBlanco();
      console.log("detecting")
    } else {
      const startTime = Date.now();
      detect();
      ctx.fillStyle = "red";
      ctx.fillText("Frame took: " + (Date.now() - startTime) + "ms", 20, 20);
    }
  };
}




async function motionTest() {
  await pageLoad();

  initMasterUI();

  const camera = new Camera3();
  await camera.start();

  const cameraOverlay = new CameraOverlay();
  const ctx = cameraOverlay.elem.getContext("2d");

  const scale = 0.5;

  // let filterBlobs: DetectionBlob[];
  let motionPixels: Point[] = [];

  const socket = io.connect("https://penocw03.student.cs.kuleuven.be");
  socket.on("connect", () => {
    ctx.fillStyle = "green";
    ctx.fillText("Connected to slave", 20, 20);
    document.getElementById("confirmButton").onclick = () => {
      // if (!filterBlobs) {
      //   const snap = camera.snap(scale);
      //   const snapCtx = snap.getContext("2d");
      //   const snapImgData = snapCtx.getImageData(0, 0, snap.width, snap.height);
      //   filterBlobs = camera.findBlobs(snapImgData);
      //   filterBlobs.forEach((blob) => {
      //     blob.draw(ctx, scale);
      //   });
      // } else {
      socket.emit("request-animation");
      let canDetectAgain = true;
      const interval = setInterval(() => {
        if (!canDetectAgain) return;
        canDetectAgain = false;
        takeFrames();
        canDetectAgain = true;
      }, 500);
      socket.on("slave-ended-animation", () => {
        clearInterval(interval);
        console.log("Detecting motion");
        detectMotion();
        console.log("Motion detected");
        const areaThreshold = 0.75;
        const areas = camera
          .filterToAreas(motionPixels)
          .sort((a, b) => b.length - a.length);
        console.log("Found " + areas.length + " areas");
        const biggestArea = areas[0];
        const filteredAreas = [biggestArea];
        const tooSmallAreas = [];
        for (let i = 1; i < areas.length; i++) {
          const area = areas[i];
          if (area.length < biggestArea.length * areaThreshold) {
            tooSmallAreas.push(area);
            //break;
          } else {
            filteredAreas.push(area);
          }
        }
        console.log("From which " + filteredAreas.length + " are excepted");
        ctx.fillStyle = "blue";
        for (let i = 0; i < filteredAreas.length; i++) {
          const area = filteredAreas[i];
          area.forEach((p) =>
            ctx.fillRect(p.x / scale, p.y / scale, 1 / scale, 1 / scale)
          );
        }
        ctx.fillStyle = "red";
        for (let i = 0; i < tooSmallAreas.length; i++) {
          const area = tooSmallAreas[i];
          area.forEach((p) =>
            ctx.fillRect(p.x / scale, p.y / scale, 1 / scale, 1 / scale)
          );
        }
        console.log("Areas drawn!");
        console.log("Finding edges");
        motionPixels = [];
        filteredAreas.forEach((area) => {
          area.forEach((p) => motionPixels.push(p));
        });
        findPoints();
      });
      // }
    };
  });

  let prevAnimationFrame: HTMLCanvasElement;

  const frames: HTMLCanvasElement[] = [];

  function takeFrames() {
    frames.push(camera.snap(scale));
  }

  function detectMotion() {
    for (let i = 0; i < frames.length; i++) {
      if (!prevAnimationFrame) {
        prevAnimationFrame = frames[i];
        continue;
      }
      // ctx.clearRect(0, 0, cameraOverlay.width, cameraOverlay.height);
      const startTime = Date.now();
      const currFrame = frames[i];
      const currFrameCtx = currFrame.getContext("2d");
      const currFrameImgData = currFrameCtx.getImageData(
        0,
        0,
        currFrame.width,
        currFrame.height
      );

      const prevFrameCtx = prevAnimationFrame.getContext("2d");
      const prevFrameImgData = prevFrameCtx.getImageData(
        0,
        0,
        prevAnimationFrame.width,
        prevAnimationFrame.height
      );

      const maarten = camera.maartensRareAlgoritme(
        prevFrameImgData,
        currFrameImgData,
        motionPixels
      );
      // ctx.fillStyle = "white";
      // maarten.forEach((p) =>
      //   ctx.fillRect(p.x / scale, p.y / scale, 1 / scale, 1 / scale)
      // );

      ctx.fillStyle = "red";
      ctx.fillText("Frame took: " + (Date.now() - startTime) + "ms", 20, 20);

      prevAnimationFrame = currFrame;
    }
  }

  function findPoints() {
    const foundScreenImgData = new ImageData(
      cameraOverlay.width,
      cameraOverlay.height
    );
    const foundScreenPixels = foundScreenImgData.data;

    motionPixels.forEach((pixel) => {
      const i = pixel.y * (cameraOverlay.width * 4) + pixel.x * 4;
      foundScreenPixels[i] = 255;
      foundScreenPixels[i + 1] = 255;
      foundScreenPixels[i + 2] = 255;
    });

    camera.applyBigGaussianBlur(foundScreenImgData);
    camera.applySharpen(foundScreenImgData);
    const points = camera.applySobelEdgeFilter(foundScreenImgData);
    ctx.fillStyle = "green";
    points.forEach((point) => {
      ctx.fillRect(point.x / scale, point.y / scale, 1 / scale, 1 / scale);
    });

    const xValues = points.map((p) => p.x);
    const yValues = points.map((p) => p.y);

    let p1: Point;
    const xMedian =
      xValues.length % 2 !== 0
        ? xValues[Math.floor(xValues.length / 2)]
        : (xValues[Math.floor(xValues.length / 2) - 1] +
            xValues[Math.floor(xValues.length / 2)]) /
          2;
    const yMedian =
      yValues.length % 2 !== 0
        ? yValues[Math.floor(yValues.length / 2)]
        : (yValues[Math.floor(yValues.length / 2) - 1] +
            yValues[Math.floor(yValues.length / 2)]) /
          2;
    const medianPoint = new Point(xMedian, yMedian);
    let maxDist = 0;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const dist = p.distanceSq(medianPoint);
      if (dist > maxDist) {
        maxDist = dist;
        p1 = p;
      }
    }

    let p2: Point;
    maxDist = 0;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const dist = p.distanceSq(p1);
      if (dist > maxDist) {
        maxDist = dist;
        p2 = p;
      }
    }

    ctx.fillStyle = "blue";
    ctx.beginPath();
    ctx.arc(p1.x / scale, p1.y / scale, 10, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p2.x / scale, p2.y / scale, 10, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();

    const centerP1P2 = new Point(
      p2.x + (p1.x - p2.x) / 2,
      p2.y + (p1.y - p2.y) / 2
    );

    let p3: Point;
    maxDist = 0;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const dist = p.distanceSq(centerP1P2);
      if (dist > maxDist && !p.equals(p1) && !p.equals(p2)) {
        if (
          Math.abs(
            Math.atan2(p.y - p1.y, p.x - p1.x) -
              Math.atan2(p2.y - p1.y, p2.x - p1.x)
          ) >
            (20 * Math.PI) / 180 &&
          Math.abs(
            Math.atan2(p.y - p2.y, p.x - p2.x) -
              Math.atan2(p1.y - p2.y, p1.x - p2.x)
          ) >
            (20 * Math.PI) / 180
        ) {
          maxDist = dist;
          p3 = p;
        }
      }
    }
    console.log(p3);

    let p4: Point;
    maxDist = 0;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const dist = p.distanceSq(p3);
      if (dist > maxDist && !p.equals(p1) && !p.equals(p2) && !p.equals(p3)) {
        if (
          Math.abs(
            Math.atan2(p.y - p1.y, p.x - p1.x) -
              Math.atan2(p2.y - p1.y, p2.x - p1.x)
          ) >
            (20 * Math.PI) / 180 &&
          Math.abs(
            Math.atan2(p.y - p2.y, p.x - p2.x) -
              Math.atan2(p1.y - p2.y, p1.x - p2.x)
          ) >
            (20 * Math.PI) / 180
        ) {
          maxDist = dist;
          p4 = p;
        }
      }
    }
    console.log(p4);

    ctx.beginPath();
    ctx.arc(p3.x / scale, p3.y / scale, 10, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p4.x / scale, p4.y / scale, 10, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
  }
}

// motionTest();

async function clusterTest() {
  await pageLoad();

  initMasterUI();

  const camera = new Camera3();
  await camera.start();

  const cameraOverlay = new CameraOverlay();
  const ctx = cameraOverlay.elem.getContext("2d");

  const scale = 0.5;

  const socket = io.connect("https://penocw03.student.cs.kuleuven.be");
  socket.on("connect", () => {
    ctx.fillStyle = "green";
    ctx.fillText("Connected to slave", 20, 20);
    document.getElementById("confirmButton").onclick = () => {
      const firstImg = takeFirstImg();
      socket.on("slave-displayed-black", () => {
        const secondImg = takeSecondImg();
        ctx.fillStyle = "red";
        ctx.fillText("Calculating difference in colors...", 20, 40);
        const firstImgCtx = firstImg.getContext("2d");
        const secondImgCtx = secondImg.getContext("2d");
        const firstImgData = firstImgCtx.getImageData(
          0,
          0,
          firstImg.width,
          firstImg.height
        );
        const secondImgData = secondImgCtx.getImageData(
          0,
          0,
          secondImg.width,
          secondImg.height
        );
        let diffPoints = camera.detectBigColorDifferences(
          firstImgData,
          secondImgData
        );
        ctx.fillStyle = "blue";
        // diffPoints.forEach((point) => {
        //   ctx.fillRect(point.x / scale, point.y / scale, 1 / scale, 1 / scale);
        // });

        const diffImgData = camera.pointsToImgData(
          diffPoints,
          firstImg.width,
          firstImg.height
        );
        diffPoints = camera.filter8Neighbors(diffPoints, diffImgData, 5);

        const areas = camera.filterToAreas(diffPoints);
        areas.forEach((area) => {
          const red = Math.random() * 255;
          ctx.fillStyle = `rgb(${Math.random() * 50}, ${Math.random() * 255}, ${
            Math.random() * 255
          })`;
          area.forEach((p) =>
            ctx.fillRect(p.x / scale, p.y / scale, 1 / scale, 1 / scale)
          );
        });
        ctx.fillStyle = "red";
        const areaToWorkWith = areas.sort((a, b) => b.length - a.length)[0];
        areaToWorkWith.forEach((p) => {
          ctx.fillRect(p.x / scale, p.y / scale, 1 / scale, 1 / scale);
        });

        findPoints(areaToWorkWith);

        ctx.fillStyle = "green";
        ctx.fillText("Done.", 20, 60);
      });
      socket.emit("request-black");
    };
  });

  function takeFirstImg() {
    return camera.snap(scale);
  }
  function takeSecondImg() {
    return camera.snap(scale);
  }
  function findPoints(motionPixels: Point[]) {
    const foundScreenImgData = new ImageData(
      cameraOverlay.width,
      cameraOverlay.height
    );
    const foundScreenPixels = foundScreenImgData.data;

    motionPixels.forEach((pixel) => {
      const i = pixel.y * (cameraOverlay.width * 4) + pixel.x * 4;
      foundScreenPixels[i] = 255;
      foundScreenPixels[i + 1] = 255;
      foundScreenPixels[i + 2] = 255;
    });

    camera.applyBigGaussianBlur(foundScreenImgData);
    camera.applySharpen(foundScreenImgData);
    const points = camera.applySobelEdgeFilter(foundScreenImgData);
    ctx.fillStyle = "green";
    points.forEach((point) => {
      ctx.fillRect(point.x / scale, point.y / scale, 1 / scale, 1 / scale);
    });

    const xValues = points.map((p) => p.x);
    const yValues = points.map((p) => p.y);

    let p1: Point;
    const xMedian =
      xValues.length % 2 !== 0
        ? xValues[Math.floor(xValues.length / 2)]
        : (xValues[Math.floor(xValues.length / 2) - 1] +
            xValues[Math.floor(xValues.length / 2)]) /
          2;
    const yMedian =
      yValues.length % 2 !== 0
        ? yValues[Math.floor(yValues.length / 2)]
        : (yValues[Math.floor(yValues.length / 2) - 1] +
            yValues[Math.floor(yValues.length / 2)]) /
          2;
    const medianPoint = new Point(xMedian, yMedian);
    let maxDist = 0;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const dist = p.distanceSq(medianPoint);
      if (dist > maxDist) {
        maxDist = dist;
        p1 = p;
      }
    }

    let p2: Point;
    maxDist = 0;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const dist = p.distanceSq(p1);
      if (dist > maxDist) {
        maxDist = dist;
        p2 = p;
      }
    }

    ctx.fillStyle = "blue";
    ctx.beginPath();
    ctx.arc(p1.x / scale, p1.y / scale, 10, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p2.x / scale, p2.y / scale, 10, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();

    const centerP1P2 = new Point(
      p2.x + (p1.x - p2.x) / 2,
      p2.y + (p1.y - p2.y) / 2
    );

    let p3: Point;
    maxDist = 0;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const dist = p.distanceSq(centerP1P2);
      if (dist > maxDist && !p.equals(p1) && !p.equals(p2)) {
        if (
          Math.abs(
            Math.atan2(p.y - p1.y, p.x - p1.x) -
              Math.atan2(p2.y - p1.y, p2.x - p1.x)
          ) >
            (20 * Math.PI) / 180 &&
          Math.abs(
            Math.atan2(p.y - p2.y, p.x - p2.x) -
              Math.atan2(p1.y - p2.y, p1.x - p2.x)
          ) >
            (20 * Math.PI) / 180
        ) {
          maxDist = dist;
          p3 = p;
        }
      }
    }
    console.log(p3);

    let p4: Point;
    maxDist = 0;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const dist = p.distanceSq(p3);
      if (dist > maxDist && !p.equals(p1) && !p.equals(p2) && !p.equals(p3)) {
        if (
          Math.abs(
            Math.atan2(p.y - p1.y, p.x - p1.x) -
              Math.atan2(p2.y - p1.y, p2.x - p1.x)
          ) >
            (20 * Math.PI) / 180 &&
          Math.abs(
            Math.atan2(p.y - p2.y, p.x - p2.x) -
              Math.atan2(p1.y - p2.y, p1.x - p2.x)
          ) >
            (20 * Math.PI) / 180
        ) {
          maxDist = dist;
          p4 = p;
        }
      }
    }
    console.log(p4);

    ctx.beginPath();
    ctx.arc(p3.x / scale, p3.y / scale, 10, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p4.x / scale, p4.y / scale, 10, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
  }
}

clusterTest();

async function testColorDist() {
  await pageLoad();

  initMasterUI();

  const camera = new Camera3();
  await camera.start();

  const cameraOverlay = new CameraOverlay();
  const ctx = cameraOverlay.elem.getContext("2d");

  const scale = 0.5;

  const socket = io.connect("https://penocw03.student.cs.kuleuven.be");
  socket.on("connect", () => {
    ctx.fillStyle = "green";
    ctx.fillText("Connected to slave", 20, 20);
    document.getElementById("confirmButton").onclick = () => {
      const firstImg = takeFirstImg();
      socket.on("slave-displayed-black", () => {
        const secondImg = takeSecondImg();
        ctx.fillStyle = "red";
        ctx.fillText("Calculating difference in colors...", 20, 40);
        const firstImgCtx = firstImg.getContext("2d");
        const secondImgCtx = secondImg.getContext("2d");
        const firstImgData = firstImgCtx.getImageData(
          0,
          0,
          firstImg.width,
          firstImg.height
        );
        const secondImgData = secondImgCtx.getImageData(
          0,
          0,
          secondImg.width,
          secondImg.height
        );
        camera.toGrayScale(firstImgData);
        camera.toGrayScale(secondImgData);

        const diffPoints = camera.differenceBnW(firstImgData, secondImgData);

        const areas = camera.filterToAreas(diffPoints);
        areas.forEach((area) => {
          const red = Math.random() * 255;
          ctx.fillStyle = `rgb(${Math.random() * 50}, ${Math.random() * 255}, ${
            Math.random() * 255
          })`;
          area.forEach((p) =>
            ctx.fillRect(p.x / scale, p.y / scale, 1 / scale, 1 / scale)
          );
        });
        ctx.fillStyle = "red";
        areas
          .sort((a, b) => b.length - a.length)[0]
          .forEach((p) => {
            ctx.fillRect(p.x / scale, p.y / scale, 1 / scale, 1 / scale);
          });

        ctx.fillStyle = "green";
        ctx.fillText("Done.", 20, 60);
      });
      socket.emit("request-black");
    };
  });

  function takeFirstImg() {
    return camera.snap(scale);
  }
  function takeSecondImg() {
    return camera.snap(scale);
  }
}

async function livePatternTracker() {

  await pageLoad();

  initMasterUI();
  
  
  console.log("livePatternTracker available")
  let started = false;
  const patternDetector = new PatternDetector();
  const camera = new Camera2();
  await camera.start();

  const cameraOverlay = new CameraOverlay();
  const cameraCtx = cameraOverlay.elem.getContext("2d");

  let trackingSnap: HTMLCanvasElement;
  
  function takeSnap() {
    trackingSnap = camera.snap();
  }

    
    /**
     * Draws an overlay over the camera with all the red,blue,green pixels that were detected in
     * the detection algorithm from patternDetection.ts
     * 
     * @param canvas 
     * @param Points 
     * @param Points2 
     * @param Points3 
     */
    function drawOverlay(canvas: HTMLCanvasElement, Points: Point[], Points2: Point[], Points3: Point[]) {
      let ctx = canvas.getContext('2d');
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let data = imageData.data;
    
      Points.forEach( (point) => {
          
          for (let x = point.x - 1; x <= point.x + 1; x++) {
            for (let y = point.y - 1; y <= point.y + 1; y++) {
              const i = y * (canvas.width * 4) + x * 4;
              data[i]     = 255;     // red
              data[i + 1] = 0; // green
              data[i + 2] = 0; // blue
            }
          }
      });

      Points2.forEach( (point) => {
          
        for (let x = point.x - 1; x <= point.x + 1; x++) {
          for (let y = point.y - 1; y <= point.y + 1; y++) {
            const i = y * (canvas.width * 4) + x * 4;
            data[i]     = 0;     // red
            data[i + 1] = 255; // green
            data[i + 2] = 0; // blue
          }
        }
    });

    Points3.forEach( (point) => {
          
      for (let x = point.x - 1; x <= point.x + 1; x++) {
        for (let y = point.y - 1; y <= point.y + 1; y++) {
          const i = y * (canvas.width * 4) + x * 4;
          data[i]     = 0;     // red
          data[i + 1] = 0;     // green
          data[i + 2] = 255;   // blue
        }
      }
    });
    
    cameraCtx.putImageData(imageData, 0, 0);
      
    
    }

    /**
     * Function used to draw all the centerpoints that were found on to the camera overlay, so
     * that the user can visibly see if the centers were correctly found.
     * 
     * @param canvas 
     * @param Points 
     * @param identifierList 
     */
    function drawCenter(canvas: HTMLCanvasElement, Points: Point[], identifierList : number[]) {
      let ctx = canvas.getContext('2d');
      cameraCtx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let data = imageData.data;
    
        Points.forEach( (point) => {  
          const identifier = identifierList.slice(0,1)[0];
          for (let x = point.x - 3; x <= point.x + 3; x++) {
            for (let y = point.y - 3; y <= point.y + 3; y++) {
              const i = y * (canvas.width * 4) + x * 4;
              if (identifier == 1) {
                data[i]     = 255;     // red
                data[i + 1] = 0; // green
                data[i + 2] = 255; // blue
                data[i+3] = 255;
              } else if (identifier == 2) {
                data[i]     = 255;     // red
                data[i + 1] = 255; // green
                data[i + 2] = 0; // blue
                data[i+3] = 255;
              } else if (identifier == 3) {
                data[i]     = 0;     // red
                data[i + 1] = 255; // green
                data[i + 2] = 255; // blue
                data[i+3] = 255;
              } else {
                data[i]     = 0;     // red
                data[i + 1] = 0; // green
                data[i + 2] = 0; // blue
                data[i+3] = 255;
              }
            }
          }
        });
      
    
      
      
      cameraCtx.putImageData(imageData, 0, 0);
    
    }
    
    /**
     * Function used to draw all the centerpoints that were found on to the camera overlay, so
     * that the user can visibly see if the centers were correctly found.
     * 
     * @param canvas 
     * @param Points 
     */
    function drawCenterWithoutIdentifiers(canvas: HTMLCanvasElement, Points: Point[]) {
      let ctx = canvas.getContext('2d');
      cameraCtx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let data = imageData.data;
    
        Points.forEach( (point) => {  
          for (let x = point.x - 3; x <= point.x + 3; x++) {
            for (let y = point.y - 3; y <= point.y + 3; y++) {
                const i = y * (canvas.width * 4) + x * 4;
                data[i]     = 0;     // red
                data[i + 1] = 0; // green
                data[i + 2] = 0; // blue
                data[i+3] = 255;
              }
          }
        });
      
      
      cameraCtx.putImageData(imageData, 0, 0);
    
    }

  /**
   * All the pattern detection magic happens here after the button is pressed
   */
  document.getElementById("confirmButton").onclick = () => {
      if (!started) {
        started = true;
        console.log("button pressed")
        setInterval(startDetection, 350);
        function startDetection() {
          takeSnap();
          const Result = patternDetector.detect(trackingSnap, similarPatternColorRange, similarPatternColorRange, similarPatternColorRange, patternAccuracy);
          //drawOverlay(trackingSnap, Result.detectedPoints1, Result.detectedPoints2, Result.detectedPoints3);
          const Result2 = patternDetector.calculateCenter(Result.detectedPoints1, Result.detectedPoints2, Result.detectedPoints3, patternRange, patternAccuracy);
          //const Result3 = patternDetector.getCornerIdentifier(trackingSnap, Result2.centeredPoints,  identifierColorRange);
          //drawCenter(new CameraOverlay().elem, Result2.centeredPoints, Result3.identifierList);
          drawCenterWithoutIdentifiers(new CameraOverlay().elem, Result2.centeredPoints);
        }
      }
      else {
        started = false;  
      }
      
    }
  

}
/**
 * Initialize the pattern tracking
 */
livePatternTracker();
