/**
 * Markdown Converter - 将推文数据转换为 Markdown 格式
 */

class MarkdownConverter {
  /**
   * 将推文数据转换为 Markdown 字符串
   * @param {Object} tweetData - 推文数据对象
   * @returns {string} Markdown 格式的字符串
   */
  static convert(tweetData) {
    const lines = [];

    // 判断是否为长文章
    if (tweetData.isArticle && tweetData.title) {
      // 文章标题
      lines.push(`# ${tweetData.title}`);
      lines.push("");
      lines.push(`> 作者: **${tweetData.displayName}** (@${tweetData.username})`);
    } else {
      // 普通推文标题
      lines.push(`# ${tweetData.displayName} (@${tweetData.username}) 的推文`);
    }
    lines.push("");

    // 元信息
    if (tweetData.timestamp) {
      lines.push(`> 📅 发布时间: ${tweetData.timestamp}`);
      lines.push("");
    }

    // 分隔线
    lines.push("---");
    lines.push("");

    // 推文/文章正文
    if (tweetData.content) {
      // 文章内容可能已经包含格式，不做过多处理
      if (tweetData.isArticle) {
        lines.push(tweetData.content);
      } else {
        lines.push(this.formatContent(tweetData.content));
      }
      lines.push("");
    }

    // 图片
    if (tweetData.images && tweetData.images.length > 0) {
      lines.push("");
      tweetData.images.forEach((img, index) => {
        lines.push(`![图片 ${index + 1}](${img})`);
        lines.push("");
      });
    }

    // 视频缩略图
    if (tweetData.videoThumbnail) {
      lines.push("");
      lines.push(`> 🎬 视频推文`);
      lines.push(`> ![视频缩略图](${tweetData.videoThumbnail})`);
      lines.push("");
    }

    // 引用推文
    if (tweetData.quotedTweet) {
      lines.push("");
      lines.push("> **引用推文:**");
      lines.push(
        `> **${tweetData.quotedTweet.displayName}** (@${tweetData.quotedTweet.username})`,
      );
      if (tweetData.quotedTweet.content) {
        const quotedLines = tweetData.quotedTweet.content.split("\n");
        quotedLines.forEach((line) => {
          lines.push(`> ${line}`);
        });
      }
      lines.push("");
    }

    // 分隔线
    lines.push("---");
    lines.push("");

    // 互动数据
    if (tweetData.stats && Object.keys(tweetData.stats).length > 0) {
      const statsLine = [];
      if (tweetData.stats.replies !== undefined) {
        statsLine.push(`💬 ${this.formatNumber(tweetData.stats.replies)}`);
      }
      if (tweetData.stats.retweets !== undefined) {
        statsLine.push(`🔁 ${this.formatNumber(tweetData.stats.retweets)}`);
      }
      if (tweetData.stats.likes !== undefined) {
        statsLine.push(`❤️ ${this.formatNumber(tweetData.stats.likes)}`);
      }
      if (tweetData.stats.views !== undefined) {
        statsLine.push(`👁️ ${this.formatNumber(tweetData.stats.views)}`);
      }
      if (statsLine.length > 0) {
        lines.push(`**互动数据:** ${statsLine.join(" | ")}`);
        lines.push("");
      }
    }

    // 原文链接
    if (tweetData.url) {
      lines.push(`[🔗 查看原文](${tweetData.url})`);
      lines.push("");
    }

    return lines.join("\n");
  }

  /**
   * 格式化推文内容
   * - 保留 @ 提及
   * - 保留 # 话题标签
   * - 处理链接
   */
  static formatContent(content) {
    let formatted = content;

    // @ 提及 - 转为粗体
    formatted = formatted.replace(/@(\w+)/g, "**@$1**");

    // # 话题 - 转为粗体
    formatted = formatted.replace(/#(\w+)/g, "**#$1**");

    return formatted;
  }

  /**
   * 格式化数字 (处理 K, M 等缩写)
   */
  static formatNumber(num) {
    if (typeof num === "string") {
      return num;
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  }
}

// 导出供其他脚本使用
if (typeof window !== "undefined") {
  window.MarkdownConverter = MarkdownConverter;
}
