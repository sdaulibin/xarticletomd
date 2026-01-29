/**
 * Content Script - 从 X 页面提取推文/文章内容
 * 支持普通推文和 X Articles（长文章）
 */

class TweetExtractor {
  constructor() {
    this.currentUrl = window.location.href;
    this.isArticle = false;
  }

  /**
   * 提取当前页面的推文/文章数据
   */
  extract() {
    console.log('[X to MD] 开始提取内容...');
    
    // 检测是否为 X Article（长文章）
    const longformContent = document.querySelector('[data-testid="longformRichTextComponent"]');
    const richTextView = document.querySelector('[data-testid="twitterArticleRichTextView"]');
    const container = longformContent || richTextView;
    
    console.log('[X to MD] DOM 检测:', {
      hasLongformContent: !!longformContent,
      hasRichTextView: !!richTextView
    });
    
    // 如果找到长文章内容容器，使用文章提取逻辑
    if (container) {
      this.isArticle = true;
      console.log('[X to MD] 检测到 X Article');
      return this.extractArticle(container);
    }

    // 查找普通推文 article 元素
    const article = this.findMainTweetArticle();
    if (!article) {
      console.error('[X to MD] 未找到推文元素');
      return null;
    }

    const tweetData = {
      url: this.currentUrl,
      username: this.extractUsername(article),
      displayName: this.extractDisplayName(article),
      content: this.extractContent(article),
      timestamp: this.extractTimestamp(article),
      images: this.extractImages(article),
      videoThumbnail: this.extractVideoThumbnail(article),
      quotedTweet: this.extractQuotedTweet(article),
      stats: this.extractStats(article),
      isArticle: false
    };

    return tweetData;
  }

  /**
   * 提取 X Article（长文章）内容
   */
  extractArticle(container) {
    const authorArticle = document.querySelector('article[data-testid="tweet"]');
    
    // 提取文章内容 - 保持图文顺序
    const content = this.extractArticleContentPreserveOrder(container);
    console.log('[X to MD] 提取的文章内容长度:', content.length);
    
    const articleData = {
      url: this.currentUrl,
      username: this.extractUsername(authorArticle || document),
      displayName: this.extractDisplayName(authorArticle || document),
      title: this.extractArticleTitle(),
      content: content,
      timestamp: this.extractTimestamp(authorArticle || document),
      images: [], // 图片已内嵌在 content 中
      videoThumbnail: null,
      quotedTweet: null,
      stats: authorArticle ? this.extractStats(authorArticle) : {},
      isArticle: true
    };

    return articleData;
  }

  /**
   * 提取文章标题
   */
  extractArticleTitle() {
    const titleEl = document.querySelector('[data-testid="twitter-article-title"]');
    if (titleEl) {
      return titleEl.innerText.trim();
    }
    return '';
  }

