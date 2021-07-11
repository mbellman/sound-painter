import AudioCore from './AudioCore';
import Node from './Node';

export default class Analyser extends Node<AnalyserNode> {
  private data: Uint8Array;

  constructor() {
    super();

    this.data = new Uint8Array(this.node.frequencyBinCount);
  }

  public getData(): Readonly<Uint8Array> {
    return this.data;
  }

  public refreshData(): void {
    this.node.getByteFrequencyData(this.data);
  }

  protected createNode(): AnalyserNode {
    const node = AudioCore.createAnalyserNode();

    node.fftSize = 4096;
    node.smoothingTimeConstant = 0.5;

    return node;
  }
}