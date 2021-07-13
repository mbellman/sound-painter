import AudioCore from './AudioCore';
import Node from './Node';

export default class Delay extends Node<DelayNode> {
  constructor(delay: number) {
    super();

    this.node.delayTime.value = delay;
  }

  public setDelay(delay: number): void {
    this.node.delayTime.value = delay;
  }

  protected createNode(): DelayNode {
    return AudioCore.createDelayNode();
  }
}