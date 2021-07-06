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
  private renderInterval: number = null;

  constructor() {
    this.analyser = new Analyser();
    this.bufferCanvas = new Canvas();
    this.visibleCanvas = new Canvas();

    this.updateCanvasSizes();

    window.addEventListener('resize', () => this.onWindowResize());
    window.addEventListener('dragover', e => e.preventDefault());
    window.addEventListener('drop', e => this.onFileDrop(e));

    document.body.appendChild(this.visibleCanvas.getElement());
  }

  public play(audioFile: AudioFile): void {
    if (this.audio) {
      this.audio.stop();
    }

    this.audio = audioFile;
    this.currentXOffset = 0;

    window.clearInterval(this.renderInterval);
    this.audio.connect(this.analyser.getNode()).play();
    this.visibleCanvas.clear();

    this.renderInterval = window.setInterval(() => this.render(), 20);
  }

  private getNoteColor(note: number, loudness: number): string {
    const tone = note / 108;
    const volume = clamp(loudness / 255, 0.3, 1);

    let r = Math.sin(3 * tone * Math.PI);
    let g = Math.sin(3 * tone * Math.PI + 0.5 * Math.PI);
    let b = Math.sin(3 * tone * Math.PI + 1.3 * Math.PI);

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

  private async fileToBlob(file: File): Promise<Blob> {
    return new Promise(resolve => {
      const reader = new FileReader();

      reader.addEventListener('loadend', () => {
        const [ header, data ] = (reader.result as string).split(';base64,');
        const decodedData = window.atob(data);
        const decodedBytes: number[] = new Array(decodedData.length);
    
        for (let i = 0; i < decodedBytes.length; i++) {
          decodedBytes[i] = decodedData.charCodeAt(i);
        }
    
        const blob = new Blob([new Uint8Array(decodedBytes)], {
          type: file.type
        });

        resolve(blob);
      });

      reader.readAsDataURL(file);
    });
  }

  private async onFileDrop(e: DragEvent): Promise<void> {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.items[0].getAsFile();
    const blob = await this.fileToBlob(file);
    const url = URL.createObjectURL(blob);

    this.play(new AudioFile(url));

    URL.revokeObjectURL(url);
  }

  private onWindowResize(): void {
    this.updateCanvasSizes();
  }

  private render(): void {
    this.analyser.refreshData();

    const data = this.analyser.getData();

    // this.visibleCanvas.clear();

    let notes = new Array(108);

    notes.fill(0);

    for (let i = 0; i < data.length; i++) {
      const frequency = i / data.length * AudioCore.SAMPLE_RATE * 0.5;
      const key = Math.round(12 * Math.log2(frequency / 440)) + 49;
      const index = clamp(key, 0, 108);

      if (key >= 0 && key <= 108) {
        const loudnessFactor = clamp(2.0 * index / 108, 0.8, 1.5);

        notes[index] = Math.round(data[i] * loudnessFactor);
      }
    }

    const loudestNote = Math.max(...notes);

    for (let i = 0; i < notes.length; i++) {
      notes[i] = Math.round(notes[i] * Math.pow(notes[i] / loudestNote, 5));
    }

    for (let i = 0; i < notes.length; i++) {
      const height = window.innerHeight / notes.length;
      const y = (notes.length - i - 1) * height;
      const brightness = Math.round(255 * notes[i] / 255);
      const color = this.getNoteColor(i, notes[i]);

      this.visibleCanvas.circle(color, this.currentXOffset + Math.random() * 4 - 2, y + Math.random() * 4 - 2, Math.round(brightness / 15));
    }

    this.currentXOffset += 10;

    if (this.currentXOffset > window.innerWidth) {
      this.currentXOffset = 0;
      this.visibleCanvas.clear();
    }
  }

  private updateCanvasSizes(): void {
    this.bufferCanvas.resize(window.innerWidth + this.extraBufferWidth, window.innerHeight);
    this.visibleCanvas.resize(window.innerWidth, window.innerHeight);
  }
}