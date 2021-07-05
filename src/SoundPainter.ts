import Canvas from './Canvas';
import Analyser from './audio/Analyser';
import AudioCore from './audio/AudioCore';
import AudioFile from './audio/AudioFile';
import { clamp } from './utilities';

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

    this.visibleCanvas.clear();

    const notes = new Array(88);

    notes.fill(0);

    for (let i = 0; i < data.length; i++) {
      const frequency = i / data.length * AudioCore.SAMPLE_RATE;
      const note = Math.round(12 * Math.log2(frequency / 440));
      const index = clamp(note, 0, 87);

      notes[index] = data[i];// notes[index] > 0 ? (notes[index] + data[i]) / 2.0 : data[i];
    }

    for (let i = 0; i < notes.length; i++) {
      const height = window.innerHeight / notes.length;
      const y = (notes.length - i - 1) * height;
      const x = Math.floor(400 * (1.0 - notes[i] / 256)) + (window.innerWidth - 400);
      const width = window.innerWidth - x;

      this.visibleCanvas.rectangle('#fa0', x, y, width, height);
    }
  }

  private updateCanvasSizes(): void {
    this.bufferCanvas.resize(window.innerWidth + this.extraBufferWidth, window.innerHeight);
    this.visibleCanvas.resize(window.innerWidth, window.innerHeight);
  }
}