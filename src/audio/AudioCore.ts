declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

export default class AudioCore {
  public static readonly SAMPLE_RATE: number = 44100;

  private static context: AudioContext = new (window.AudioContext || window.webkitAudioContext)({
    sampleRate: AudioCore.SAMPLE_RATE
  });

  public static createAnalyserNode(): AnalyserNode {
    return AudioCore.context.createAnalyser();
  }

  public static createBufferSource(): AudioBufferSourceNode {
    return AudioCore.context.createBufferSource();
  }

  public static createDelayNode(maxDelay: number = 179.0): DelayNode {
    return AudioCore.context.createDelay(maxDelay);
  }

  public static decodeAudioData(audioData: ArrayBuffer, handler: (buffer: AudioBuffer) => void): void {
    AudioCore.context.decodeAudioData(audioData, handler);
  }

  public static enableIfSuspended(): void {
    if (AudioCore.context.state === 'suspended') {
      AudioCore.context.resume();
    }
  }

  public static getDestination(): AudioDestinationNode {
    return AudioCore.context.destination;
  }

  public static play(node: AudioBufferSourceNode, offset?: number, destination?: AudioNode): void {
    node.connect(destination || AudioCore.context.destination);
    node.start(0, offset);
  }

  public static stop(node: AudioBufferSourceNode): void {
    node.stop();
    node.disconnect();
  }
}