  /**
   * 提取文章内容，保持图文混排顺序
   * X Article 的 DOM 结构: container > wrapper div > content blocks (text/images)
   */
  extractArticleContentPreserveOrder(container) {
    if (!container) return '';
    
    // 获取第一个子元素（wrapper div）
    const wrapper = container.children[0];
    if (!wrapper) {
      // 如果没有 wrapper，直接使用 container
      return container.innerText || '';
    }
    
    const contentBlocks = wrapper.children;
    console.log('[X to MD] 内容块数量:', contentBlocks.length);
    
    const markdownParts = [];
    
    for (let i = 0; i < contentBlocks.length; i++) {
      const block = contentBlocks[i];
      const tagName = block.tagName.toUpperCase();
      const className = block.className || '';
      
      // 检查是否包含图片
      const img = block.querySelector('img');
      if (img) {
        const src = img.getAttribute('src');
        if (src && src.includes('pbs.twimg.com/media')) {
          // 处理图片 URL 获取高质量版本
          const largeSrc = src.replace(/&name=\w+/, '&name=large')
                              .replace(/\?format=(\w+)&name=\w+/, '?format=$1&name=large');
          markdownParts.push(`\n![图片](${largeSrc})\n`);
        }
        continue;
      }
      
      // 获取文本内容
      const text = block.innerText?.trim();
      if (!text) continue;
      
      // 根据元素类型格式化
      if (tagName === 'BLOCKQUOTE' || className.includes('blockquote')) {
        // 引用块
        const lines = text.split('\n');
        const quoted = lines.map(line => `> ${line}`).join('\n');
        markdownParts.push(`\n${quoted}\n`);
      } else if (tagName === 'UL' || tagName === 'OL') {
        // 列表
        const items = block.querySelectorAll('li');
        items.forEach(item => {
          markdownParts.push(`- ${item.innerText.trim()}\n`);
        });
        markdownParts.push('\n');
      } else if (className.includes('header') || (text.length < 80 && !text.includes('\n') && i > 0)) {
        // 可能是标题（短文本且不包含换行）
        // 但要避免把正文第一段误判为标题
        const prevBlock = i > 0 ? contentBlocks[i-1] : null;
        const prevWasImage = prevBlock && prevBlock.querySelector('img');
        if (prevWasImage && text.length < 60) {
          markdownParts.push(`\n### ${text}\n`);
        } else {
          markdownParts.push(`\n${text}\n`);
        }
      } else {
        // 普通段落
        markdownParts.push(`\n${text}\n`);
      }
    }
    
    // 清理多余换行
    let result = markdownParts.join('');
    result = result.replace(/\n{3,}/g, '\n\n');
    result = result.trim();
    
    return result;
  }

  /**
   * 查找主推文的 article 元素
   */
  findMainTweetArticle() {
    if (this.currentUrl.includes('/status/')) {
      const articles = document.querySelectorAll('article[data-testid="tweet"]');
      if (articles.length > 0) {
        return articles[0];
      }
    }
    return null;
  }

  /**
   * 提取用户名 (@handle)
   */
  extractUsername(article) {
    const urlMatch = this.currentUrl.match(/x\.com\/([^\/]+)\/status/);
    if (urlMatch) {
      return urlMatch[1];
    }

    if (article) {
      const userNameEl = article.querySelector ? 
        article.querySelector('[data-testid="User-Name"]') : 
        document.querySelector('[data-testid="User-Name"]');
      if (userNameEl) {
        const handleEl = userNameEl.querySelector('a[href^="/"]');
        if (handleEl) {
          return handleEl.getAttribute('href').replace('/', '');
        }
      }
    }

    return 'unknown';
  }

  /**
   * 提取显示名称
   */
  extractDisplayName(article) {
    const userNameEl = article && article.querySelector 
      ? article.querySelector('[data-testid="User-Name"]') 
      : document.querySelector('[data-testid="User-Name"]');
      
    if (userNameEl) {
      const spans = userNameEl.querySelectorAll('span');
      for (const span of spans) {
        const text = span.textContent.trim();
        if (text && !text.startsWith('@') && text.length > 0) {
          return text;
        }
      }
    }
    return this.extractUsername(article);
  }

  /**
   * 提取推文正文内容
   */
  extractContent(article) {
    const tweetTextEl = article.querySelector('[data-testid="tweetText"]');
    if (tweetTextEl) {
      return this.getTextWithLineBreaks(tweetTextEl);
    }
    return '';
  }

