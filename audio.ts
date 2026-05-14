class AudioService {
  private popAudio: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.popAudio = new Audio('/dragon-studio-bubble-pop-406640.mp3');
      this.popAudio.volume = 0.5;
    }
  }

  public playPop() {
    if (this.popAudio) {
      this.popAudio.currentTime = 0;
      this.popAudio.play().catch((e) => {
        console.warn('Audio playback prevented by browser policy.', e);
      });
    }
  }
}

export const audioService = new AudioService();
