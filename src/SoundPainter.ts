import Canvas from './Canvas';
import Analyser from './audio/Analyser';
import AudioCore from './audio/AudioCore';
import AudioFile from './audio/AudioFile';
import { clamp, mod } from './utilities';

export default class SoundPainter {
  private static readonly TOTAL_NOTES: number = 108;
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

  /**
   * Converts analyser frequency data, represented as [0 - 255] decibel
   * levels at various frequencies, to notes, represented as normalized
   * [0.0 - 1.0] volumes at various musical keys.
   */
  private createNotes(): number[] {
    this.analyser.refreshData();

    const analyserData = this.analyser.getData();
    let notes = new Array(SoundPainter.TOTAL_NOTES);

    notes.fill(0);

    // Map frequencies to notes
    for (let i = 0; i < analyserData.length; i++) {
      const frequency = i / analyserData.length * AudioCore.SAMPLE_RATE * 0.5;
      const key = Math.round(12 * Math.log2(frequency / 440)) + 49;

      if (key >= 0 && key < SoundPainter.TOTAL_NOTES) {
        // Bias higher keys as being equivalently 'louder'
        // to counteract intrinsically louder lower frequencies
        const loudnessFactor = clamp(2.0 * key / SoundPainter.TOTAL_NOTES, 0.8, 1.5);

        notes[key] = (analyserData[i] / 255) * loudnessFactor;
      }
    }

    const loudestNote = Math.max(...notes);

    // De-emphasize quieter notes to suppress noise artifacts
    for (let i = 0; i < notes.length; i++) {
      notes[i] *= Math.pow(notes[i] / loudestNote, 5);
    }

    return notes;
  }

  private getKeyColor(key: number, loudness: number): string {
    const tone = key / SoundPainter.TOTAL_NOTES;

    let r = Math.sin(3 * tone * Math.PI);
    let g = Math.sin(3 * tone * Math.PI + 0.5 * Math.PI);
    let b = Math.sin(3 * tone * Math.PI + 1.3 * Math.PI);

    r = Math.round(clamp(r * 255, 0, 255) * loudness);
    g = Math.round(clamp(g * 255, 0, 255) * loudness);
    b = Math.round(clamp(b * 255, 0, 255) * loudness);

    let rHex = Number.isNaN(r) ? '0' : r.toString(16);
    let gHex = Number.isNaN(g) ? '0' : g.toString(16);
    let bHex = Number.isNaN(b) ? '0' : b.toString(16);

    rHex = rHex.length === 1 ? `0${rHex}` : rHex;
    gHex = gHex.length === 1 ? `0${gHex}` : gHex;
    bHex = bHex.length === 1 ? `0${bHex}` : bHex;

    return `#${rHex}${gHex}${bHex}`;
  }

  /**
   * @todo move elsewhere
   */
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

  /**
   * @todo use requestAnimationFrame()
   */
  private render(): void {
    const notes = this.createNotes();

    const noteHeight = window.innerHeight / notes.length;

    for (let i = 0; i < notes.length; i++) {
      const y = (notes.length - i - 1) * noteHeight;
      const brightness = Math.round(255 * notes[i]);
      const color = this.getKeyColor(i, notes[i]);
      const xDrift = Math.random() * 4 - 2;
      const yDrift = Math.random() * 4 - 2;
      const radius = Math.round(brightness / 15);

      this.bufferCanvas.circle(color, this.currentXOffset + xDrift, y + yDrift, radius);
    }

    this.currentXOffset += 10;

    if (this.currentXOffset > this.bufferCanvas.getElement().width) {
      this.currentXOffset = 0;
    }

    this.visibleCanvas.clear();

    // @todo description
    const visibleWidth = Math.round(this.visibleCanvas.getElement().width * 0.75);
    const visibleHeight = this.visibleCanvas.getElement().height;
    const sx = Math.max(this.currentXOffset - visibleWidth, 0);
    const sw = Math.min(this.currentXOffset, visibleWidth);
    const dx = Math.max(visibleWidth - this.currentXOffset, 0);
    const dw = visibleWidth - dx;

    this.bufferCanvas.clear(
      mod(this.currentXOffset - visibleWidth - 5, this.bufferCanvas.getElement().width), 0,
      15, this.bufferCanvas.getElement().height
    );

    this.bufferCanvas.blit(
      this.visibleCanvas,
      sx, 0, sw, visibleHeight,
      dx, 0, dw, visibleHeight
    );

    // @todo blit wrapped buffer canvas to fill in remaining space
  }

  private updateCanvasSizes(): void {
    this.bufferCanvas.resize(window.innerWidth + this.extraBufferWidth, window.innerHeight);
    this.visibleCanvas.resize(window.innerWidth, window.innerHeight);
  }
}