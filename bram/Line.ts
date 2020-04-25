import Point from "./Point";

export default class Line {
  a: Point;
  b: Point;

  constructor(a: Point, b: Point) {
    this.a = a;
    this.b = b;
  }

  get middlePoint() {
    return new Point((this.a.x + this.b.x) / 2, (this.a.y + this.b.y) / 2);
  }

  get endPoints() {
    return [this.a, this.b];
  }

  get length() {
    return Math.sqrt(
      Math.pow(this.b.x - this.a.x, 2) + Math.pow(this.b.y - this.a.y, 2)
    );
  }

  get rico() {
    return (
      (this.endPoints[1].y - this.endPoints[0].y) /
      (this.endPoints[1].x - this.endPoints[0].x)
    );
  }

  copy() {
    return new Line(this.a.copy(), this.b.copy());
  }

  /**
   * Will return an angle between 0 and 179 deg.
   */
  angleBetweenEndpoints(aroundMostRight?: boolean): number {
    const sorted = this.endPoints.sort((a, b) =>
      aroundMostRight ? b.x - a.x : a.x - b.x
    );
    const a = sorted[0];
    const b = sorted[1];
    const angle = (Math.atan2(b.x - a.x, b.y - a.y) * 180) / Math.PI;
    if (angle === 180) {
      return 0;
    }
    return angle;
  }

  lineAbove(line: Line, index: number) {
    let sameEndPoint;
    let otherPoint;
    if (line.endPoints[0] == this.endPoints[index]) {
      sameEndPoint = line.endPoints[0];
      otherPoint = line.endPoints[1];
    } else {
      sameEndPoint = line.endPoints[1];
      otherPoint = line.endPoints[0];
    }
    let rico =
      (this.endPoints[1].y - this.endPoints[0].y) /
      (this.endPoints[1].x - this.endPoints[0].x);
    if (
      this.endPoints[index].y +
        rico * (otherPoint.x - this.endPoints[index].x) <
      otherPoint.y
    ) {
      return true;
    } else {
      return false;
    }
  }

  /**
   *
   * @param line2
   * @param index 0 is counterclockwise and 1 is clockwise.
   */
  angle(line2: Line, index: number) {
    let points1 = this.endPoints;
    let points2 = line2.endPoints;
    //overlap
    let points = [];
    let over;
    if (points1[0] != points2[0] && points1[0] != points2[1]) {
      points.push(points1[0]);
      over = points1[1];
    } else {
      points.push(points1[1]);
      over = points1[0];
    }

    if (points2[0] != points1[0] && points2[0] != points1[1]) {
      points.push(points2[0]);
    } else {
      points.push(points2[1]);
    }

    let theta =
      ((Math.atan2(points[1].y - over.y, points[1].x - over.x) -
        Math.atan2(points[0].y - over.y, points[0].x - over.x)) *
        180) /
      Math.PI;

    if (index == 0) {
      if (theta < 0) {
        theta = 360 + theta;
      }
    } else {
      if (theta > 0) {
        theta = 360 - theta;
      } else {
        theta *= -1;
      }
    }

    return theta;
  }

  equals(line: Line) {
    if (this.a.equals(line.a) && this.b.equals(line.b)) return true;
    if (this.a.equals(line.b) && this.b.equals(line.a)) return true;
    return false;
  }
}
