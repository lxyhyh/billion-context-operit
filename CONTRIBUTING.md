# Contributing

感谢你愿意为本项目贡献代码！

## 开发环境

- Node.js ≥ 18（仅用于语法校验与打包，无 npm 依赖）
- 目标平台：Operit（Android），插件通过 `.toolpkg` 安装

## 代码结构

```
src/
  main.js                  # ToolPkg 入口
  packages/bili_manager.js # 全部管理工具（METADATA + exports 需同步）
  ui/bili_console/         # 管理页 UI
  ui/bili_config/          # 配置页 UI
manifest.json              # 包清单（版本号在此维护）
scripts/build.sh           # 本地打包脚本（仅本地，不上传；云端 CI 内联相同逻辑）
```

## 规则

1. **新增工具必须同步**：`packages/bili_manager.js` 顶部的 `METADATA` 与底部 `exports.xxx` 必须成对出现，否则工具静默不注册（本地 `bash scripts/build.sh` 与云端 CI 均有 16/16 一致性自查）。
2. **UI 铁律**（来自踩坑记录）：
   - `render` 必须纯函数，`setState` 只在 action 窗口（onLoad/onClick async handler）。
   - 所有 `ctx.callTool` 走全局串行队列（bridge 并发响应错配免疫）。
   - 关键操作在 onClick/onLoad 的 await 链内完成（120s action 窗口）；异步 setState 不触发重绘。
   - 展示上限 100 条，不分页。
   - 卡片背景用 `T.surfaceVariant`（`T.surface` 与全屏背景混为一体）。
   - 长表单必须用 `LazyColumn`（Column 不可滚动）。
3. **架构约束**：不重新实现 billion-context。
4. **提交信息**：`feat:` / `fix:` / `chore:` / `docs:` 前缀 + 中文描述。

## 提交前检查

```bash
bash scripts/build.sh   # 本地：全绿（语法 + manifest + 工具一致性）；云端：push 后 CI 自动执行
```

## License

MIT，见 [LICENSE](LICENSE)。
