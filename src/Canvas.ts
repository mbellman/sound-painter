export default class Canvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(width: number = 640, height: number = 480) {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');

    this.resize(width, height);
  }

  public circle(color: string, x: number, y: number, radius: number): void {
    this.ctx.fillStyle = color;

    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, 2.0 * Math.PI);
    this.ctx.fill();
  }

  public clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public getElement(): Readonly<HTMLCanvasElement> {
    return this.canvas;
  }

  public rectangle(color: string, x: number, y: number, width: number, height: number): void {
    this.ctx.fillStyle = color;

    this.ctx.fillRect(x, y, width, height);
  }

  public resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }
}