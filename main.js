/**
 * billion-context-operit — main.js
 *
 * 只注册 UI、工具与必要 IPC。
 * 刻意不注册任何 Prompt/Message/ToolCompose Hook ——
 * billion-context Proxy 自己完成 ACP 相关工作（压缩、搜索、session 维护）。
 */
"use strict";

const biliConsoleUI = require("./ui/bili_console/index.ui.js").default;

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

exports.registerToolPkg = registerToolPkg;
