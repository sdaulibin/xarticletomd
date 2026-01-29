/**
 * Popup Script - 用户界面交互逻辑
 */

document.addEventListener('DOMContentLoaded', () => {
  const extractBtn = document.getElementById('extractBtn');
  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const statusEl = document.getElementById('status');
  const previewContainer = document.getElementById('previewContainer');
  const markdownOutput = document.getElementById('markdownOutput');

  let currentMarkdown = '';
  let currentTweetData = null;

  /**
   * 显示状态消息
   */
  function showStatus(message, type = 'loading') {
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    statusEl.classList.remove('hidden');
  }

  /**
   * 隐藏状态消息
   */
  function hideStatus() {
    statusEl.classList.add('hidden');
  }

  /**
   * 显示预览区域
   */
  function showPreview(markdown) {
    markdownOutput.value = markdown;
    previewContainer.classList.remove('hidden');
  }

  /**
   * 隐藏预览区域
   */
  function hidePreview() {
    previewContainer.classList.add('hidden');
  }

  /**
   * 提取推文并转换
   */
  async function extractAndConvert() {
    extractBtn.disabled = true;
    extractBtn.classList.add('loading');
    hidePreview();
    showStatus('正在提取推文内容...', 'loading');

    try {
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // 检查是否在 X 页面
      if (!tab.url || (!tab.url.includes('x.com') && !tab.url.includes('twitter.com'))) {
        showStatus('请在 X (Twitter) 页面使用此扩展', 'error');
        return;
      }

      // 检查是否在推文详情页
      if (!tab.url.includes('/status/')) {
        showStatus('请在推文详情页使用此扩展', 'error');
        return;
      }

      // 发送消息给 content script
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractTweet' });

      if (response && response.success) {
        currentMarkdown = response.markdown;
        currentTweetData = response.tweetData;
        showStatus('转换成功！', 'success');
        showPreview(currentMarkdown);
        setTimeout(hideStatus, 2000);
      } else {
        showStatus(response?.error || '提取失败，请刷新页面后重试', 'error');
      }
    } catch (error) {
      console.error('Extraction error:', error);
      showStatus('提取失败，请确保页面已完全加载', 'error');
    } finally {
      extractBtn.disabled = false;
      extractBtn.classList.remove('loading');
    }
  }

  /**
   * 复制到剪贴板
   */
  async function copyToClipboard() {
    if (!currentMarkdown) return;

    try {
      await navigator.clipboard.writeText(currentMarkdown);
      copyBtn.textContent = '✅ 已复制';
      setTimeout(() => {
        copyBtn.textContent = '📋 复制';
      }, 2000);
    } catch (error) {
      console.error('Copy error:', error);
      // 降级方案
      markdownOutput.select();
      document.execCommand('copy');
      copyBtn.textContent = '✅ 已复制';
      setTimeout(() => {
        copyBtn.textContent = '📋 复制';
      }, 2000);
    }
  }

  /**
   * 下载为 MD 文件 - 使用文章标题作为文件名，保存到 Obsidian
   */
  function downloadAsFile() {
    if (!currentMarkdown || !currentTweetData) return;

    // 生成文件名：优先使用文章标题，否则使用作者名
    let filename;
    if (currentTweetData.title && currentTweetData.title.trim()) {
      // 清理标题中不能用于文件名的字符
      filename = currentTweetData.title
        .trim()
        .replace(/[\\/:*?"<>|]/g, '') // 移除非法字符
        .replace(/\s+/g, '_')          // 空格转下划线
        .substring(0, 100);            // 限制长度
    } else {
      // 使用作者名和时间作为备选
      filename = `${currentTweetData.displayName || currentTweetData.username}_${new Date().toISOString().slice(0, 10)}`;
      filename = filename.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '_');
    }
    
    filename = `${filename}.md`;
    
    // 使用 Chrome downloads API 保存到 Downloads 目录
    const blob = new Blob([currentMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    chrome.downloads.download({
      url: url,
      filename: filename,  // 直接保存到 Downloads 目录
      saveAs: false  // 不弹出保存对话框
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('Download error:', chrome.runtime.lastError);
        // 降级：使用普通下载
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      URL.revokeObjectURL(url);
    });

    downloadBtn.textContent = '✅ 已保存';
    setTimeout(() => {
      downloadBtn.textContent = '💾 下载';
    }, 2000);
  }

  // 绑定事件
  extractBtn.addEventListener('click', extractAndConvert);
  copyBtn.addEventListener('click', copyToClipboard);
  downloadBtn.addEventListener('click', downloadAsFile);
});
