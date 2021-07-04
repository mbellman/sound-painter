/**
 * @internal
 */
class AudioCore {
  private static context: AudioContext = new AudioContext();

  public static createBufferSource(): AudioBufferSourceNode {
    return AudioCore.context.createBufferSource();
  }

  public static decodeAudioData(audioData: ArrayBuffer, handler: (buffer: AudioBuffer) => void): void {
    AudioCore.context.decodeAudioData(audioData, handler);
  }

  public static play(node: AudioBufferSourceNode, offset?: number): void {
    node.connect(AudioCore.context.destination);
    node.start(0, offset);
  }

  public static stop(node: AudioBufferSourceNode): void {
    node.stop();
    node.disconnect();
  }
}

/**
 * @internal
 */
enum SoundState {
  SOUND_STOPPED,
  SOUND_PLAYING,
  SOUND_PAUSED
}

export default class AudioFile {
  private audioBuffer: AudioBuffer;
  private assetPath: string;
  private elapsedTime: number = 0;
  private isLoaded: boolean = false;
  private lastPlayStartTime: number = 0;
  private node: AudioBufferSourceNode;
  private startPlayingOnLoad: boolean = false;
  private state: SoundState = SoundState.SOUND_STOPPED;

  public constructor(assetPath: string) {
    this.assetPath = assetPath;

    this.load();
  }

  public get isPlaying(): boolean {
    return this.state === SoundState.SOUND_PLAYING;
  }

  public play = () => {
    if (!this.isLoaded) {
      this.startPlayingOnLoad = true;

      return;
    }

    if (this.state === SoundState.SOUND_STOPPED || !this.node) {
      this.resetNode();
    }

    if (this.state !== SoundState.SOUND_PLAYING) {
      AudioCore.play(this.node, this.elapsedTime);

      this.lastPlayStartTime = Date.now();
      this.state = SoundState.SOUND_PLAYING;
    }
  };

  public pause(): void {
    AudioCore.stop(this.node);

    this.resetNode();

    this.elapsedTime += (Date.now() - this.lastPlayStartTime) / 1000;
    this.state = SoundState.SOUND_PAUSED;
  }

  public restart(): void {
    this.stop();
    this.play();
  }

  public stop(): void {
    if (this.state === SoundState.SOUND_PLAYING) {
      AudioCore.stop(this.node);
    }

    this.onEnded();
  }

  private onEnded = () => {
    this.elapsedTime = 0;
    this.lastPlayStartTime = 0;
    this.state = SoundState.SOUND_STOPPED;
  };

  private async load(): Promise<void> {
    const audioData: ArrayBuffer = await new Promise(resolve => {
      const ajax: XMLHttpRequest = new XMLHttpRequest();

      ajax.open('GET', this.assetPath);
      ajax.responseType = 'arraybuffer';
      ajax.onload = () => resolve(ajax.response);
      ajax.send();
    });

    AudioCore.decodeAudioData(audioData, (audioBuffer: AudioBuffer) => {
      this.audioBuffer = audioBuffer;
      this.isLoaded = true;

      if (this.startPlayingOnLoad) {
        this.play();
      }
    });
  }

  private resetNode(): void {
    if (this.node) {
      this.node.removeEventListener('ended', this.onEnded);
    }

    this.node = AudioCore.createBufferSource();
    this.node.buffer = this.audioBuffer;

    this.node.addEventListener('ended', this.onEnded);
  }
}