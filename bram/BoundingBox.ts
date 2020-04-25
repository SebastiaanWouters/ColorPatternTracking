import SlaveScreen, { rotatePointAroundAnchor } from "./SlaveScreen";
import Point from "./Point";

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
    RightUnder
  };
}

export function calculateBoundingBox(
  points: Point[]
): { topLeft: Point; topRight: Point; bottomLeft: Point; bottomRight: Point } {
  const xCoordinates = points.map(point => point.x).sort((a, b) => a - b);
  const yCoordinates = points.map(point => point.y).sort((a, b) => a - b);
  const minX = xCoordinates[0];
  const maxX = xCoordinates[xCoordinates.length - 1];
  const minY = yCoordinates[0];
  const maxY = yCoordinates[yCoordinates.length - 1];
  const res = sortCorners([
    new Point(minX, minY),
    new Point(maxX, maxY),
    new Point(maxX, minY),
    new Point(minX, maxY)
  ]);
  return {
    topLeft: res.LeftUp,
    topRight: res.RightUp,
    bottomLeft: res.LeftUnder,
    bottomRight: res.RightUnder
  };
}

export class BoundingBox {
  private _topLeft: Point;
  private _topRight: Point;
  private _bottomLeft: Point;
  private _bottomRight: Point;

  get topLeft() {
    return this._topLeft;
  }
  get topRight() {
    return this._topRight;
  }
  get bottomLeft() {
    return this._bottomLeft;
  }
  get bottomRight() {
    return this._bottomRight;
  }
  get width() {
    return this._topRight.x - this._topLeft.x;
  }
  get height() {
    return this._bottomRight.y - this._topRight.y;
  }

  get points() {
    return [this.topLeft, this.topRight, this.bottomLeft, this.bottomRight];
  }

  get centroid(): Point {
    let sumX = 0;
    let sumY = 0;
    this.points.forEach(point => {
      sumX += point.x;
      sumY += point.y;
    });
    return new Point(
      Math.round(sumX / this.points.length),
      Math.round(sumY / this.points.length)
    );
  }

  constructor(points: Point[]) {
    const box = calculateBoundingBox(points);
    this._topLeft = box.topLeft;
    this._topRight = box.topRight;
    this._bottomLeft = box.bottomLeft;
    this._bottomRight = box.bottomRight;
  }

  copyRotated(deg: number) {
    return new BoundingBox(
      this.points.map(point =>
        rotatePointAroundAnchor(new Point(point.x, point.y), this.centroid, deg)
      )
    );
  }
}

export class BoudingBoxOfSlaveScreens {
  private _screens: SlaveScreen[] = [];
  private _topLeft: Point;
  private _topRight: Point;
  private _bottomLeft: Point;
  private _bottomRight: Point;

  get screens() {
    return this._screens;
  }
  get topLeft() {
    return this._topLeft;
  }
  get topRight() {
    return this._topRight;
  }
  get bottomLeft() {
    return this._bottomLeft;
  }
  get bottomRight() {
    return this._bottomRight;
  }
  get width() {
    return this._topRight.x - this._topLeft.x;
  }
  get height() {
    return this._bottomRight.y - this._topRight.y;
  }

  constructor(slaveScreens: SlaveScreen[]) {
    let points: Point[] = [];
    slaveScreens.forEach(screen => {
      const newPoints: Point[] = screen.corners.map(corner => corner.copy());
      this._screens.push(screen.copy());
      points.push(...newPoints);
    });
    const box = calculateBoundingBox(points);
    this._topLeft = box.topLeft;
    this._topRight = box.topRight;
    this._bottomLeft = box.bottomLeft;
    this._bottomRight = box.bottomRight;
  }

  scale(factor: number) {
    this._topLeft.x = this._topLeft.x * factor;
    this._topLeft.y = this._topLeft.y * factor;
    this._topRight.x = this._topRight.x * factor;
    this._topRight.y = this._topRight.y * factor;
    this._bottomLeft.x = this._bottomLeft.x * factor;
    this._bottomLeft.y = this._bottomLeft.y * factor;
    this._bottomRight.x = this._bottomRight.x * factor;
    this._bottomRight.y = this._bottomRight.y * factor;
    this._screens.forEach(screen => {
      screen.corners.forEach(corner => {
        corner.x = corner.x * factor;
        corner.y = corner.y * factor;
      });
    });
  }
}
