import AudioCore from './AudioCore';
import WebAudioNode from './WebAudioNode';

/**
 * @internal
 */
enum SoundState {
  SOUND_STOPPED,
  SOUND_PLAYING,
  SOUND_PAUSED
}

export default class AudioFile extends WebAudioNode<AudioBufferSourceNode> {
  private audioBuffer: AudioBuffer;
  private assetPath: string;
  private elapsedTime: number = 0;
  private isLoaded: boolean = false;
  private lastPlayStartTime: number = 0;
  private startPlayingOnLoad: boolean = false;
  private state: SoundState = SoundState.SOUND_STOPPED;

  public constructor(assetPath: string) {
    super();

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
      this.connect(this.targetNode || AudioCore.getDestination());
      this.node.start(0, this.elapsedTime);

      this.lastPlayStartTime = Date.now();
      this.state = SoundState.SOUND_PLAYING;
    }
  };

  public pause(): void {
    this.node.stop();
    this.disconnect();

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
      this.node.stop();
      this.disconnect();
    }

    this.onEnded();
  }

  protected createNode(): AudioBufferSourceNode {
    return AudioCore.createBufferSource();
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

    this.node = this.createNode();
    this.node.buffer = this.audioBuffer;

    this.node.addEventListener('ended', this.onEnded);
  }
}