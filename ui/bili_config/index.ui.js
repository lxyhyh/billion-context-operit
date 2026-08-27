/**
 * billion-context-operit — 配置页 UI（工具箱第二个入口）
 *
 * 铁律（与 bili_console 一致）：
 * 1. render 必须纯函数，setState 只在 action 窗口（onClick / onCheckedChange / onValueChange）。
 * 2. 所有 ctx.callTool 进入全局串行队列（bridge 并发响应错配免疫）。
 * 3. 失败不覆盖旧数据；未就绪显示 "--" 加载态。
 * 4. 保存 = 逐字段 diff 后 bili_config_set / bili_config_clear，全部串行。
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

/**
 * 可编辑字段定义（path 为 billion-context.json 点路径）：
 * type: bool | number | text | select | csv
 *   bool   -> Switch
 *   number -> TextField（数字键盘）
 *   text   -> TextField
 *   csv    -> TextField，保存时按逗号拆成数组（如 mitm.domains）
 *   select -> 按钮组单选
 */
const FIELDS = [
    { path: "port", label: "端口", type: "number", def: "8787", desc: "bili 监听端口。CLI 参数 --port 可临时覆盖。" },
    { path: "host", label: "监听地址", type: "text", def: "127.0.0.1", desc: "bili 监听地址。默认仅本机，改为 0.0.0.0 可对外服务。" },
    { path: "debug", label: "调试模式", type: "bool", def: false, desc: "输出更详细的调试日志。" },
    { path: "autoUpdate", label: "自动更新", type: "bool", def: true, desc: "启动时自动检查并更新 billion-context。" },
    { path: "passthrough", label: "透传模式", type: "bool", def: false, desc: "关闭压缩/上下文管理，请求原样透传（相当于禁用 ACP）。" },
    { path: "compress.minCompressRange", label: "最小压缩范围", type: "number", def: "1000", desc: "上下文低于该 token 数时不触发压缩。调小可更积极压缩。" },
    { path: "compress.injectTool", label: "注入压缩工具", type: "bool", def: true, desc: "向模型注入压缩工具声明（模型可主动触发压缩）。" },
    { path: "compress.injectNudge", label: "注入压缩提示", type: "bool", def: true, desc: "向模型注入压缩引导语（模型被提醒可压缩时）。" },
    { path: "mitm.enabled", label: "MITM 抓包", type: "bool", def: false, desc: "启用 HTTPS 中间人代理（用于调试外部流量）。" },
    { path: "mitm.domains", label: "MITM 域名", type: "csv", def: "", desc: "需要 MITM 的域名，逗号分隔（如 api.example.com,cdn.example.com）。" },
    { path: "promptCache.routing", label: "提示缓存路由", type: "select", def: "auto", options: ["enabled", "disabled", "auto"], desc: "prompt cache 路由策略：enabled 强制开启 / disabled 关闭 / auto 自动。" }
];

