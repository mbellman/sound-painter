export default abstract class WebAudioNode<T extends AudioNode = AudioNode> {
  protected node: T;
  protected targetNode: AudioNode;

  constructor() {
    this.node = this.createNode();
  }

  public connect(destinationNode: AudioNode): void {
    this.node.connect(destinationNode);

    this.targetNode = destinationNode;
  }

  public disconnect(): void {
    this.node.disconnect();
  }

  public getNode(): Readonly<T> {
    return this.node;
  }

  protected abstract createNode(): T;
}