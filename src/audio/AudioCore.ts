export default class AudioCore {
  public static readonly SAMPLE_RATE: number = 44100;

  private static context: AudioContext = new AudioContext({
    sampleRate: AudioCore.SAMPLE_RATE
  });

  public static createAnalyserNode(): AnalyserNode {
    return AudioCore.context.createAnalyser();
  }

  public static createBufferSource(): AudioBufferSourceNode {
    return AudioCore.context.createBufferSource();
  }

  public static decodeAudioData(audioData: ArrayBuffer, handler: (buffer: AudioBuffer) => void): void {
    AudioCore.context.decodeAudioData(audioData, handler);
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