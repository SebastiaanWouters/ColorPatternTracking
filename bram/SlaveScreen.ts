import Point from "./Point";
import { BoundingBox, sortCorners } from "./BoundingBox";
import Line from "./Line";

export function degreesToRadians(degrees: number) {
  return degrees * (Math.PI / 180);
}

export function rotatePointAroundAnchor(
  pointToRotate: Point,
  anchorPoint: Point,
  angle: number
) {
  if (angle === 0) return pointToRotate.copy();
  angle = -angle;
  const rotatedX =
    Math.cos(degreesToRadians(angle)) * (pointToRotate.x - anchorPoint.x) -
    Math.sin(degreesToRadians(angle)) * (pointToRotate.y - anchorPoint.y) +
    anchorPoint.x;

  const rotatedY =
    Math.sin(degreesToRadians(angle)) * (pointToRotate.x - anchorPoint.x) +
    Math.cos(degreesToRadians(angle)) * (pointToRotate.y - anchorPoint.y) +
    anchorPoint.y;

  return new Point(rotatedX, rotatedY);
}

export enum CornerLabels {
  LeftUp = "Left up",
  RightUp = "Right up",
  LeftUnder = "Left under",
  RightUnder = "Right under"
}

export interface IActualCorners {
  LeftUp: Point;
  RightUp: Point;
  LeftUnder: Point;
  RightUnder: Point;
}

export interface IMasterVsActualPoint {
  master: Point;
  actual: Point;
}

export interface IPoint {
  x: number;
  y: number;
}

export default class SlaveScreen {
  corners: Point[];
  slaveID: string;
  angle: number | undefined;
  slavePortionImg: HTMLCanvasElement;
  /**
   * Corners with orientation
   */
  actualCorners: IActualCorners;
  triangulation: {
    //de lijnen die zeker moeten getekend worden
    angles: Array<{ string: string; point: Point }>;
    lines: Array<{ string: string; point1: Point; point2: Point }>;
  } = {
    angles: [],
    lines: []
  };

  constructor(corners: Point[], slaveID: string) {
    this.corners = corners;
    this.slaveID = slaveID;
  }

  get centroid(): Point {
    let sumX = 0;
    let sumY = 0;
    this.corners.forEach(point => {
      sumX += point.x;
      sumY += point.y;
    });
    return new Point(
      Math.round(sumX / this.corners.length),
      Math.round(sumY / this.corners.length)
    );
  }

  get boundingBox() {
    return new BoundingBox(this.corners);
  }

  get width(): number {
    return this.widthEdge.length;
  }

  get height(): number {
    this.sortCornersByAngle();
    const edgeA = new Line(this.corners[0], this.corners[1]);
    const edgeB = new Line(this.corners[1], this.corners[2]);
    const edgeC = new Line(this.corners[2], this.corners[3]);
    const edgeD = new Line(this.corners[3], this.corners[0]);
    const width = Math.max(
      edgeA.length,
      edgeB.length,
      edgeC.length,
      edgeD.length
    );
    if (width === edgeA.length || width === edgeC.length) {
      return Math.max(edgeB.length, edgeD.length);
    } else {
      return Math.max(edgeA.length, edgeC.length);
    }
  }

  // TODO: This should be fixed because it won't work for portrait oriented devices.
  /**
   * Edge representing the width of the screen
   */
  get widthEdge(): Line {
    // this.sortCornersByAngle();
    // const edgeA = new Line(this.corners[0], this.corners[1]);
    // const edgeB = new Line(this.corners[1], this.corners[2]);
    // const edgeC = new Line(this.corners[2], this.corners[3]);
    // const edgeD = new Line(this.corners[3], this.corners[0]);
    // const longestLength = Math.max(
    //     edgeA.length,
    //     edgeB.length,
    //     edgeC.length,
    //     edgeD.length
    // );
    // if (edgeA.length === longestLength) return edgeA;
    // if (edgeB.length === longestLength) return edgeB;
    // if (edgeC.length === longestLength) return edgeC;
    // if (edgeD.length === longestLength) return edgeD;
    const widthUp = new Line(
      this.actualCorners.LeftUp,
      this.actualCorners.RightUp
    );
    const widthUnder = new Line(
      this.actualCorners.LeftUnder,
      this.actualCorners.RightUnder
    );
    if (Math.max(widthUp.length, widthUnder.length) === widthUp.length) {
      return widthUp;
    }
    return widthUnder;
  }

