import Canvas from './Canvas';
import Analyser from './audio/Analyser';
import AudioCore from './audio/AudioCore';
import AudioFile from './audio/AudioFile';
import Slider from './ui/Slider';
import { clamp, mod } from './utilities';

export default class SoundPainter {
  private static readonly TOTAL_NOTES: number = 108;
  private static readonly MOVEMENT_SPEED: number = 5;
  private audio: AudioFile = null;
  private analyser: Analyser;
  private bufferCanvas: Canvas;
  private visibleCanvas: Canvas;
  private emphasisSlider: Slider;
  private currentXOffset: number = 0;
  private extraBufferWidth: number = 100;
  private isPlaying: boolean = false;

  constructor() {
    this.analyser = new Analyser();
    this.bufferCanvas = new Canvas();
    this.visibleCanvas = new Canvas();

    this.emphasisSlider = new Slider({
      label: 'Emphasis',
      length: () => window.innerHeight - 100,
      orientation: 'vertical',
      position: () => ({
        x: window.innerWidth - 320,
        y: 50
      }),
      range: [0, 108]
    });

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

    this.audio.connect(this.analyser.getNode()).play();
    this.visibleCanvas.clear();
    this.bufferCanvas.clear();

    if (!this.isPlaying) {
      this.isPlaying = true;

      this.render();
    }
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
        const loudnessFactor = clamp(2.0 * key / SoundPainter.TOTAL_NOTES, 1.0, 2.0);

        notes[key] = (analyserData[i] / 255) * loudnessFactor;
      }
    }

    const loudestNote = Math.max(...notes);

    // De-emphasize quieter notes to suppress noise artifacts
    for (let i = 0; i < notes.length; i++) {
      notes[i] *= Math.pow(notes[i] / loudestNote + 0.01, 8);
    }

    return notes;
  }

  private getKeyColor(key: number, loudness: number): string {
    const tone = (key % 12) / 12; // key / SoundPainter.TOTAL_NOTES;

    let r = Math.sin(tone * Math.PI);
    let g = Math.sin(tone * Math.PI + 0.5 * Math.PI);
    let b = Math.sin(tone * Math.PI + 1.3 * Math.PI);

    r = Math.round(clamp(r * 255 * loudness, 0, 255));
    g = Math.round(clamp(g * 255 * loudness, 0, 255));
    b = Math.round(clamp(b * 255 * loudness, 0, 255));

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

  private render(): void {
    window.requestAnimationFrame(() => this.render());

    const notes = this.createNotes();
    const noteHeight = window.innerHeight / notes.length;
    const visibleWidth = Math.round(this.visibleCanvas.width * 0.75);

    this.visibleCanvas.clear();

    // Render new notes to buffer canvas
    for (let i = 0; i < notes.length; i++) {
      const y = (notes.length - i - 1) * noteHeight;
      const brightness = Math.round(255 * notes[i]);
      const color = this.getKeyColor(i, notes[i]);
      const xDrift = Math.random() * 4 - 2;
      const yDrift = Math.random() * 4 - 2;
      const radius = Math.round(brightness / 15);

      this.bufferCanvas.circle(color, this.currentXOffset + xDrift, y + yDrift, radius);
    }

    // Blit buffer canvas contents to the visible canvas
    const sx = Math.max(this.currentXOffset - visibleWidth, 0);
    const sw = Math.min(this.currentXOffset, visibleWidth) + 20;
    const dx = Math.max(visibleWidth - this.currentXOffset, 0);
    const dw = visibleWidth - dx + 20;

    // Clear a strip of the buffer canvas behind the current
    // viewport to recycle it for future rendering
    const cx = mod(this.currentXOffset - visibleWidth - SoundPainter.MOVEMENT_SPEED - 5, this.bufferCanvas.width);
    const cw = SoundPainter.MOVEMENT_SPEED + 10;

    this.bufferCanvas.clear(cx, 0, cw, this.bufferCanvas.height);

    if (cx + cw > this.bufferCanvas.width) {
      // Wrap the clear region around to the beginning of
      // the buffer canvas if it goes out of bounds
      this.bufferCanvas.clear(0, 0, (cx + cw) - this.bufferCanvas.width, this.bufferCanvas.height);
    }

    // Blit part of the buffer canvas to the visible canvas,
    // copying the visible region behind the current x offset
    this.bufferCanvas.blit(
      this.visibleCanvas,
      sx, 0, sw, this.visibleCanvas.height,
      dx, 0, dw, this.visibleCanvas.height
    );

    if (this.currentXOffset < visibleWidth) {
      // Cover the remaining space back to the start of the visible
      // canvas, blitting from the far end of the buffer canvas
      const sx = mod(this.currentXOffset - visibleWidth, this.bufferCanvas.width);

      this.bufferCanvas.blit(
        this.visibleCanvas,
        sx, 0, this.bufferCanvas.width - sx, this.bufferCanvas.height,
        0, 0, visibleWidth - this.currentXOffset, this.visibleCanvas.height
      );
    }

    // Superimpose current notes onto background
    for (let i = 0; i < notes.length; i++) {
      const y = (notes.length - i - 1) * noteHeight;
      const brightness = Math.round(255 * notes[i]);
      const radius = Math.round(brightness / 15);

      // @todo variable note coloration
      this.visibleCanvas.circle('#fff', visibleWidth, y, radius);
    }

    this.currentXOffset = (this.currentXOffset + SoundPainter.MOVEMENT_SPEED) % this.bufferCanvas.width;
  }

  private updateCanvasSizes(): void {
    this.bufferCanvas.resize(window.innerWidth + this.extraBufferWidth, window.innerHeight);
    this.visibleCanvas.resize(window.innerWidth, window.innerHeight);
  }
}