  /**
   * 获取元素文本，保留换行
   */
  getTextWithLineBreaks(element) {
    let text = '';
    element.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === 'BR') {
          text += '\n';
        } else if (node.tagName === 'A') {
          text += node.textContent;
        } else if (node.tagName === 'IMG') {
          const alt = node.getAttribute('alt');
          if (alt) text += alt;
        } else {
          text += this.getTextWithLineBreaks(node);
        }
      }
    });
    return text;
  }

  /**
   * 提取发布时间
   */
  extractTimestamp(article) {
    const timeEl = article && article.querySelector 
      ? article.querySelector('time') 
      : document.querySelector('time');
    if (timeEl) {
      const datetime = timeEl.getAttribute('datetime');
      if (datetime) {
        const date = new Date(datetime);
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      return timeEl.textContent;
    }
    return '';
  }

  /**
   * 提取图片 URL 列表
   */
  extractImages(article) {
    const images = [];
    const photoEls = article.querySelectorAll('[data-testid="tweetPhoto"] img');
    photoEls.forEach(img => {
      let src = img.getAttribute('src');
      if (src) {
        src = src.replace(/\?format=\w+&name=\w+/, '?format=jpg&name=large');
        if (!images.includes(src)) {
          images.push(src);
        }
      }
    });
    return images;
  }

  /**
   * 提取视频缩略图
   */
  extractVideoThumbnail(article) {
    const videoEl = article.querySelector('[data-testid="videoPlayer"]');
    if (videoEl) {
      const poster = videoEl.querySelector('video')?.getAttribute('poster');
      if (poster) return poster;
      const thumbImg = videoEl.querySelector('img');
      if (thumbImg) return thumbImg.getAttribute('src');
    }
    return null;
  }

  /**
   * 提取引用推文
   */
  extractQuotedTweet(article) {
    const quotedTweetEl = article.querySelector('[data-testid="quoteTweet"]');
    if (!quotedTweetEl) return null;

    return {
      username: this.extractUsernameFromQuote(quotedTweetEl),
      displayName: this.extractDisplayNameFromQuote(quotedTweetEl),
      content: this.extractContentFromQuote(quotedTweetEl)
    };
  }

  extractUsernameFromQuote(el) {
    const link = el.querySelector('a[href*="/status/"]');
    if (link) {
      const match = link.getAttribute('href').match(/\/([^\/]+)\/status/);
      if (match) return match[1];
    }
    return 'unknown';
  }

  extractDisplayNameFromQuote(el) {
    const spans = el.querySelectorAll('span');
    for (const span of spans) {
      const text = span.textContent.trim();
      if (text && !text.startsWith('@') && text.length > 1) {
        return text;
      }
    }
    return this.extractUsernameFromQuote(el);
  }

  extractContentFromQuote(el) {
    const textEl = el.querySelector('[data-testid="tweetText"]');
    if (textEl) {
      return this.getTextWithLineBreaks(textEl);
    }
    return '';
  }

  /**
   * 提取互动统计数据
   */
  extractStats(article) {
    const stats = {};

    const replyBtn = article.querySelector('[data-testid="reply"]');
    if (replyBtn) stats.replies = this.parseStatNumber(replyBtn);

    const retweetBtn = article.querySelector('[data-testid="retweet"]');
    if (retweetBtn) stats.retweets = this.parseStatNumber(retweetBtn);

    const likeBtn = article.querySelector('[data-testid="like"]');
    if (likeBtn) stats.likes = this.parseStatNumber(likeBtn);

    const viewsEl = article.querySelector('a[href*="/analytics"]');
    if (viewsEl) {
      const text = viewsEl.textContent;
      if (text) stats.views = text.replace(/[^0-9KMkm.]/g, '');
    }

    return stats;
  }

  parseStatNumber(buttonEl) {
    const text = buttonEl.textContent.trim();
    const match = text.match(/[\d,.]+[KMkm]?/);
    return match ? match[0] : '0';
  }
}

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[X to MD] 收到消息:', request);
  
  if (request.action === 'extractTweet') {
    try {
      const extractor = new TweetExtractor();
      const tweetData = extractor.extract();

      if (tweetData) {
        const markdown = window.MarkdownConverter.convert(tweetData);
        console.log('[X to MD] 生成的 Markdown 长度:', markdown.length);
        sendResponse({ success: true, markdown: markdown, tweetData: tweetData });
      } else {
        sendResponse({ success: false, error: '无法提取推文内容，请确保在推文详情页使用此扩展' });
      }
    } catch (error) {
      console.error('[X to MD] 提取错误:', error);
      sendResponse({ success: false, error: '提取过程出错: ' + error.message });
    }
  }
  return true;
});

console.log('[X to MD] Content script loaded');
