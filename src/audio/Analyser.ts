import AudioCore from './AudioCore';
import Node from './Node';

export default class Analyser extends Node<AnalyserNode> {
  private data: Uint8Array;

  constructor() {
    super();

    // @todo use options
    this.node.fftSize = 4096;
    this.node.smoothingTimeConstant = 0.5;

    this.data = new Uint8Array(this.node.frequencyBinCount);
  }

  public getData(): Readonly<Uint8Array> {
    return this.data;
  }

  public refreshData(): void {
    this.node.getByteFrequencyData(this.data);
  }

  protected createNode(): AnalyserNode {
    return AudioCore.createAnalyserNode();
  }
}