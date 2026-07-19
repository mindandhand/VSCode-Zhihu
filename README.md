<p align="center">
  <img src="./res/media/extension.png" alt="Zhihu On VSCode" width="160" />
</p>

# Zhihu On VSCode

在 VS Code 中阅读、搜索和创作知乎内容的扩展。支持 Markdown、LaTeX、表格、Mermaid 和图片上传，并可将文章或回答直接发布到知乎。

本仓库是 [niudai/VSCode-Zhihu](https://github.com/niudai/VSCode-Zhihu) 的社区维护版本，主要适配当前的知乎登录状态和 VS Code 扩展运行环境。

## 维护状态

- 当前版本推荐使用浏览器 Cookie 登录。
- 知乎接口并非公开稳定 API，部分能力可能因网站调整暂时失效。
- 版本变化记录在 [CHANGELOG.md](./CHANGELOG.md)；遇到问题请提交 [Issue](https://github.com/mindandhand/VSCode-Zhihu/issues)。

## 核心功能

- 浏览个性推荐、实时热榜和收藏夹。
- 搜索知乎内容，查看已发表文章和草稿箱。
- 使用 Markdown 创作并发布文章或回答。
- 支持块级与行内 LaTeX、Markdown 表格和 Mermaid 图表。
- 上传剪贴板图片、本地图片或工作区图片。
- 识别文档首行的知乎链接，发布新内容或更新已有内容。

## 安装

发布到 VS Code Marketplace 后，可搜索 `Zhihu On VSCode Maintained`，或使用命令行安装：

```bash
code --install-extension mindandhand.vscode-zhihu-maintained
```

也可以从 [GitHub Releases](https://github.com/mindandhand/VSCode-Zhihu/releases) 下载 `.vsix` 文件后安装：

```bash
code --install-extension <下载的文件>.vsix
```

## 快速开始

### 1. 登录

打开命令面板（`Ctrl/Cmd + Shift + P`），执行 `Zhihu: Login`。扩展会打开独立浏览器窗口；在该窗口完成知乎登录后，扩展会读取当前会话 Cookie。

如果自动获取失败，可按扩展提示从 `www.zhihu.com` 请求中复制完整 Cookie。Cookie 属于敏感信息，请勿写入文档、代码仓库或 Issue。

### 2. 阅读与搜索

点击活动栏中的知乎图标，可查看推荐、热榜和收藏内容。登录后，“推荐”视图还会显示已发表文章和草稿箱。

执行 `Zhihu: Search Items` 可以搜索知乎内容；列表未更新时可使用对应的刷新按钮或命令。

### 3. 创作

新建或打开 Markdown 文件，使用 VS Code 自带的 Markdown 预览检查排版。扩展支持：

- 块级公式：`$$ ... $$`
- 行内公式：`$ ... $`
- 带语言标识的代码块
- Markdown 表格
- Mermaid 图表（需要开启 `zhihu.enableMermaidToPng`）

### 4. 发布

在 Markdown 编辑器中执行 `Zhihu: Publish`。

要回答问题或更新已有内容，可将目标链接放在文档第一行：

```markdown
#! https://www.zhihu.com/question/19602618
```

```markdown
#! https://www.zhihu.com/question/355223335/answer/1003461264
```

```markdown
#! https://zhuanlan.zhihu.com/p/107810342
```

发布文章时，文档中的第一个一级标题会作为文章标题；标题之前的第一张图片可作为题图。没有首行链接时，扩展会提示选择发布方式。

### 5. 上传图片

扩展支持 `.gif`、`.png` 和 `.jpg` 图片，并会在当前 Markdown 光标位置插入上传后的链接：

- `Zhihu: Paste Image From Clipboard`：上传剪贴板图片。
- `Zhihu: Upload Image From Path`：上传工作区中的图片。
- `Zhihu: Upload Image From Explorer`：从文件选择器上传图片。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `Zhihu: Login` | 登录知乎 |
| `Zhihu: Logout` | 退出登录 |
| `Zhihu: Refresh Feed` | 刷新推荐内容 |
| `Zhihu: Refresh HotStories` | 刷新热榜 |
| `Zhihu: Refresh Collection` | 刷新收藏夹 |
| `Zhihu: Search Items` | 搜索知乎内容 |
| `Zhihu: Publish` | 发布当前 Markdown 文档 |
| `Zhihu: Clear Cache` | 清理扩展缓存 |

图片上传的默认快捷键：

| 操作 | Windows / Linux | macOS |
| --- | --- | --- |
| 剪贴板上传 | `Ctrl+Alt+P` | `Cmd+Alt+P` |
| 路径上传 | `Ctrl+Alt+Q` | `Cmd+Alt+P` |
| 文件选择器上传 | `Ctrl+Alt+F` | `Cmd+Alt+E` |

> 当前 macOS 配置中，剪贴板上传和路径上传使用相同快捷键；如有冲突，可在 VS Code 的“键盘快捷方式”中重新绑定。

## 配置

| 配置项 | 默认值 | 作用 |
| --- | --- | --- |
| `zhihu.useVSTheme` | `true` | Webview 使用 VS Code 主题色 |
| `zhihu.isTitleImageFullScreen` | `false` | 文章题图使用全尺寸显示 |
| `zhihu.useWaterMark` | `false` | 启用水印 |
| `zhihu.enableMermaidToPng` | `false` | 将 Mermaid 图表转换为图片后上传 |
| `zhihu.mermaidTheme` | `default` | 设置 Mermaid 主题，例如 `dark` |

## 本地开发

环境要求：Node.js、npm 和 VS Code。

```bash
npm install --legacy-peer-deps
npm run compile
npm test
```

开发监听和生产构建：

```bash
npm run develop
npm run vscode:prepublish
```

在 VS Code 中打开本仓库后，按 `F5` 启动 Extension Development Host 进行调试。

## 已知限制与反馈

- 浏览器 Cookie 登录是当前推荐入口；扩展内置密码、验证码和第三方登录链路不作为稳定能力维护。
- 知乎风控或接口变更可能导致登录、列表加载、图片上传或发布暂时不可用。
- 报告问题时请附上 VS Code 版本、扩展版本、复现步骤和已脱敏的错误日志，切勿提交 Cookie。

问题反馈：[GitHub Issues](https://github.com/mindandhand/VSCode-Zhihu/issues)

## 支持与赞赏

如果这个扩展对你有帮助，可以通过[爱发电](https://ifdian.net/a/mindandhand)支持项目的长期维护。

赞赏完全自愿，不影响扩展功能、版本更新、技术支持或 Issue 处理。赞赏将用于接口适配、问题修复和版本发布。

## 相关链接与致谢

- [当前维护仓库](https://github.com/mindandhand/VSCode-Zhihu)
- [版本更新记录](./CHANGELOG.md)
- [支持说明](./SUPPORT.md)
- [贡献指南](./CONTRIBUTING.md)
- [原项目 niudai/VSCode-Zhihu](https://github.com/niudai/VSCode-Zhihu)
- 原作者：[牛岱](https://www.zhihu.com/people/niu-dai-68-44)

感谢原作者和所有贡献者打下的基础。如果这个维护版对你有帮助，欢迎为当前仓库点一个 Star。
