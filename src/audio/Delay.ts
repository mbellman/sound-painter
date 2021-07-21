import AudioCore from './AudioCore';
import WebAudioNode from './WebAudioNode';

export default class Delay extends WebAudioNode<DelayNode> {
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