/**
 * Background Service Worker
 * 处理扩展的后台事件
 */

// 扩展安装时的事件处理
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[X to MD] 扩展已安装');
  } else if (details.reason === 'update') {
    console.log('[X to MD] 扩展已更新到版本', chrome.runtime.getManifest().version);
  }
});

// 监听来自其他脚本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 可以在这里添加更多的后台处理逻辑
  console.log('[X to MD] Received message:', request);
  return true;
});
