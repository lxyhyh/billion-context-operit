# AGENTS.md

> 本文件面向 AI 编码代理（Claude Code / Cursor / Copilot 等）。人类贡献者请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 项目是什么

`billion-context-operit` 是运行在 **Operit**（Android）内的 ToolPkg 插件：在 Operit 内置的 Ubuntu/PRoot 容器中**一键安装与管理官方原版 billion-context Proxy**。

- **本插件只是 Launcher / Manager**，不重新实现 billion-context 的任何核心功能。
- 真正的 Context Engine（ACP：压缩/搜索/session）由官方 Proxy 自己完成。
- 不保存 API Key，不修改 Operit Kotlin。

## 关键事实（先读这些再动手）

- **入口**：`src/main.js`（ToolPkg 入口）；**工具实现**：`src/packages/bili_manager.js`（全部管理工具，METADATA + exports 成对）。
- **UI**：`src/ui/bili_console/index.ui.js`（管理页）、`src/ui/bili_config/index.ui.js`（配置页），用 Compose DSL 编写。
- **版本号唯一来源**：`manifest.json` 的 `version` 字段（当前 0.3.0）。`packages/bili_manager.js` 中 `PACKAGE_VERSION` 需与其同步；`scripts/build.sh` 与 `.github/workflows/ci.yml` 从 manifest 读取版本号打包。
- **打包产物**：`dist/com.operit.billion_context-v<version>.toolpkg`（`dist/`、`*.toolpkg` 已在 `.gitignore`，不上传 GitHub）。

## 架构约束（严格遵守）

- 不重新实现 billion-context。
- 终端仅用 `Tools.System.terminal`（visible session）；服务进程 `nohup setsid` 脱离 terminal 生命周期；健康以 HTTP 为准。

## 开发与提交规则

1. **新增工具必须成对同步**：`packages/bili_manager.js` 顶部 `METADATA` 与底部 `exports.xxx` 必须同时出现，否则工具**静默不注册**。本地 `bash scripts/build.sh` 与云端 CI 均有 16/16 一致性自查。
2. **UI 铁律**（踩坑记录，违反必出 bug）：
   - `render` 必须纯函数；`setState` 只在 action 窗口（onLoad/onClick async handler）。
   - 所有 `ctx.callTool` 走全局串行队列（bridge 并发响应错配免疫）。
   - 关键操作在 onClick/onLoad 的 await 链内完成（120s action 窗口）；异步 setState 不触发重绘。
   - 展示上限 100 条，不分页。
   - 卡片背景用 `T.surfaceVariant`（`T.surface` 与全屏背景混为一体）。
   - 长表单必须用 `LazyColumn`（Column 不可滚动）。
3. **提交信息**：`feat:` / `fix:` / `chore:` / `docs:` 前缀 + 中文描述。
4. **改 UI 后必须重启 Operit**：UI 注册是应用启动时的快照，不重启会出现新旧 UI 混合。
5. **产物复制**：需要交付的产物（如 `.toolpkg`）复制到 `/sdcard/Download/`。

## 验证

```bash
bash scripts/build.sh   # 本地全绿（语法 + manifest JSON + 工具一致性 16/16）；云端 push 后 CI 自动执行
```

## 目录结构

```
src/
  main.js                  # ToolPkg 入口
  packages/bili_manager.js # 全部管理工具（METADATA + exports 同步）
  ui/bili_console/         # 管理页 UI
  ui/bili_config/          # 配置页 UI
manifest.json              # 包清单（版本号在此维护）
scripts/build.sh           # 本地打包脚本（仅本地，不上传；云端 CI 内联相同逻辑）
.github/workflows/ci.yml   # CI（云端构建）
LICENSE / CHANGELOG.md / CONTRIBUTING.md / SECURITY.md / AGENTS.md
```
