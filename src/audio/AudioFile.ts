import AudioCore from './AudioCore';

/**
 * @internal
 */
enum SoundState {
  SOUND_STOPPED,
  SOUND_PLAYING,
  SOUND_PAUSED
}

/**
 * @todo extends Node<AudioBufferSourceNode>
 */
export default class AudioFile {
  private audioBuffer: AudioBuffer;
  private assetPath: string;
  private elapsedTime: number = 0;
  private isLoaded: boolean = false;
  private lastPlayStartTime: number = 0;
  private passThroughNode: AudioNode;
  private sourceNode: AudioBufferSourceNode;
  private startPlayingOnLoad: boolean = false;
  private state: SoundState = SoundState.SOUND_STOPPED;

  public constructor(assetPath: string) {
    this.assetPath = assetPath;

    this.load();
  }

  public get isPlaying(): boolean {
    return this.state === SoundState.SOUND_PLAYING;
  }

  public connect(node: AudioNode): AudioFile {
    this.passThroughNode = node;

    return this;
  }

  public play = () => {
    if (!this.isLoaded) {
      this.startPlayingOnLoad = true;

      return;
    }

    if (this.state === SoundState.SOUND_STOPPED || !this.sourceNode) {
      this.resetNode();
    }

    if (this.state !== SoundState.SOUND_PLAYING) {
      AudioCore.play(this.sourceNode, this.elapsedTime, this.passThroughNode);

      this.lastPlayStartTime = Date.now();
      this.state = SoundState.SOUND_PLAYING;
    }
  };

  public pause(): void {
    AudioCore.stop(this.sourceNode);

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
      AudioCore.stop(this.sourceNode);
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
    if (this.sourceNode) {
      this.sourceNode.removeEventListener('ended', this.onEnded);
    }

    this.sourceNode = AudioCore.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;

    this.sourceNode.addEventListener('ended', this.onEnded);
  }
}