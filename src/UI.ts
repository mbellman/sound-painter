import Canvas from './Canvas';

export default class UI {
  private bufferCanvas: Canvas;
  private uiCanvas: Canvas;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.bufferCanvas = new Canvas(window.innerWidth, window.innerHeight);
    this.uiCanvas = new Canvas(window.innerWidth, window.innerHeight);

    document.body.appendChild(this.uiCanvas.getElement());
  }
}