import { renderWidget, usePlugin, useTracker } from '@remnote/plugin-sdk';
import { useEffect, useState } from 'react';
import audioService from '../services/audioService';

/**
 * 有道词典闪卡发音组件
 * 在闪卡界面显示，用于播放当前卡片的发音
 */
function YoudaoFlashcardWidget() {
  const plugin = usePlugin();
  const [isPlaying, setIsPlaying] = useState(false);
  const [cardText, setCardText] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // 从设置中获取播放速度和重复次数
  const playbackRate = useTracker(() => 
    plugin.settings.getSetting<number>('playback-rate')
  );
  
  const repeatCount = useTracker(() => 
    plugin.settings.getSetting<number>('repeat-count')
  );

  // 获取当前闪卡内容
  useTracker(async (reactivePlugin) => {
    try {
      setError(null);
      // 获取当前焦点的 Rem
      const focusedRem = await reactivePlugin.focus.getFocusedRem();
      console.log('Focused Rem:', focusedRem);
      
      if (focusedRem) {
        // 获取 Rem 的富文本内容
        const richText = await focusedRem.text;
        console.log('Rich text:', richText);
        
        if (richText) {
          // 转换为纯文本
          const text = await plugin.richText.toString(richText);
          console.log('Plain text:', text);
          
          if (text) {
            setCardText(text);
          } else {
            setError('卡片内容为空');
          }
        } else {
          setError('卡片内容为空');
        }
      } else {
        setError('未找到当前卡片');
      }
    } catch (error) {
      console.error('获取闪卡内容失败:', error);
      setError('获取闪卡内容失败: ' + (error as Error).message);
    }
  });

  // 当设置变化时更新音频服务的选项
  useEffect(() => {
    if (playbackRate && repeatCount) {
      audioService.setOptions({
        playbackRate,
        repeatCount,
      });
    }
  }, [playbackRate, repeatCount]);

  // 自动播放功能
  const autoPlayEnabled = useTracker(() => 
    plugin.settings.getSetting<boolean>('auto-play')
  );

  // 当卡片加载时，如果启用了自动播放，则自动播放发音
  useEffect(() => {
    if (autoPlayEnabled && cardText) {
      playAudio();
    }
  }, [cardText, autoPlayEnabled]);

  // 播放音频
  const playAudio = () => {
    if (!cardText || isPlaying) return;
    
    setIsPlaying(true);
    audioService.playWord(cardText);
    
    // 估算播放时间
    setTimeout(() => {
      setIsPlaying(false);
    }, 1000 * (repeatCount || 1)); 
  };

  return (
    <div className="p-2">
      {error && (
        <div className="mb-2 text-sm text-red-500">
          {error}
        </div>
      )}
      <button 
        className={`w-full py-1 px-2 rounded ${isPlaying ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} text-white text-sm font-medium transition-colors`}
        onClick={playAudio}
        disabled={isPlaying || !cardText}
      >
        {isPlaying ? '播放中...' : '播放发音'}
      </button>
      {cardText && (
        <div className="mt-2 text-sm text-gray-600">
          当前卡片内容: {cardText}
        </div>
      )}
    </div>
  );
}

renderWidget(YoudaoFlashcardWidget);