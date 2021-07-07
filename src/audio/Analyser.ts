import AudioCore from './AudioCore';

export default class Analyser {
  private data: Uint8Array;
  private node: AnalyserNode;

  constructor() {
    this.node = AudioCore.createAnalyserNode();
    this.node.fftSize = 4096;
    this.node.smoothingTimeConstant = 0.5;
    this.data = new Uint8Array(this.node.frequencyBinCount);

    this.node.connect(AudioCore.getDestination());
  }

  public getData(): Readonly<Uint8Array> {
    return this.data;
  }
  
  public getNode(): Readonly<AudioNode> {
    return this.node;
  }

  public refreshData(): void {
    this.node.getByteFrequencyData(this.data);
  }
}