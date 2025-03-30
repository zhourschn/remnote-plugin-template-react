import { declareIndexPlugin, ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import '../style.css';
import '../App.css';
import audioService from '../services/audioService';

async function onActivate(plugin: ReactRNPlugin) {
  // 注册有道词典发音插件设置
  await plugin.settings.registerNumberSetting({
    id: 'playback-rate',
    title: '播放速度',
    defaultValue: 1.0,
    description: '设置有道词典发音的播放速度 (0.5-2.0)',
    min: 0.5,
    max: 2.0,
    step: 0.1,
  });

  await plugin.settings.registerNumberSetting({
    id: 'repeat-count',
    title: '重复次数',
    defaultValue: 1,
    description: '设置有道词典发音的重复播放次数 (1-5)',
    min: 1,
    max: 5,
    step: 1,
  });
  
  await plugin.settings.registerBooleanSetting({
    id: 'auto-play',
    title: '自动播放',
    defaultValue: false,
    description: '在打开闪卡时自动播放发音',
  });

  // 注册播放发音命令
  await plugin.app.registerCommand({
    id: 'play-youdao-audio',
    name: '播放有道词典发音',
    description: '播放当前选中内容的有道词典发音',
    action: async () => {
      const focusedRem = await plugin.focus.getFocusedRem();
      if (focusedRem) {
        const text = await focusedRem.getText();
        if (text) {
          // 获取设置
          const playbackRate = await plugin.settings.getSetting('playback-rate');
          const repeatCount = await plugin.settings.getSetting('repeat-count');
          
          // 设置播放选项
          audioService.setOptions({
            playbackRate,
            repeatCount,
          });
          
          // 播放发音
          audioService.playWord(text);
          await plugin.app.toast(`正在播放: ${text}`);
        } else {
          await plugin.app.toast('没有可播放的内容');
        }
      } else {
        await plugin.app.toast('请先选择一个卡片');
      }
    },
  });

  // 注册侧边栏小组件
  await plugin.app.registerWidget('youdao_audio_widget', WidgetLocation.RightSidebar, {
    dimensions: { height: 'auto', width: '100%' },
  });
  
  // 注册闪卡界面小组件
  await plugin.app.registerWidget('youdao_flashcard_widget', WidgetLocation.Flashcard, {
    dimensions: { height: 'auto', width: '100%' },
  });
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
