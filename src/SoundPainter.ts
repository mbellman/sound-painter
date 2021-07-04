import Canvas from './Canvas';
import AudioFile from './AudioFile';

export default class SoundPainter {
  private audio: AudioFile = null;
  private bufferCanvas: Canvas;
  private visibleCanvas: Canvas;
  private currentXOffset: number = 0;
  private extraBufferWidth: number = 100;

  constructor() {
    this.bufferCanvas = new Canvas();
    this.visibleCanvas = new Canvas();

    this.updateCanvasSizes();

    window.addEventListener('resize', () => this.onWindowResize());
    document.body.appendChild(this.visibleCanvas.getElement());
  }

  public play(audioFile: AudioFile): void {
    if (this.audio) {
      this.audio.stop();
    }

    this.audio = audioFile;

    this.audio.play();
  }

  private onWindowResize(): void {
    this.updateCanvasSizes();
  }

  private updateCanvasSizes(): void {
    this.bufferCanvas.resize(window.innerWidth + this.extraBufferWidth, window.innerHeight);
    this.visibleCanvas.resize(window.innerWidth, window.innerHeight);
  }
}