  // TODO: This should be fixed because it won't work for portrait oriented devices.
  /**
   * Edge representing the height of the screen
   */
  get heightEdge(): Line {
    // this.sortCornersByAngle();
    // const edgeA = new Line(this.corners[0], this.corners[1]);
    // const edgeB = new Line(this.corners[1], this.corners[2]);
    // const edgeC = new Line(this.corners[2], this.corners[3]);
    // const edgeD = new Line(this.corners[3], this.corners[0]);
    // const width = Math.max(
    //     edgeA.length,
    //     edgeB.length,
    //     edgeC.length,
    //     edgeD.length
    // );
    // if (width === edgeA.length || width === edgeC.length) {
    //     const longestLength = Math.max(edgeB.length, edgeD.length);
    //     if (longestLength === edgeB.length) return edgeB;
    //     if (longestLength === edgeD.length) return edgeD;
    // } else {
    //     const longestLength = Math.max(edgeA.length, edgeC.length);
    //     if (longestLength === edgeA.length) return edgeA;
    //     if (longestLength === edgeC.length) return edgeC;
    // }
    const heightLeft = new Line(
      this.actualCorners.LeftUp,
      this.actualCorners.LeftUnder
    );
    const heightRight = new Line(
      this.actualCorners.RightUp,
      this.actualCorners.RightUnder
    );
    if (Math.max(heightLeft.length, heightRight.length) === heightLeft.length) {
      return heightLeft;
    }
    return heightRight;
  }

  get topLeftCorner(): Point {
    const corners = [...this.corners];
    corners.sort((a, b) => a.y - b.y);
    if (corners[0].x < corners[1].x) {
      return corners[0];
    } else {
      return corners[1];
    }
  }

  get sortedCorners(): {
    LeftUp: Point;
    RightUp: Point;
    RightUnder: Point;
    LeftUnder: Point;
  } {
    return sortCorners(this.corners);
  }

  /**
   * Corners without orientation
   */
  public sortCornersByAngle() {
    const center = this.centroid;
    // Sorting by https://math.stackexchange.com/questions/978642/how-to-sort-vertices-of-a-polygon-in-counter-clockwise-order
    this.corners.sort((a, b) => {
      const a1 =
        (Math.atan2(a.x - center.x, a.y - center.y) * (180 / Math.PI) + 360) %
        360;
      const a2 =
        (Math.atan2(b.x - center.x, b.y - center.y) * (180 / Math.PI) + 360) %
        360;
      return a1 - a2;
    });
  }

  /**
   * Should only be called after `this.masterVsRealCorners` is assigned.
   * @param corner
   */
  public mapMasterToActualCornerLabel(corner: CornerLabels): CornerLabels {
    const sortedCorners = this.sortedCorners;

    switch (corner) {
      case CornerLabels.LeftUp:
        if (sortedCorners.LeftUp.equals(this.actualCorners.LeftUp)) {
          return CornerLabels.LeftUp;
        } else if (sortedCorners.LeftUp.equals(this.actualCorners.RightUp)) {
          return CornerLabels.RightUp;
        } else if (sortedCorners.LeftUp.equals(this.actualCorners.RightUnder)) {
          return CornerLabels.RightUnder;
        } else {
          return CornerLabels.LeftUnder;
        }
      case CornerLabels.RightUp:
        if (sortedCorners.RightUp.equals(this.actualCorners.LeftUp)) {
          return CornerLabels.LeftUp;
        } else if (sortedCorners.RightUp.equals(this.actualCorners.RightUp)) {
          return CornerLabels.RightUp;
        } else if (
          sortedCorners.RightUp.equals(this.actualCorners.RightUnder)
        ) {
          return CornerLabels.RightUnder;
        } else {
          return CornerLabels.LeftUnder;
        }
      case CornerLabels.RightUnder:
        if (sortedCorners.RightUnder.equals(this.actualCorners.LeftUp)) {
          return CornerLabels.LeftUp;
        } else if (
          sortedCorners.RightUnder.equals(this.actualCorners.RightUp)
        ) {
          return CornerLabels.RightUp;
        } else if (
          sortedCorners.RightUnder.equals(this.actualCorners.RightUnder)
        ) {
          return CornerLabels.RightUnder;
        } else {
          return CornerLabels.LeftUnder;
        }
      case CornerLabels.LeftUnder:
        if (sortedCorners.LeftUnder.equals(this.actualCorners.LeftUp)) {
          return CornerLabels.LeftUp;
        } else if (sortedCorners.LeftUnder.equals(this.actualCorners.RightUp)) {
          return CornerLabels.RightUp;
        } else if (
          sortedCorners.LeftUnder.equals(this.actualCorners.RightUnder)
        ) {
          return CornerLabels.RightUnder;
        } else {
          return CornerLabels.LeftUnder;
        }
      default:
        return corner;
    }
  }

