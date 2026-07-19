# 贡献指南

感谢你愿意参与 Zhihu On VSCode Maintained 的维护。提交代码前，建议先通过 [Issue](https://github.com/mindandhand/VSCode-Zhihu/issues) 说明问题或方案，避免重复工作。

## 准备环境

需要安装 Git、Node.js、npm 和 VS Code。本项目依赖版本较旧；如果安装或构建失败，请在 Issue 中附上 Node.js 与 npm 版本。

```bash
git clone https://github.com/mindandhand/VSCode-Zhihu.git
cd VSCode-Zhihu
npm install --legacy-peer-deps
```

项目包含部分旧版构建依赖，当前 npm 需要 `--legacy-peer-deps` 才能保留其既有 peer 关系。

## 开发与调试

启动 webpack 监听：

```bash
npm run develop
```

在 VS Code 中打开仓库，按 `F5` 启动 Extension Development Host。修改源代码后，先确认相关功能能在开发宿主中正常使用。

请不要通过直接修改 `node_modules` 修复问题；依赖兼容调整应记录在源码、构建配置或补丁文件中，确保其他贡献者能够复现。

## 提交前检查

```bash
npm run compile
npm run lint
npm test
npm run vscode:prepublish
```

集成测试会启动 VS Code 测试宿主，首次运行可能需要下载对应版本。若测试宿主无法启动，请在 Pull Request 中说明环境和日志，但不要省略能够运行的编译、Lint 与生产构建检查。

## Marketplace 打包

当前默认分支为 `master`，README 使用了仓库内的相对图片和文档链接。使用 `vsce` 打包或发布时需要明确指定该分支：

```bash
npx @vscode/vsce package --githubBranch master
npx @vscode/vsce publish --githubBranch master
```

发布命令会修改外部 Marketplace 状态，只应由获得 publisher 权限的维护者执行。

## Pull Request

- 一个 Pull Request 聚焦一个问题或功能。
- 描述修改动机、实现方式和验证步骤。
- 用户可见变化应同步更新 README 或 `CHANGELOG.md`。
- 不要提交 Cookie、验证码、账号信息、日志中的鉴权字段或本地缓存文件。
- 保留原项目的许可证和作者署名。

## 报告问题

问题报告所需信息和脱敏要求见 [SUPPORT.md](./SUPPORT.md)。