function Screen(ctx) {
    const UI = ctx.UI;

    // ---------- 状态 ----------
    const [config, setConfig] = ctx.useState("bc_cfg_config", null);        // null=未加载，{} = 已加载
    const [configFile, setConfigFile] = ctx.useState("bc_cfg_file", "");
    const [form, setForm] = ctx.useState("bc_cfg_form", {});                // path -> 表单值
    const [busy, setBusy] = ctx.useState("bc_cfg_busy", false);
    const [busyLabel, setBusyLabel] = ctx.useState("bc_cfg_busy_label", "");
    const [lastMsg, setLastMsg] = ctx.useState("bc_cfg_last_msg", "");
    const [lastError, setLastError] = ctx.useState("bc_cfg_last_error", "");

    // ---------- 串行队列 ----------
    let serialQueue = Promise.resolve();

    function serialCall(toolName, params) {
        const task = serialQueue.then(async () => {
            const result = await ctx.callTool("bili_manager:" + toolName, params || {});
            return result;
        });
        serialQueue = task.catch(() => {});
        return task;
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

    // ---------- 点路径取值 ----------
    function getByPath(obj, path) {
        const parts = path.split(".").filter(Boolean);
        let current = obj;
        for (let i = 0; i < parts.length; i++) {
            if (current === null || typeof current !== "object") {
                return { ok: false, value: undefined };
            }
            if (!Object.prototype.hasOwnProperty.call(current, parts[i])) {
                return { ok: false, value: undefined };
            }
            current = current[parts[i]];
        }
        return { ok: true, value: current };
    }

    // ---------- 表单值 <-> 配置值 ----------
    function configToFormValue(field, rawValue) {
        if (rawValue === undefined || rawValue === null) {
            return field.def === undefined || field.def === null ? "" : field.def;
        }
        if (field.type === "csv") {
            return Array.isArray(rawValue) ? rawValue.join(", ") : asText(rawValue);
        }
        if (field.type === "bool") {
            return !!rawValue;
        }
        return asText(rawValue);
    }

    function formToConfigValue(field, formValue) {
        if (field.type === "bool") {
            return !!formValue;
        }
        const str = asText(formValue).trim();
        if (field.type === "csv") {
            return str
                .split(",")
                .map(function (s) { return s.trim(); })
                .filter(Boolean);
        }
        if (field.type === "number") {
            const n = Number(str);
            if (str !== "" && Number.isFinite(n)) {
                return n;
            }
            return str;
        }
        return str;
    }

    function loadFormFromConfig(cfg) {
        const next = {};
        FIELDS.forEach(function (f) {
            const got = getByPath(cfg, f.path);
            next[f.path] = configToFormValue(f, got.ok ? got.value : undefined);
        });
        setForm(next);
    }

    // ---------- 动作 ----------
    async function doLoad() {
        setBusy(true);
        setBusyLabel("正在读取配置文件…");
        setLastError("");
        try {
            const result = await serialCall("bili_config_get", {});
            const record = parseRecord(result);
            if (record.success === false) {
                setLastError(asText(record.error) || "bili_config_get 失败");
                setLastMsg("");
                return;
            }
            const cfg = record.config && typeof record.config === "object" ? record.config : {};
            setConfig(cfg);
            setConfigFile(asText(record.configFile));
            loadFormFromConfig(cfg);
            setLastMsg("配置已加载（" + asText(record.configFile) + "）");
        } catch (error) {
            setLastError(toErrorText(error));
        } finally {
            setBusy(false);
            setBusyLabel("");
        }
    }

    async function doSave() {
        setBusy(true);
        setBusyLabel("正在保存配置…");
        setLastError("");
        setLastMsg("");
        try {
            if (!config || typeof config !== "object") {
                setLastError("请先点击「加载配置」再保存");
                return;
            }
            let changed = 0;
            for (let i = 0; i < FIELDS.length; i++) {
                const f = FIELDS[i];
                const got = getByPath(config, f.path);
                const orig = got.ok ? configToFormValue(f, got.value) : (f.def === undefined || f.def === null ? "" : f.def);
                const current = Object.prototype.hasOwnProperty.call(form, f.path) ? form[f.path] : orig;
                // 规范化比较：bool 直接比，其余按字符串比
                const same = f.type === "bool" ? !!current === !!orig : asText(current) === asText(orig);
                if (same) {
                    continue;
                }
                const newValue = formToConfigValue(f, current);
                const isEmpty = f.type === "csv" ? (Array.isArray(newValue) && newValue.length === 0) : asText(current).trim() === "";
                if (isEmpty) {
                    const clearResult = await serialCall("bili_config_clear", { path: f.path });
                    const clearRecord = parseRecord(clearResult);
                    if (clearRecord.success === false) {
                        setLastError("清除 " + f.path + " 失败：" + asText(clearRecord.error));
                        return;
                    }
                } else {
                    const setResult = await serialCall("bili_config_set", {
                        path: f.path,
                        value: JSON.stringify(newValue)
                    });
                    const setRecord = parseRecord(setResult);
                    if (setRecord.success === false) {
                        setLastError("保存 " + f.path + " 失败：" + asText(setRecord.error));
                        return;
                    }
                }
                changed++;
            }
            // 重新加载以同步显示
            const result = await serialCall("bili_config_get", {});
            const record = parseRecord(result);
            if (record.success === false) {
                setLastError("保存完成但刷新失败：" + asText(record.error));
                return;
            }
            const cfg = record.config && typeof record.config === "object" ? record.config : {};
            setConfig(cfg);
            setConfigFile(asText(record.configFile));
            loadFormFromConfig(cfg);
            setLastMsg(changed === 0 ? "配置无变化，未写入" : "已保存 " + changed + " 项配置（重启 bili 后生效）");
        } catch (error) {
            setLastError(toErrorText(error));
        } finally {
            setBusy(false);
            setBusyLabel("");
        }
    }

    async function doReset() {
        setBusy(true);
        setBusyLabel("正在重置表单…");
        setLastError("");
        try {
            if (config && typeof config === "object") {
                loadFormFromConfig(config);
                setLastMsg("表单已重置为当前配置文件内容");
            } else {
                setLastError("尚未加载配置");
            }
        } catch (error) {
            setLastError(toErrorText(error));
        } finally {
            setBusy(false);
            setBusyLabel("");
        }
    }

    // ---------- 字段控件渲染 ----------
    function fieldControl(f) {
        const value = Object.prototype.hasOwnProperty.call(form, f.path) ? form[f.path] : (f.def === undefined || f.def === null ? "" : f.def);
        if (f.type === "bool") {
            return UI.Row({ fillMaxWidth: true, verticalAlignment: "center" }, [
                UI.Column({ weight: 1 }, [
                    UI.Text({ text: f.label, color: "#FFFFFF", fontSize: 14, bold: true }),
                    UI.Text({ text: f.desc, color: "#888888", fontSize: 11, maxLines: 3 })
                ]),
                UI.Spacer({ width: 12 }),
                UI.Switch({
                    checked: !!value,
                    onCheckedChange: function (checked) {
                        const next = Object.assign({}, form);
                        next[f.path] = !!checked;
                        setForm(next);
                    }
                })
            ]);
        }
        if (f.type === "select") {
            return UI.Column({ fillMaxWidth: true }, [
                UI.Text({ text: f.label, color: "#FFFFFF", fontSize: 14, bold: true }),
                UI.Text({ text: f.desc, color: "#888888", fontSize: 11, maxLines: 3 }),
                UI.Spacer({ height: 6 }),
                UI.Row({ spacing: 8 }, (f.options || []).map(function (opt) {
                    const selected = asText(value) === opt;
                    return UI.Button({
                        text: opt,
                        onClick: function () {
                            const next = Object.assign({}, form);
                            next[f.path] = opt;
                            setForm(next);
                        },
                        containerColor: selected ? "#2E7D32" : "#333333",
                        contentColor: selected ? "#FFFFFF" : "#CCCCCC"
                    });
                }))
            ]);
        }
        // number / text / csv
        return UI.Column({ fillMaxWidth: true }, [
            UI.Text({ text: f.label + (f.type === "csv" ? "（逗号分隔）" : ""), color: "#FFFFFF", fontSize: 14, bold: true }),
            UI.Text({ text: f.desc, color: "#888888", fontSize: 11, maxLines: 3 }),
            UI.Spacer({ height: 4 }),
            UI.TextField({
                value: asText(value),
                onValueChange: function (newValue) {
                    const next = Object.assign({}, form);
                    next[f.path] = newValue;
                    setForm(next);
                },
                singleLine: true,
                fillMaxWidth: true,
                keyboardType: f.type === "number" ? "number" : undefined
            })
        ]);
    }

    function fieldRow(f) {
        return UI.Card({ fillMaxWidth: true, containerColor: "#1E1E1E", padding: 12 }, [
            fieldControl(f)
        ]);
    }

    // ---------- render（纯函数） ----------
    const loaded = config !== null && typeof config === "object";
    const groups = [
        { title: "基础设置", fields: ["port", "host", "debug", "autoUpdate", "passthrough"] },
        { title: "上下文压缩", fields: ["compress.minCompressRange", "compress.injectTool", "compress.injectNudge"] },
        { title: "MITM 抓包", fields: ["mitm.enabled", "mitm.domains"] },
        { title: "提示缓存", fields: ["promptCache.routing"] }
    ];

    return UI.LazyColumn({
        fillMaxSize: true,
        padding: 16,
        spacing: 10
    }, [
        UI.Text({ text: "billion-context 配置", fontSize: 20, bold: true }),

        // 配置路径 + 操作
        UI.Card({ fillMaxWidth: true, containerColor: "#141414", padding: 12 }, [
            UI.Text({
                text: "配置文件：" + (configFile || "~/.config/billion-context/billion-context.json"),
                color: "#AAAAAA",
                fontSize: 12,
                maxLines: 2
            }),
            UI.Spacer({ height: 8 }),
            UI.Row({ spacing: 8 }, [
                UI.Button({ text: "加载配置", onClick: doLoad, enabled: !busy }),
                UI.Button({ text: "保存", onClick: doSave, enabled: !busy && loaded, containerColor: "#2E7D32" }),
                UI.Button({ text: "重置表单", onClick: doReset, enabled: !busy && loaded })
            ])
        ]),

        // 字段分组
        groups.map(function (group) {
            const visibleFields = group.fields.filter(function (p) { return FIELDS.some(function (f) { return f.path === p; }); });
            return UI.Column({ fillMaxWidth: true, spacing: 8 }, [
                UI.Text({ text: group.title, fontSize: 16, bold: true, color: "#4FC3F7" }),
                visibleFields.map(function (p) {
                    const f = FIELDS.find(function (x) { return x.path === p; });
                    return f ? fieldRow(f) : null;
                })
            ]);
        }),

        // 说明
        UI.Card({ fillMaxWidth: true, containerColor: "#141414", padding: 12 }, [
            UI.Text({
                text: "说明：修改写入 billion-context.json（持久化），重启 bili 后生效。优先级：CLI 参数 > 环境变量 > 配置文件。仅环境变量可用的开关（如 ACP_RENDER_NONE）请在「管理」页启动时通过 env 参数注入。",
                color: "#666666",
                fontSize: 11,
                maxLines: 6
            })
        ]),

        // 忙碌 / 消息
        busy ? UI.Row({ spacing: 8, verticalAlignment: "center" }, [
            UI.CircularProgressIndicator({ strokeWidth: 3 }),
            UI.Text({ text: busyLabel || "处理中…", color: "#FFC107", fontSize: 12 })
        ]) : UI.Spacer({ height: 0 }),
        lastMsg ? UI.Text({ text: "✓ " + lastMsg, color: "#4CAF50", fontSize: 12 }) : UI.Spacer({ height: 0 }),
        lastError ? UI.Text({ text: "✗ " + lastError, color: "#EF5350", fontSize: 12 }) : UI.Spacer({ height: 0 }),

        UI.Spacer({ height: 8 })
    ]);
}

exports.default = Screen;
