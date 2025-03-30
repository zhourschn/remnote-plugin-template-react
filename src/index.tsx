import { ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import React, { useState, useEffect } from 'react';
import './style.css';

// 播放控制组件
const AudioControlWidget = (props: {plugin: ReactRNPlugin}) => {
  const [word, setWord] = useState('');
  const [speed, setSpeed] = useState(1.0);
  const [repeat, setRepeat] = useState(1);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  
  // 加载设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSpeed = await props.plugin.settings.getSetting('playback-speed') as number;
        const savedRepeat = await props.plugin.settings.getSetting('repeat-count') as number;
        const savedAutoPlay = await props.plugin.settings.getSetting('enable-auto-play') as boolean;
        
        if (savedSpeed) setSpeed(savedSpeed);
        if (savedRepeat) setRepeat(savedRepeat);
        setIsAutoPlay(savedAutoPlay);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    loadSettings();
  }, []);
  
  // 保存设置
  useEffect(() => {
    const saveSettings = async () => {
      try {
        // 这些设置已经在注册时设置了默认值，所以可以直接使用registerXxxSetting重新注册来更新
        await props.plugin.settings.registerNumberSetting({
          id: 'playback-speed',
          title: 'Playback Speed',
          defaultValue: speed,
        });
        
        await props.plugin.settings.registerNumberSetting({
          id: 'repeat-count',
          title: 'Repeat Count',
          defaultValue: repeat,
        });
        
        await props.plugin.settings.registerBooleanSetting({
          id: 'enable-auto-play',
          title: 'Enable Auto Play',
          defaultValue: isAutoPlay,
        });
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    };
    
    // 为了避免频繁更新，添加一个延迟
    const timeoutId = setTimeout(saveSettings, 500);
    return () => clearTimeout(timeoutId);
  }, [speed, repeat, isAutoPlay]);
  
  // 播放按钮点击处理
  const handlePlay = () => {
    if (word.trim() !== '') {
      playAudio(word, speed, repeat);
    }
  };
  
  return (
    <div className="youdao-audio-control">
      <h3 className="youdao-audio-title">有道发音控制</h3>
      
      <div className="youdao-audio-setting">
        <label>单词/句子:</label>
        <input 
          type="text" 
          placeholder="输入要发音的单词或句子"
          value={word}
          onChange={(e) => setWord(e.target.value)}
        />
      </div>
      
      <div className="youdao-audio-setting">
        <label>自动播放:</label>
        <input 
          type="checkbox" 
          checked={isAutoPlay}
          onChange={(e) => setIsAutoPlay(e.target.checked)}
        />
      </div>
      
      <div className="youdao-audio-setting">
        <label>速度 ({speed}x):</label>
        <input 
          type="range" 
          min="0.5" 
          max="2" 
          step="0.1" 
          value={speed}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
        />
      </div>
      
      <div className="youdao-audio-setting">
        <label>重复次数 ({repeat}):</label>
        <input 
          type="range" 
          min="1" 
          max="10" 
          step="1" 
          value={repeat}
          onChange={(e) => setRepeat(parseInt(e.target.value))}
        />
      </div>
      
      <button className="youdao-audio-button" onClick={handlePlay}>
        播放音频
      </button>
    </div>
  );
};

// 为给定的英语单词或句子播放音频
function playAudio(text: string, speed: number, repeatCount: number) {
  // 清理和准备 API 的文本
  const cleanText = encodeURIComponent(text.trim());
  
  // 使用HTTPS协议的有道API
  const audio = new Audio(`https://dict.youdao.com/dictvoice?type=1&audio=${cleanText}`);
  
  // 设置播放速度
  audio.playbackRate = speed;
  
  // 用来跟踪是否播放成功
  let playSuccess = false;
  
  // 添加错误处理
  audio.onerror = (e) => {
    console.error('播放错误:', e);
    // 尝试使用备用API
    const backupAudio = new Audio(`https://fanyi.baidu.com/gettts?lan=en&text=${cleanText}&spd=3&source=web`);
    backupAudio.playbackRate = speed;
    
    let count = 0;
    backupAudio.onended = () => {
      count++;
      if (count < repeatCount) {
        backupAudio.currentTime = 0;
        backupAudio.play().catch(e => console.error('备用API播放错误:', e));
      }
    };
    
    backupAudio.play().catch(e => console.error('备用API播放错误:', e));
  };
  
  // 重复计数器
  let count = 0;
  
  // 播放音频并处理重复
  audio.onended = () => {
    playSuccess = true;
    count++;
    if (count < repeatCount) {
      audio.currentTime = 0;
      audio.play().catch(e => console.error('重复播放错误:', e));
    }
  };
  
  // 开始播放
  audio.play()
    .then(() => {
      console.log(`播放成功: ${text}`);
    })
    .catch(e => {
      console.error('播放失败:', e);
    });
}

