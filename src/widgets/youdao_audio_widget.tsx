import { renderWidget } from '@remnote/plugin-sdk';
import { YoudaoAudioPlayer } from '../components/YoudaoAudioPlayer';

/**
 * 有道词典发音小组件
 */
function YoudaoAudioWidget() {
  return <YoudaoAudioPlayer />;
}

renderWidget(YoudaoAudioWidget);