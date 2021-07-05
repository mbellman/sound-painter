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

  private getNoteColor(note: number, loudness: number): string {
    const tone = note / 88;
    const volume = loudness / 255;

    let r = Math.sin(tone * Math.PI * 3);
    let g = Math.sin(0.5 * Math.PI + tone * Math.PI * 3);
    let b = Math.sin(Math.PI + tone * Math.PI * 3);

    r = Math.round(clamp(r * 255, 0, 255) * volume);
    g = Math.round(clamp(g * 255, 0, 255) * volume);
    b = Math.round(clamp(b * 255, 0, 255) * volume);

    let rHex = Number.isNaN(r) ? '0' : r.toString(16);
    let gHex = Number.isNaN(g) ? '0' : g.toString(16);
    let bHex = Number.isNaN(b) ? '0' : b.toString(16);

    rHex = rHex.length === 1 ? `0${rHex}` : rHex;
    gHex = gHex.length === 1 ? `0${gHex}` : gHex;
    bHex = bHex.length === 1 ? `0${bHex}` : bHex;

    return `#${rHex}${gHex}${bHex}`;
  }

  private onWindowResize(): void {
    this.updateCanvasSizes();
  }

  private render(): void {
    this.analyser.refreshData();

    const data = this.analyser.getData();

    // this.visibleCanvas.clear();

    const notes = new Array(88);

    notes.fill(0);

    for (let i = 0; i < data.length; i++) {
      const frequency = i / data.length * AudioCore.SAMPLE_RATE * 0.5;
      const key = Math.round(12 * Math.log2(frequency / 440));
      const index = clamp(key, 0, 87);

      if (key >= 0 && key <= 87) {
        notes[index] = data[i];
      }
    }

    const highestNote = Math.max(...notes);

    for (let i = 0; i < notes.length; i++) {
      notes[i] *= Math.pow(notes[i] / highestNote, 2);
      notes[i] *= clamp(0.2 + i / notes.length, 0, 1);
    }

    for (let i = 0; i < notes.length; i++) {
      const height = window.innerHeight / notes.length;
      const y = (notes.length - i - 1) * height;
      const brightness = Math.round(255 * notes[i] / 255);
      const color = this.getNoteColor(i, notes[i]);

      this.visibleCanvas.circle(color, this.currentXOffset, y, Math.round(brightness / 10));
    }

    this.currentXOffset += 10;

    if (this.currentXOffset > window.innerWidth) {
      this.currentXOffset = 0;
    }
  }

  private updateCanvasSizes(): void {
    this.bufferCanvas.resize(window.innerWidth + this.extraBufferWidth, window.innerHeight);
    this.visibleCanvas.resize(window.innerWidth, window.innerHeight);
  }
}