// 插件激活函数
async function onActivate(plugin: ReactRNPlugin) {
  // 添加插件设置
  await plugin.settings.registerBooleanSetting({
    id: 'enable-auto-play',
    title: 'Enable Auto Play',
    defaultValue: true,
  });

  await plugin.settings.registerNumberSetting({
    id: 'playback-speed',
    title: 'Playback Speed',
    defaultValue: 1.0,
  });

  await plugin.settings.registerNumberSetting({
    id: 'repeat-count',
    title: 'Repeat Count',
    defaultValue: 1,
  });

  // 注册测试音频的命令
  await plugin.app.registerCommand({
    id: 'test-audio',
    name: 'Test Youdao Audio',
    action: async () => {
      // 使用浏览器原生的 prompt
      const text = prompt('输入要发音的单词或句子:');
      
      if (text) {
        const playbackSpeed = await plugin.settings.getSetting('playback-speed') as number;
        const repeatCount = await plugin.settings.getSetting('repeat-count') as number;
        
        playAudio(text, playbackSpeed, repeatCount);
      }
    },
  });
  
  // 创建用于显示状态的元素
  const statusElement = document.createElement('div');
  statusElement.id = 'youdao-audio-status';
  statusElement.style.position = 'fixed';
  statusElement.style.bottom = '20px';
  statusElement.style.right = '20px';
  statusElement.style.padding = '8px 12px';
  statusElement.style.background = 'rgba(18, 183, 203, 0.8)';
  statusElement.style.color = 'white';
  statusElement.style.borderRadius = '4px';
  statusElement.style.fontSize = '14px';
  statusElement.style.zIndex = '9999';
  statusElement.style.display = 'none';
  document.body.appendChild(statusElement);
  
  // 显示状态信息
  const showStatus = (message: string, timeout = 3000) => {
    statusElement.textContent = message;
    statusElement.style.display = 'block';
    setTimeout(() => {
      statusElement.style.display = 'none';
    }, timeout);
  };
  
  // 由于Widget注册可能有兼容性问题，改为直接注入DOM
  // 创建控制面板
  const controlPanel = document.createElement('div');
  controlPanel.id = 'youdao-audio-control-panel';
  controlPanel.innerHTML = `
    <div class="youdao-audio-control">
      <h3 class="youdao-audio-title">有道发音控制</h3>
      
      <div class="youdao-audio-setting">
        <label>单词/句子:</label>
        <input type="text" id="youdao-audio-text" placeholder="输入要发音的单词或句子">
      </div>
      
      <div class="youdao-audio-setting">
        <label>自动播放: <input type="checkbox" id="youdao-auto-play" checked></label>
      </div>
      
      <div class="youdao-audio-setting">
        <label>播放速度: <span id="youdao-speed-value">1.0</span>x</label>
        <input type="range" id="youdao-speed" min="0.5" max="2" step="0.1" value="1.0">
      </div>
      
      <div class="youdao-audio-setting">
        <label>重复次数: <span id="youdao-repeat-value">1</span></label>
        <input type="range" id="youdao-repeat" min="1" max="10" step="1" value="1">
      </div>
      
      <button class="youdao-audio-button" id="youdao-play-button">播放音频</button>
    </div>
  `;
  
  // 在适当的时机添加控制面板
  setTimeout(() => {
    // 尝试添加到右侧栏
    const rightSidebar = document.querySelector('.sidebar-container');
    if (rightSidebar) {
      rightSidebar.prepend(controlPanel);
    } else {
      // 如果找不到右侧栏，添加到body
      document.body.appendChild(controlPanel);
    }
    
    // 添加事件监听器
    document.getElementById('youdao-play-button')?.addEventListener('click', () => {
      const textInput = document.getElementById('youdao-audio-text') as HTMLInputElement;
      const speedInput = document.getElementById('youdao-speed') as HTMLInputElement;
      const repeatInput = document.getElementById('youdao-repeat') as HTMLInputElement;
      
      const text = textInput?.value || '';
      const speed = parseFloat(speedInput?.value || '1.0');
      const repeat = parseInt(repeatInput?.value || '1');
      
      if (text.trim()) {
        playAudio(text, speed, repeat);
        showStatus(`正在播放: ${text}`);
      }
    });
    
    document.getElementById('youdao-speed')?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const value = parseFloat(target.value);
      document.getElementById('youdao-speed-value')!.textContent = value.toString();
      plugin.settings.registerNumberSetting({
        id: 'playback-speed',
        title: 'Playback Speed',
        defaultValue: value,
      });
    });
    
    document.getElementById('youdao-repeat')?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const value = parseInt(target.value);
      document.getElementById('youdao-repeat-value')!.textContent = value.toString();
      plugin.settings.registerNumberSetting({
        id: 'repeat-count',
        title: 'Repeat Count',
        defaultValue: value,
      });
    });
    
    document.getElementById('youdao-auto-play')?.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      plugin.settings.registerBooleanSetting({
        id: 'enable-auto-play',
        title: 'Enable Auto Play',
        defaultValue: target.checked,
      });
    });
  }, 1000);
  
  // 使用多种方法检测闪卡显示
  
  // 方法1: DOM变化监听 - 监控整个文档的变化
  const observer = new MutationObserver(async (mutations) => {
    try {
      const enableAutoPlay = await plugin.settings.getSetting('enable-auto-play');
      if (!enableAutoPlay) return;
      
      // 检查是否有新的卡片元素添加或修改
      for (const mutation of mutations) {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          checkForFlashcard();
        }
      }
    } catch (error) {
      console.error('Error in mutation observer:', error);
    }
  });
  
  // 开始观察DOM变化
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
  
  // 方法2: 定期轮询检查当前显示的闪卡
  const checkIntervalId = setInterval(checkForFlashcard, 500);
  
  // 方法3: 点击事件监听 - 可能有翻卡操作
  document.addEventListener('click', async (e) => {
    // 短暂延迟以等待DOM更新
    setTimeout(checkForFlashcard, 300);
  });
  
  // 卡片检测和播放功能
  let lastPlayedText = '';
  let lastPlayTime = 0;
  
  async function checkForFlashcard() {
    try {
      const enableAutoPlay = await plugin.settings.getSetting('enable-auto-play');
      if (!enableAutoPlay) return;
      
      // 更新为RemNote实际使用的选择器
      const selectors = [
        // 基于用户提供的实际DOM结构
        '.RichTextViewer',
        '[data-queue-rem-container-tags="document"] .RichTextViewer',
        '.rn-queue-rem .RichTextViewer',
        '.indented-rem[data-queue-rem-container-tags="document"] .RichTextViewer',
        '.basic_card_rem_type .RichTextViewer',
        // 保留一些原始选择器以兼容性
        '.practice-card-front .rem-text',
        '.practice-card-front .rem-container',
        '.queue-card-container .RichTextViewer',
        '.flashcard-front',
        // 补充一些可能的文本节点
        '[data-linear-editor-item-type="m"]',
        '.linear-editor-item.whitespace-pre-wrap',
      ];
      
      // 显示所有可能的匹配选择器信息
      let debugInfo = "可能的闪卡选择器匹配情况:\n";
      
      // 寻找可见的闪卡内容
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          debugInfo += `找到 ${elements.length} 个元素匹配选择器: ${selector}\n`;
          
          for (const el of elements) {
            // 检查元素是否可见
            const rect = el.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0 && 
                             rect.top >= 0 && rect.left >= 0 && 
                             rect.top <= window.innerHeight;
                              
            if (isVisible && el.textContent) {
              const text = el.textContent.trim();
              
              // 忽略空文本或非文本内容
              if (!text || text.length > 100) continue;
              
              // 忽略包含特定字符的文本 (如箭头、问号等)
              if (text.includes('→') || text.includes('?')) continue;
              
              debugInfo += `在选择器 ${selector} 中找到可见文本: "${text}"\n`;
              
              // 防止重复播放
              const now = Date.now();
              if (text === lastPlayedText && now - lastPlayTime < 5000) {
                debugInfo += "跳过重复播放\n";
                continue;
              }
              
              // 更新播放记录
              lastPlayedText = text;
              lastPlayTime = now;
              
              // 获取设置
              const playbackSpeed = await plugin.settings.getSetting('playback-speed') as number;
              const repeatCount = await plugin.settings.getSetting('repeat-count') as number;
              
              // 显示状态
              showStatus(`自动播放: ${text}`);
              console.log(`发现闪卡前面内容: ${text}`);
              
              // 使用alert显示找到的内容
              alert(`找到卡片内容: "${text}"\n选择器: ${selector}`);
              
              // 播放音频
              playAudio(text, playbackSpeed, repeatCount);
              return; // 找到一个就退出
            } else if (el.textContent) {
              debugInfo += `在选择器 ${selector} 中找到不可见文本: "${el.textContent.trim().substring(0, 30)}..."\n`;
            }
          }
        } else {
          debugInfo += `没有元素匹配选择器: ${selector}\n`;
        }
      }
      
      // 如果没有找到任何可见闪卡，考虑记录DOM结构以便调试
      // 每10秒记录一次以避免过多日志
      const now = Date.now();
      if (now - (window._lastDebugTime || 0) > 10000) {
        window._lastDebugTime = now;
        console.log(debugInfo);
      }
    } catch (error) {
      console.error('Error checking for flashcard:', error);
    }
  }
  
  // 方法4: 在页面上添加钩子
  const hook = document.createElement('script');
  hook.textContent = `
    (function() {
      console.log('安装DOM钩子和调试函数...');
      
      // 设置全局调试对象
      window._youdaoDebug = {
        checkForFlashcard: function() {
          console.log('正在手动检查闪卡...');
          // 会通过自定义事件触发真正的检测函数
          document.dispatchEvent(new CustomEvent('manual-flashcard-check'));
          return '检查已触发，请查看控制台输出';
        },
        
        dumpDOM: function(selector = '.practice-card-container, .flashcard-container, .queue-card-container') {
          console.log('正在打印DOM结构...');
          const elements = document.querySelectorAll(selector);
          if (elements.length === 0) {
            console.log('没有找到匹配的元素: ' + selector);
            return '未找到元素';
          }
          
          elements.forEach((el, index) => {
            console.log('DOM元素 #' + index + ':', el);
            console.log('HTML结构:', el.outerHTML);
            console.log('可见性:', el.getBoundingClientRect().width > 0);
            console.log('--------------------');
          });
          
          return '已打印 ' + elements.length + ' 个元素';
        },
        
        testAudio: function(text) {
          if (!text) {
            text = prompt('请输入要测试的文本:');
            if (!text) return '未提供文本';
          }
          
          // 创建一个新的音频元素用于测试
          const audio = new Audio(\`https://dict.youdao.com/dictvoice?type=1&audio=\${encodeURIComponent(text)}\`);
          audio.play()
            .then(() => console.log('音频测试成功: ' + text))
            .catch(err => console.error('音频测试失败:', err));
            
          return '正在播放: ' + text;
        },
        
        findWords: function() {
          // 查找页面上所有可能的单词文本
          const textNodes = [];
          const walk = document.createTreeWalker(
            document.body, 
            NodeFilter.SHOW_TEXT,
            null
          );
          
          let node;
          while(node = walk.nextNode()) {
            const text = node.textContent.trim();
            if (text && text.length > 0 && text.length < 100) {
              const parentEl = node.parentElement;
              if (parentEl && parentEl.offsetWidth > 0 && parentEl.offsetHeight > 0) {
                textNodes.push({
                  text: text,
                  element: parentEl,
                  path: getElementPath(parentEl)
                });
              }
            }
          }
          
          console.table(textNodes.map(n => ({
            text: n.text,
            path: n.path,
            visible: isElementVisible(n.element)
          })));
          
          return '找到 ' + textNodes.length + ' 个可能的文本节点';
          
          // 辅助函数：获取元素的CSS路径
          function getElementPath(element) {
            if (!element) return '';
            if (element === document.body) return 'body';
            
            let path = '';
            if (element.id) {
              return '#' + element.id + path;
            }
            
            if (element.className) {
              path = '.' + Array.from(element.classList).join('.') + path;
            } else {
              path = element.tagName.toLowerCase() + path;
            }
            
            return getElementPath(element.parentElement) + ' > ' + path;
          }
          
          // 检查元素是否可见
          function isElementVisible(element) {
            const rect = element.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && 
                   rect.top >= 0 && rect.top <= window.innerHeight;
          }
        }
      };
      
      // 添加全局快捷方式
      window.checkFlashcard = window._youdaoDebug.checkForFlashcard;
      window.dumpDOM = window._youdaoDebug.dumpDOM;
      window.testAudio = window._youdaoDebug.testAudio;
      window.findWords = window._youdaoDebug.findWords;
      
      // 尝试拦截闪卡相关的DOM更新
      const originalAppendChild = Element.prototype.appendChild;
      Element.prototype.appendChild = function(child) {
        const result = originalAppendChild.call(this, child);
        
        // 检查是否可能是闪卡相关的DOM更新
        if (child && child.classList) {
          if (
            child.classList.contains('practice-card-front') || 
            child.classList.contains('flashcard') || 
            child.classList.contains('card-front') ||
            (this.classList && (
              this.classList.contains('practice-container') ||
              this.classList.contains('flashcard-container')
            ))
          ) {
            // 触发自定义事件
            setTimeout(() => {
              document.dispatchEvent(new CustomEvent('flashcard-updated'));
            }, 100);
          }
        }
        return result;
      };
      
      // 记录到控制台便于调试
      console.log('有道发音: DOM钩子和调试函数已安装，可用命令:');
      console.log('- checkFlashcard(): 手动触发闪卡检测');
      console.log('- dumpDOM(selector): 打印DOM结构');
      console.log('- testAudio(text): 测试音频播放');
      console.log('- findWords(): 查找页面上所有可见文本');
    })();
  `;
  document.head.appendChild(hook);
  
  // 监听自定义事件
  document.addEventListener('flashcard-updated', checkForFlashcard);
  document.addEventListener('manual-flashcard-check', () => {
    console.log('收到手动检查事件，执行检查...');
    checkForFlashcard();
  });
  
  // 公开到window对象，注意这可能不会被RemNote允许，所以我们通过注入脚本的方式添加了备用方法
  try {
    (window as any)._playYoudaoAudio = playAudio;
    (window as any)._checkForFlashcard = checkForFlashcard;
    console.log('调试函数已注册到window对象');
  } catch (e) {
    console.error('无法注册调试函数到window对象:', e);
  }
  
  // 输出更多启动信息
  console.log('插件初始化完成，配置:', {
    版本: '1.0.1',
    API地址: 'https://dict.youdao.com/dictvoice...',
    备用API: 'https://fanyi.baidu.com/gettts...',
    检测间隔: '500ms',
    自动播放: await plugin.settings.getSetting('enable-auto-play'),
    播放速度: await plugin.settings.getSetting('playback-speed'),
    重复次数: await plugin.settings.getSetting('repeat-count')
  });
  
  // 显示初始状态
  showStatus('有道发音插件已激活', 2000);
  console.log('有道发音插件已激活');
}

// 添加一个全局变量来跟踪上一次播放的卡片
declare global {
  interface Window {
    _lastPlayedCard?: string;
    _lastDebugTime?: number;
    _playYoudaoAudio?: (text: string, speed: number, repeatCount: number) => void;
    _checkForFlashcard?: () => void;
  }
}

// 导出插件接口
export default {
  onActivate,
}; 