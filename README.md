# X Article to Markdown

一个 Chrome 浏览器扩展，将 X (Twitter) 上的推文和长文章（X Articles）转换为 Markdown 格式。

![X to Markdown](icons/icon128.png)

## ✨ 功能特点

- 🔄 **一键转换**: 在 X 推文/文章页面点击扩展图标，自动提取并转换
- 📝 **支持长文章**: 完整支持 X Articles（长文章），保持图文混排结构
- 🖼️ **图文混排**: 图片按原文位置内嵌在 Markdown 中
- 📋 **复制粘贴**: 一键复制转换后的 Markdown 到剪贴板
- 💾 **智能命名**: 下载文件自动以文章标题命名
- 🌙 **暗色主题**: UI 设计匹配 X 风格

## 📦 安装方法

### 开发者模式安装

1. 下载或克隆此仓库到本地
   ```bash
   git clone https://github.com/sdaulibin/xarticletomd.git
   ```
2. 打开 Chrome 浏览器，访问 `chrome://extensions/`
3. 开启右上角的 **"开发者模式"**
4. 点击 **"加载已解压的扩展程序"**
5. 选择本项目目录

## 🚀 使用方法

1. 访问任意 X (Twitter) 推文或文章详情页
   - 普通推文: `https://x.com/username/status/123456789`
   - 长文章: `https://x.com/username/status/123456789` (X Articles)
2. 点击浏览器工具栏中的扩展图标
3. 点击 **"提取并转换"** 按钮
4. 预览生成的 Markdown 内容
5. 使用 **"复制"** 或 **"下载"** 按钮保存内容

## 📄 输出示例

### 普通推文

```markdown
# 显示名称 (@username) 的推文

> 📅 发布时间: 2025/01/21 12:00

---

这是推文的正文内容...

**@mention** 和 **#hashtag** 会被高亮显示

![图片 1](https://pbs.twimg.com/media/xxx.jpg)

---

**互动数据:** 💬 123 | 🔁 456 | ❤️ 789 | 👁️ 10K

[🔗 查看原文](https://x.com/username/status/123456789)
```

### X Article（长文章）

```markdown
# 文章标题

> 作者: **显示名称** (@username)

> 📅 发布时间: 2025/01/21 12:00

---

文章正文内容，支持多段落...

![图片](https://pbs.twimg.com/media/xxx.jpg)

更多文章内容，图片按原文位置显示...

---

[🔗 查看原文](https://x.com/username/status/123456789)
```

## 🛠️ 技术栈

- Chrome Extension Manifest V3
- Vanilla JavaScript
- CSS3 with CSS Variables
- Chrome Downloads API

## 📁 项目结构

```
xarticletomd/
├── manifest.json              # 扩展配置文件
├── popup/
│   ├── popup.html            # 弹出窗口 HTML
│   ├── popup.css             # 弹出窗口样式（暗色主题）
│   └── popup.js              # 交互逻辑
├── content/
│   └── content.js            # 页面内容提取脚本
├── lib/
│   └── markdown-converter.js # Markdown 转换器
├── background/
│   └── service-worker.js     # 后台服务
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## ⚠️ 注意事项

- 本扩展支持在 **推文详情页** 和 **X Article 页面** 使用（URL 包含 `/status/`）
- X 网站的 DOM 结构可能会变化，如遇问题请提交 Issue
- 视频内容仅提取缩略图，不支持下载视频
- 下载的文件会保存到系统默认的 Downloads 目录

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📝 许可证

MIT License
