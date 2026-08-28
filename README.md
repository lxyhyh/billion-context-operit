# billion-context-operit

[![CI](https://github.com/lxyhyh/billion-context-operit/actions/workflows/ci.yml/badge.svg)](https://github.com/lxyhyh/billion-context-operit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.3.0-blue.svg)](CHANGELOG.md)

在 Operit 内置 Ubuntu/PRoot 容器中**一键安装与管理官方原版 billion-context Proxy** 的 ToolPkg。

> **本插件只是 Launcher / Manager。** billion-context 是真正的 Context Engine，ACP（压缩/搜索/session）全部由官方 Proxy 自己完成。本插件**不重新实现** billion-context 的任何核心功能，不保存 API Key。

## 最终运行架构

```
Operit
  ↓ Provider Base URL
  ↓ http://127.0.0.1:8787/bili/<upstream>
  ↓ billion-context Proxy（本插件安装/管理）
  ↓ acp-kernel
  ↓ 真实 Provider
```

## 功能

### 管理工具（`bili_manager` 子包）

| 工具 | 说明 |
|---|---|
| `detect` | 检测 node / npm / bili 版本与路径 |
| `install` | bili 缺失时 `npm install -g billion-context`，装后验证 `bili --version`；node/npm 缺失则报告缺 Node runtime（不自行下载） |
| `start` | `nohup setsid bili --host 127.0.0.1 --port 8787` 后台启动，PID 写文件，轮询 `GET /__bili/health` 直到 `{"ok":true,...}` |
| `stop` | 按 PID 文件精确停止（进程组），无 PID 时按端口/进程名兜底，确认 health 失败 |
| `restart` | stop + start |
| `status` | 进程/PID/health/版本/端口/日志存在性 |
| `health` | 探测 `/__bili/health`，仅 `ok=true` 报告 healthy |
| `version` | bili 版本、bili 路径、node/npm 版本 |
| `update` | 官方 `bili update` |
| `logs` | 官方 `~/.local/state/billion-context/bili.log` 尾部（默认 200 行，最多 800） |
| `proxy_url` | 输入 upstream_base_url → `http://127.0.0.1:<port>/bili/<原 URL>`（不 encode 整个 URL，不追加任何 endpoint） |
| `bili_config_get` | 读取官方 `GET /__bili/config`，返回 path/providers/upstreamProxy/upstreamProxyMode/compress/parseError |
| `bili_config_set` | 写入官方配置（providers/upstreamProxy/upstreamProxyMode/compress），HTTP 409 透出官方 parseError；providers 变更后需重载 |
| `bili_config_clear` | 清空已保存的官方配置覆盖 |
| `bili_config_reload` | `POST /__bili/config/reload` 强制重载配置文件 |
| `bili_config_hot_apply` | `PUT /__bili/config` 热更新 compress 配置，无需重启即生效 |

### UI（Compose DSL）

- **管理页**（`bili_console`）：安装/运行状态、版本、PID、health 响应；启动/停止/重启/安装/更新/健康检查/刷新/检测；日志读取；upstream → Proxy URL 生成/复制
- **配置页**（`bili_config`）：可视化编辑官方配置文件（路径、providers、upstream、compress 阈值/上下文限制/tiers 等），支持加载/保存/热更新/重载/重置；标「可热更新」的 compress 字段保存后点「热更新」即生效，基础设置改动需重启
- UI 不自行维护服务状态，全部通过工具读取真实状态；配色跟随系统深浅色模式（MaterialTheme token）

## 使用

1. 安装插件（`.toolpkg` 导入或 `debug_install_toolpkg`），**重启 Operit**。
2. 打开工具箱「billion-context 管理」。
3. 点击「检测」确认 node/npm/bili 情况 → 点击「安装」（仅首次）。
4. 点击「启动」，等待健康检查通过（显示 `ok=true`）。
5. 在输入框填入 upstream Base URL（如 `https://api.openai.com/v1`），点击「生成」得到 Proxy URL。
6. 在 Operit Provider 设置中，把 Base URL 改为生成的 Proxy URL，API Key 保持原样。
7. 正常对话即可；长上下文时 billion-context 自行注入 ACP 并让模型主动 compress。
8. 需要调优时打开「配置」页编辑保存；compress 相关字段可「热更新」即时生效。

## 验收闭环

安装插件 → 点击安装 → 点击启动 → 健康检查成功 → Provider Base URL 改成 Proxy URL → 正常对话 → 长上下文时 billion-context 自己注入 ACP 并让模型主动 compress。

## 架构约束（严格遵守）

- 不重新实现 billion-context。
- 终端仅用 `Tools.System.terminal`（visible session），服务进程 `nohup setsid` 脱离 terminal 生命周期，健康以 HTTP 为准。

## 目录结构

```
src/
  main.js                  # ToolPkg 入口
  packages/bili_manager.js # 全部管理工具（METADATA + exports 同步）
  ui/bili_console/         # 管理页 UI
  ui/bili_config/          # 配置页 UI
manifest.json              # 包清单（版本号在此维护）
scripts/build.sh           # 本地打包脚本（仅本地，不上传）
.github/workflows/ci.yml   # CI（云端构建）
LICENSE / CHANGELOG.md / CONTRIBUTING.md / SECURITY.md
```

## 构建与产物

```bash
# 校验
node --check src/main.js
node --check src/packages/bili_manager.js
node --check src/ui/bili_console/index.ui.js
node --check src/ui/bili_config/index.ui.js
node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8'))"

# 打包
bash scripts/build.sh
```

产物：`dist/com.operit.billion_context-v0.3.0.toolpkg`（版本号来自 `manifest.json`；`dist/` 与 `*.toolpkg` 已在 `.gitignore` 中，不提交 GitHub）
