/**
 * billion-context-operit — main.js
 *
 * 只注册 UI、工具与必要 IPC。
 * 刻意不注册任何 Prompt/Message/ToolCompose Hook ——
 * billion-context Proxy 自己完成 ACP 相关工作（压缩、搜索、session 维护）。
 */
"use strict";

// 对齐官方范本（linux_ssh/remote_operit/worldbook）：
// require 后不提前解包 .default，把整个模块对象传给 screen，
// 让 normalizeScreenField 能拿到带 __operit_toolpkg_module_path 标记的可序列化引用。
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerToolPkg = registerToolPkg;

const biliConsoleUI = __importDefault(require("./ui/bili_console/index.ui.js"));

function registerToolPkg() {
    // 只用 registerToolboxUiModule（官方 linux_ssh 范本）：
    // 它会自动映射为一个 UI route 并自动挂载 toolbox 入口。
    // 不要再额外 registerUiRoute / registerNavigationEntry 指向同一 UI，
    // 否则报 "Duplicate toolpkg route id"（packageLogs 实锤 2026-08-27）。
    ToolPkg.registerToolboxUiModule({
        id: "bili_console",
        runtime: "compose_dsl",
        screen: biliConsoleUI,
        params: {},
        title: {
            zh: "billion-context 管理",
            en: "billion-context Manager",
            default: "billion-context Manager"
        }
    });

    return true;
}
