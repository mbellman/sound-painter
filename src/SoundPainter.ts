import Canvas from './Canvas';
import Analyser from './audio/Analyser';
import AudioFile from './audio/AudioFile';

export default class SoundPainter {
  private audio: AudioFile = null;
  private analyser: Analyser;
  private bufferCanvas: Canvas;
  private visibleCanvas: Canvas;
  private currentXOffset: number = 0;
  private extraBufferWidth: number = 100;

  constructor() {
    this.analyser = new Analyser();
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

    this.audio.connect(this.analyser.getNode()).play();

    setInterval(() => {
      this.render();
    }, 100);
  }

  private onWindowResize(): void {
    this.updateCanvasSizes();
  }

  private render(): void {
    this.analyser.refreshData();

    const data = this.analyser.getData();

    console.log(data);

    for (let i = 0; i < data.length; i++) {
      // @todo
    }
  }

  private updateCanvasSizes(): void {
    this.bufferCanvas.resize(window.innerWidth + this.extraBufferWidth, window.innerHeight);
    this.visibleCanvas.resize(window.innerWidth, window.innerHeight);
  }
}