  /**
   * Should only be called after `this.masterVsRealCorners` is assigned.
   * @param corner
   */
  public mapActualToMasterCornerLabel(corner: CornerLabels): CornerLabels {
    const sortedCorners = this.sortedCorners;

    switch (corner) {
      case CornerLabels.LeftUp:
        if (this.actualCorners.LeftUp.equals(sortedCorners.LeftUp)) {
          return CornerLabels.LeftUp;
        } else if (this.actualCorners.LeftUp.equals(sortedCorners.RightUp)) {
          return CornerLabels.RightUp;
        } else if (this.actualCorners.LeftUp.equals(sortedCorners.RightUnder)) {
          return CornerLabels.RightUnder;
        } else {
          return CornerLabels.LeftUnder;
        }
      case CornerLabels.RightUp:
        if (this.actualCorners.RightUp.equals(sortedCorners.LeftUp)) {
          return CornerLabels.LeftUp;
        } else if (this.actualCorners.RightUp.equals(sortedCorners.RightUp)) {
          return CornerLabels.RightUp;
        } else if (
          this.actualCorners.RightUp.equals(sortedCorners.RightUnder)
        ) {
          return CornerLabels.RightUnder;
        } else {
          return CornerLabels.LeftUnder;
        }
      case CornerLabels.RightUnder:
        if (this.actualCorners.RightUnder.equals(sortedCorners.LeftUp)) {
          return CornerLabels.LeftUp;
        } else if (
          this.actualCorners.RightUnder.equals(sortedCorners.RightUp)
        ) {
          return CornerLabels.RightUp;
        } else if (
          this.actualCorners.RightUnder.equals(sortedCorners.RightUnder)
        ) {
          return CornerLabels.RightUnder;
        } else {
          return CornerLabels.LeftUnder;
        }
      case CornerLabels.LeftUnder:
        if (this.actualCorners.LeftUnder.equals(sortedCorners.LeftUp)) {
          return CornerLabels.LeftUp;
        } else if (this.actualCorners.LeftUnder.equals(sortedCorners.RightUp)) {
          return CornerLabels.RightUp;
        } else if (
          this.actualCorners.LeftUnder.equals(sortedCorners.RightUnder)
        ) {
          return CornerLabels.RightUnder;
        } else {
          return CornerLabels.LeftUnder;
        }
      default:
        return corner;
    }
  }

  public copy(): SlaveScreen {
    const screen = new SlaveScreen(
      this.corners.map(corner => corner.copy()),
      this.slaveID
    );
    screen.slavePortionImg = this.slavePortionImg;
    return screen;
  }

  public copyRotated(deg: number): SlaveScreen {
    const screen = new SlaveScreen(
      this.corners.map(corner =>
        rotatePointAroundAnchor(corner.copy(), this.centroid, deg)
      ),
      this.slaveID
    );
    screen.slavePortionImg = this.slavePortionImg;
    return screen;
  }

  public copyTranslated(dx: number, dy: number): SlaveScreen {
    const screen = new SlaveScreen(
      this.corners.map(corner => corner.copyTranslated(dx, dy)),
      this.slaveID
    );
    screen.slavePortionImg = this.slavePortionImg;
    return screen;
  }

  /**
   * Copies the screen and moves it as close as possible to (0, 0) while keeping all coordinates positive.
   */
  public copyAndMoveAsCloseToOriginAsPossible(): SlaveScreen {
    const corners = [...this.corners];
    const moveY = corners.sort((a, b) => a.y - b.y)[0].y;
    const moveX = corners.sort((a, b) => a.x - b.x)[0].x;
    corners.forEach(corner => {
      corner.x -= moveX;
      corner.y -= moveY;
    });

    const screen = new SlaveScreen(corners, this.slaveID);
    screen.slavePortionImg = this.slavePortionImg;
    return screen;
  }
}
