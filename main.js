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

    ToolPkg.registerUiRoute({
        id: "bili_console_route",
        route: "toolpkg:com.operit.billion_context:ui:bili_console",
        runtime: "compose_dsl",
        screen: biliConsoleUI,
        title: {
            zh: "billion-context 管理",
            en: "billion-context Manager",
            default: "billion-context Manager"
        }
    });

    ToolPkg.registerNavigationEntry({
        id: "bili_console_entry",
        route: "toolpkg:com.operit.billion_context:ui:bili_console",
        surface: "main_sidebar_plugins",
        title: {
            zh: "billion-context",
            en: "billion-context",
            default: "billion-context"
        },
        order: 50
    });

    return true;
}
