export default abstract class Node<T extends AudioNode = AudioNode> {
  protected node: T;

  constructor() {
    this.node = this.createNode();
  }

  public connect(destination: AudioNode): void {
    this.node.connect(destination);
  }

  public disconnect(): void {
    this.node.disconnect();
  }

  public getNode(): Readonly<T> {
    return this.node;
  }

  protected abstract createNode(): T;
}