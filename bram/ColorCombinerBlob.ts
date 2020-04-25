import Point from "./Point";
import { IHSLColor } from "./GEEN_PYTHON";

export class ColorCombinerBlob {
  topLeft: Point;
  bottomRight: Point;

  maxPixelRange: number;

  points: Point[] = [];
  color: IHSLColor;

  private totalH = 0;
  private totalS = 0;
  private totalL = 0;

  constructor(initialPoint: Point, color: IHSLColor, maxPixelRange: number) {
    this.add(initialPoint, color);
    this.maxPixelRange = maxPixelRange;
  }

  get width(): number {
    return this.bottomRight.x - this.topLeft.x;
  }

  get height(): number {
    return this.bottomRight.y - this.topLeft.y;
  }

  get area(): number {
    return this.width * this.height;
  }

  get center(): Point {
    return new Point(
      this.topLeft.x + this.width / 2,
      this.topLeft.y + this.height / 2
    );
  }

  contains(point: Point) {
    return (
      this.topLeft.x <= point.x &&
      point.x <= this.topLeft.x + this.width &&
      this.topLeft.y <= point.y &&
      point.y <= this.topLeft.y + this.height
    );
  }

  draw(ctx: CanvasRenderingContext2D, id: string) {
    const color = this.color;

    ctx.fillStyle = `hsl(${color.h}, ${color.s}%, ${color.l}%)`;
    ctx.fillRect(this.topLeft.x, this.topLeft.y, this.width, this.height);
    ctx.fill();
  }

  isCloseEnough(point: Point): boolean {
    const minX = this.topLeft.x;
    const minY = this.topLeft.y;
    const maxX = this.bottomRight.x;
    const maxY = this.bottomRight.y;

    const clampedPoint = new Point(
      Math.max(Math.min(point.x, maxX), minX),
      Math.max(Math.min(point.y, maxY), minY)
    );

    return (
      point.distanceSq(clampedPoint) <= this.maxPixelRange * this.maxPixelRange
    );
  }

  add(point: Point, color: IHSLColor) {
    const minX = Math.min(point.x, this.topLeft?.x || Number.POSITIVE_INFINITY);
    const maxX = Math.max(
      point.x,
      this.bottomRight?.x || Number.NEGATIVE_INFINITY
    );
    const minY = Math.min(point.y, this.topLeft?.y || Number.POSITIVE_INFINITY);
    const maxY = Math.max(
      point.y,
      this.bottomRight?.y || Number.NEGATIVE_INFINITY
    );
    this.topLeft = new Point(minX, minY);
    this.bottomRight = new Point(maxX, maxY);

    this.points.push(point);
    this.totalH += color.h;
    this.totalS += color.s;
    this.totalL += color.l;

    const pointAmt = this.points.length;
    this.color = {
      h: this.totalH / pointAmt,
      s: this.totalS / pointAmt,
      l: this.totalL / pointAmt,
    };
  }

  overlap(blob: ColorCombinerBlob) {
    return !(
      blob.topLeft.x > this.bottomRight.x ||
      blob.bottomRight.x < this.topLeft.x ||
      blob.topLeft.y > this.bottomRight.y ||
      blob.bottomRight.y < this.topLeft.y
    );
  }
}
