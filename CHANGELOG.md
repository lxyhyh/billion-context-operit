# Changelog

本项目版本号与 `manifest.json` 的 `version` 字段保持一致（当前：**0.3.0**）。

## [0.3.0] - 2026-08-28

### Added
- 配置页（`bili_config`）：可视化编辑官方配置文件（路径、providers、upstream、compress 阈值/上下文限制/tiers 等），支持加载/保存/热更新/重载/重置。
- 新工具：`bili_config_get` / `bili_config_set` / `bili_config_clear` / `bili_config_reload` / `bili_config_hot_apply`。
- compress 字段支持「热更新」即时生效（`PUT /__bili/config`），HTTP 409 透出官方 parseError。

### Changed
- 配置页与管理页统一为 Compose DSL 官方款式：MaterialTheme 配色（跟随深浅色）、surfaceVariant 卡片、按钮 weight:1 均分、可滚动 LazyColumn。
- 管理页去掉「端口」设置输入框（端口在配置页设置）；状态卡保留端口/PID 只读显示。
- `PACKAGE_VERSION` 同步至 0.3.0。

### Fixed
- 配置页卡片背景在浅色/深色模式下与全屏背景混为一体的问题（`T.surface` → `T.surfaceVariant`）。
- 配置页顶部遮挡与按钮间距异常（恢复紧凑间隔）。
- 配置页根节点由不可滚动 Column 恢复为可滚动 LazyColumn。

## [0.2.1] - 2026-08-27

### Added
- 初始版本：`bili_manager` 管理工具集（detect/install/start/stop/restart/status/health/version/update/logs/proxy_url）。
- 管理页 UI：安装/运行状态、启动/停止/重启、日志读取、Proxy URL 生成。
- 一键安装官方 billion-context Proxy 到 Operit Ubuntu/PRoot 容器。

[0.3.0]: https://github.com/billion-context-operit/billion-context-operit/releases/tag/v0.3.0
[0.2.1]: https://github.com/billion-context-operit/billion-context-operit/releases/tag/v0.2.1
