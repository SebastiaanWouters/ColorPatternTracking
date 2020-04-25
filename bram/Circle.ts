import Point from "./Point";
import convert from "color-convert";
import { Rectangle } from "./Rectangle";

export class DetectCircle {
  center: Point;
  radius: number;
  votes: number;

  get x() {
    return this.center.x;
  }
  get y() {
    return this.center.y;
  }
  get r() {
    return this.radius;
  }
  set x(x: number) {
    this.center = new Point(x, this.center.y);
  }
  set y(y: number) {
    this.center = new Point(this.center.x, y);
  }

  constructor(center: Point, radius: number, votes: number) {
    this.center = center;
    this.radius = radius;
    this.votes = votes;
  }

  copy() {
    return new DetectCircle(this.center.copy(), this.radius, this.votes);
  }

  box(): Rectangle {
    const x = this.x - this.r;
    const y = this.y - this.r;
    const size = this.r * 2;
    return new Rectangle(x, y, size, size);
  }

  isIn(p: Point) {
    return p.distanceSq(this.center) < this.radius * this.radius;
  }

  canBeCorner(imageData: ImageData) {
    const pixels = imageData.data;

    function hueAt(x: number, y: number) {
      const i = y * (imageData.width * 4) + x * 4;
      return convert.rgb.hsl.raw([pixels[i], pixels[i + 1], pixels[i + 2]])[0];
    }

    const searchDist = this.radius;
    let totalHue = 0;

    for (let y = this.y - searchDist; y < this.y + searchDist; y++) {
      for (let x = this.x - searchDist; x < this.x + searchDist; x++) {
        const hue = hueAt(x, y);
        if (hue >= 180 && hue <= 270) {
          totalHue++;
        }
      }
    }

    return totalHue > this.radius * 0.25;
  }

  overlapPercentage(circle: DetectCircle) {
    const radSumSq = (this.r + circle.r) * (this.r + circle.r);
    const distSq = this.center.distanceSq(circle.center);

    return 1 - distSq / radSumSq;
  }

  isCloseEnough(circle: DetectCircle) {
    return this.overlapPercentage(circle) > 0.5;
  }

  merge(circle: DetectCircle) {
    this.center = new Point((this.x + circle.x) / 2, (this.y + circle.y) / 2);
    this.radius = (this.r + circle.r) / 2;
    this.votes += circle.votes;
  }

  isTopLeft(imageData: ImageData) {
    const pixels = imageData.data;

    function hueAt(x: number, y: number) {
      const i = y * (imageData.width * 4) + x * 4;
      return convert.rgb.hsl.raw([pixels[i], pixels[i + 1], pixels[i + 2]])[0];
    }

    const searchDist = this.radius;
    for (let y = this.y - searchDist; y < this.y + searchDist; y++) {
      for (let x = this.x - searchDist; x < this.x + searchDist; x++) {
        const hue = hueAt(x, y);
        if (hue >= 170 && hue <= 280) {
          return true;
        }
      }
    }
    return false;
  }
}
