import { usePlugin, useTracker } from '@remnote/plugin-sdk';
import { useCallback, useEffect, useState } from 'react';
import audioService from '../services/audioService';

export const YoudaoAudioPlayer = () => {
  const plugin = usePlugin();
  const [isPlaying, setIsPlaying] = useState(false);
  
  // 从设置中获取播放速度和重复次数
  const playbackRate = useTracker(() => 
    plugin.settings.getSetting<number>('playback-rate')
  );
  
  const repeatCount = useTracker(() => 
    plugin.settings.getSetting<number>('repeat-count')
  );

  // 当设置变化时更新音频服务的选项
  useEffect(() => {
    if (playbackRate && repeatCount) {
      audioService.setOptions({
        playbackRate,
        repeatCount,
      });
    }
  }, [playbackRate, repeatCount]);

  // 播放当前卡片内容
  const playCurrentCard = useCallback(async () => {
    // 获取当前焦点的Rem
    const focusedRem = await plugin.focus.getFocusedRem();
    if (!focusedRem) {
      plugin.app.toast('没有选中的卡片');
      return;
    }

    // 获取Rem的文本内容
    const text = await focusedRem.getText();
    if (!text) {
      plugin.app.toast('卡片内容为空');
      return;
    }

    // 播放单词发音
    setIsPlaying(true);
    audioService.playWord(text);
    
    // 监听播放结束
    setTimeout(() => {
      setIsPlaying(false);
    }, 1000 * repeatCount); // 简单估算播放时间
  }, [plugin, repeatCount]);

  return (
    <div className="p-4">
      <h2 className="text-lg font-medium mb-4">有道词典发音</h2>
      
      <button 
        className={`w-full py-2 px-4 rounded-md ${isPlaying ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} text-white font-medium transition-colors`}
        onClick={playCurrentCard}
        disabled={isPlaying}
      >
        {isPlaying ? '播放中...' : '播放发音'}
      </button>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>当前设置:</p>
        <p>播放速度: {playbackRate}x</p>
        <p>重复次数: {repeatCount}次</p>
      </div>
    </div>
  );
};