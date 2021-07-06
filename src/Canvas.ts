export default class Canvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(width: number = 640, height: number = 480) {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');

    this.resize(width, height);
  }

  public get height(): number {
    return this.canvas.height;
  }

  public get width(): number {
    return this.canvas.width;
  }

  public blit(canvas: Canvas, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number): void {
    canvas.ctx.drawImage(this.canvas, sx, sy, sw, sh, dx, dy, dw, dh);
  }

  public circle(color: string, x: number, y: number, radius: number): void {
    this.ctx.fillStyle = color;

    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, 2.0 * Math.PI);
    this.ctx.fill();
  }

  public clear(x: number = 0, y: number = 0, width: number = this.canvas.width, height: number = this.canvas.height): void {
    this.ctx.clearRect(x, y, width, height);
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