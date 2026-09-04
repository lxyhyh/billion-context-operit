/**
 * ui-helpers — billion-context-operit Compose DSL UI 共享脚手架
 *
 * 从 bili_console / bili_config 两个 UI 抽出的公共辅助：串行调用队列、
 * 文本/错误规整、结果解析。UI 模块内部 require 相对路径受宿主导入器支持
 * （官方 linux_ssh UI 内 require ../i18n 同模式）。
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

/**
 * 创建全局串行调用队列（bridge 并发响应错配免疫）。
 * 返回 { serialCall }：serialCall(toolName, params) 把 ctx.callTool 排入同一队列。
 */
function createSerialQueue(ctx) {
    let serialQueue = Promise.resolve();
    function serialCall(toolName, params) {
        const task = serialQueue.then(async () => {
            const result = await ctx.callTool("bili_manager:" + toolName, params || {});
            return result;
        });
        serialQueue = task.catch(() => {});
        return task;
    }
    return { serialCall: serialCall };
}

function asText(value) {
    return value === undefined || value === null ? "" : String(value);
}

function toErrorText(error) {
    if (error instanceof Error) {
        return error.message || String(error);
    }
    return asText(error);
}

/** 把工具返回（对象或 JSON 字符串）解析为记录对象；无法解析返回 {} */
function parseRecord(result) {
    if (result && typeof result === "object" && !Array.isArray(result)) {
        return result;
    }
    if (typeof result === "string") {
        const raw = result.trim();
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === "object") {
                    return parsed;
                }
            } catch (_e) {
                // ignore
            }
        }
    }
    return {};
}

exports.createSerialQueue = createSerialQueue;
exports.asText = asText;
exports.toErrorText = toErrorText;
exports.parseRecord = parseRecord;