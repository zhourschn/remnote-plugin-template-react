/**
 * 音频服务 - 处理有道词典API的音频播放
 */

export interface AudioOptions {
  playbackRate: number; // 播放速度
  repeatCount: number; // 重复次数
}

export class AudioService {
  private audio: HTMLAudioElement | null = null;
  private currentWord: string = '';
  private options: AudioOptions = {
    playbackRate: 1.0,
    repeatCount: 1,
  };
  private playCount: number = 0;

  constructor(options?: Partial<AudioOptions>) {
    if (options) {
      this.options = { ...this.options, ...options };
    }
  }

  /**
   * 设置音频选项
   */
  setOptions(options: Partial<AudioOptions>): void {
    this.options = { ...this.options, ...options };
    
    // 如果音频已经存在，更新播放速度
    if (this.audio) {
      this.audio.playbackRate = this.options.playbackRate;
    }
  }

  /**
   * 播放单词发音
   */
  playWord(word: string): void {
    // 如果正在播放同一个单词，停止当前播放
    if (this.audio && this.currentWord === word) {
      this.stop();
    }

    this.currentWord = word;
    this.playCount = 0;
    this.playAudio();
  }

  /**
   * 停止播放
   */
  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.removeEventListener('ended', this.handleAudioEnded);
      this.audio = null;
    }
  }

  /**
   * 播放音频
   */
  private playAudio(): void {
    if (this.playCount >= this.options.repeatCount) {
      this.audio = null;
      return;
    }

    const encodedWord = encodeURIComponent(this.currentWord);
    const audioUrl = `https://dict.youdao.com/dictvoice?type=1&audio=${encodedWord}`;
    
    this.audio = new Audio(audioUrl);
    this.audio.playbackRate = this.options.playbackRate;
    this.audio.addEventListener('ended', this.handleAudioEnded);
    
    this.playCount++;
    this.audio.play().catch(error => {
      console.error('播放音频失败:', error);
    });
  }

  /**
   * 处理音频播放结束事件
   */
  private handleAudioEnded = (): void => {
    if (this.playCount < this.options.repeatCount) {
      this.playAudio();
    } else {
      this.audio = null;
    }
  };
}

// 创建单例实例
const audioService = new AudioService();
export default audioService;