/**
 * billion-context-operit — 配置页 UI（工具箱第二个入口）
 *
 * 铁律（与 bili_console 一致）：
 * 1. render 必须纯函数，setState 只在 action 窗口（onClick / onCheckedChange / onValueChange）。
 * 2. 所有 ctx.callTool 进入全局串行队列（bridge 并发响应错配免疫）。
 * 3. 失败不覆盖旧数据；未就绪显示 "--" 加载态。
 * 4. 保存 = 逐字段 diff 后 bili_config_set / bili_config_clear，全部串行。
 * 5. compress 类字段（path 以 "compress." 开头）可经官方 PUT /__bili/config 热更新，无需重启；
 *    providers 写入后需调用官方 POST /__bili/config/reload 强制重载。
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
    { path: "upstream", label: "上游地址", type: "text", def: "", desc: "默认上游 API Base URL（如 https://api.anthropic.com）。留空 = 官方默认。" },
    { path: "debug", label: "调试模式", type: "bool", def: false, desc: "输出更详细的调试日志。" },
    { path: "autoUpdate", label: "自动更新", type: "bool", def: true, desc: "启动时自动检查并更新 billion-context。" },
    { path: "passthrough", label: "透传模式", type: "bool", def: false, desc: "关闭压缩/上下文管理，请求原样透传（相当于禁用 ACP）。" },
    { path: "compress.minCompressRange", label: "最小压缩范围", type: "number", def: "1000", desc: "上下文低于该 token 数时不触发压缩。调小可更积极压缩。（可热更新）" },
    { path: "compress.modelContextLimit", label: "模型上下文上限", type: "number", def: "200000", desc: "模型 context 上限（token）。留空 = 官方默认 200000。（可热更新）" },
    { path: "compress.maxContextLimit", label: "最大上下文上限", type: "number", def: "", desc: "压缩器允许的最大上下文。留空 = 官方默认。（可热更新）" },
    { path: "compress.emergencyThresholdPercent", label: "紧急压缩阈值", type: "number", def: "0.95", desc: "上下文占用达到该比例时触发紧急压缩（0~1）。留空 = 官方默认。（可热更新）" },
    { path: "compress.nudgeGrowthTokens", label: "提示增长阈值", type: "number", def: "50000", desc: "上下文增量超过该 token 数时给出压缩提示。留空 = 官方默认。（可热更新）" },
    { path: "compress.preserveRecentMessages", label: "保留最近消息数", type: "number", def: "5", desc: "压缩时保留最近 N 条消息原文。留空 = 官方默认。（可热更新）" },
    { path: "compress.preserveRecentTokens", label: "保留最近 token 数", type: "number", def: "5000", desc: "压缩时保留最近 N 个 token 原文。留空 = 官方默认。（可热更新）" },
    { path: "compress.tiers", label: "分层压缩", type: "bool", def: true, desc: "启用分层压缩（tier2/tier3 逐级压缩）。（可热更新）" },
    { path: "compress.injectTool", label: "注入压缩工具", type: "bool", def: true, desc: "向模型注入压缩工具声明（模型可主动触发压缩）。（可热更新）" },
    { path: "compress.injectNudge", label: "注入压缩提示", type: "bool", def: true, desc: "向模型注入压缩引导语（模型被提醒可压缩时）。（可热更新）" },
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
    const [providers, setProviders] = ctx.useState("bc_cfg_providers", []); // [{url, proxy, context}] 编辑态
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

    // ---------- providers 编辑态 <-> 配置值 ----------
    function configToProviders(cfg) {
        const raw = cfg && cfg.providers && typeof cfg.providers === "object" ? cfg.providers : {};
        const list = [];
        Object.keys(raw).forEach(function (url) {
            const entry = raw[url] && typeof raw[url] === "object" ? raw[url] : {};
            list.push({
                url: url,
                proxy: entry.proxy === undefined || entry.proxy === null ? "" : asText(entry.proxy),
                context: entry.models && entry.models["*"] && entry.models["*"].context !== undefined ? asText(entry.models["*"].context) : ""
            });
        });
        return list;
    }

    function providersToConfig(list) {
        const out = {};
        list.forEach(function (row) {
            const url = asText(row.url).trim().replace(/\/+$/, "");
            if (!url) {
                return;
            }
            const entry = {};
            const proxy = asText(row.proxy).trim();
            if (proxy) {
                entry.proxy = proxy;
            }
            const ctx = asText(row.context).trim();
            if (ctx !== "" && Number.isFinite(Number(ctx))) {
                entry.models = { "*": { context: Number(ctx) } };
            }
            out[url] = entry;
        });
        return out;
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
            setProviders(configToProviders(cfg));
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
            // 保存 providers（整体写回）
            const newProviders = providersToConfig(providers);
            const oldProviders = config.providers && typeof config.providers === "object" ? config.providers : {};
            if (JSON.stringify(newProviders) !== JSON.stringify(oldProviders)) {
                const setResult = await serialCall("bili_config_set", {
                    path: "providers",
                    value: JSON.stringify(newProviders)
                });
                const setRecord = parseRecord(setResult);
                if (setRecord.success === false) {
                    setLastError("保存 providers 失败：" + asText(setRecord.error));
                    return;
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
            setProviders(configToProviders(cfg));
            setLastMsg(changed === 0 ? "配置无变化，未写入" : "已保存 " + changed + " 项配置（compress 可点「热更新」立即生效；providers 需点「重载配置」）");
        } catch (error) {
            setLastError(toErrorText(error));
        } finally {
            setBusy(false);
            setBusyLabel("");
        }
    }

    async function doHotApply() {
        // 把表单中 compress.* 的改动经官方 PUT /__bili/config 热应用到运行中的 bili（无需重启）
        setBusy(true);
        setBusyLabel("正在热更新 compress…");
        setLastError("");
        setLastMsg("");
        try {
            if (!config || typeof config !== "object") {
                setLastError("请先点击「加载配置」再热更新");
                return;
            }
            const hot = {};
            let changed = 0;
            FIELDS.forEach(function (f) {
                if (f.path.indexOf("compress.") !== 0) {
                    return;
                }
                const got = getByPath(config, f.path);
                const orig = got.ok ? configToFormValue(f, got.value) : (f.def === undefined || f.def === null ? "" : f.def);
                const current = Object.prototype.hasOwnProperty.call(form, f.path) ? form[f.path] : orig;
                const same = f.type === "bool" ? !!current === !!orig : asText(current) === asText(orig);
                if (same) {
                    return;
                }
                hot[f.path.slice("compress.".length)] = formToConfigValue(f, current);
                changed++;
            });
            if (changed === 0) {
                setLastMsg("compress 无改动，无需热更新");
                return;
            }
            const result = await serialCall("bili_config_hot_apply", { config: JSON.stringify({ compress: hot }) });
            const record = parseRecord(result);
            if (record.success === false) {
                setLastError("热更新失败：" + (asText(record.error) || "bili_config_hot_apply 失败"));
                return;
            }
            // 热更新成功后再同步一次（把表单刷新为服务器确认的配置）
            const reloadResult = await serialCall("bili_config_get", {});
            const reloadRecord = parseRecord(reloadResult);
            if (reloadRecord.success === false) {
                setLastMsg("热更新成功，但刷新配置失败：" + asText(reloadRecord.error));
                return;
            }
            const cfg = reloadRecord.config && typeof reloadRecord.config === "object" ? reloadRecord.config : {};
            setConfig(cfg);
            loadFormFromConfig(cfg);
            setProviders(configToProviders(cfg));
            setLastMsg("热更新成功（" + changed + " 项 compress 已生效，无需重启）");
        } catch (error) {
            setLastError(toErrorText(error));
        } finally {
            setBusy(false);
            setBusyLabel("");
        }
    }

    async function doReload() {
        // 调用官方 POST /__bili/config/reload 强制重载配置文件（providers 改动后使用）
        setBusy(true);
        setBusyLabel("正在强制重载配置…");
        setLastError("");
        setLastMsg("");
        try {
            const result = await serialCall("bili_config_reload", {});
            const record = parseRecord(result);
            if (record.success === false || record.ok === false) {
                setLastError("重载失败：" + (asText(record.error) || "bili_config_reload 失败"));
                return;
            }
            const reloadResult = await serialCall("bili_config_get", {});
            const reloadRecord = parseRecord(reloadResult);
            if (reloadRecord.success === false) {
                setLastMsg("重载成功，但刷新配置失败：" + asText(reloadRecord.error));
                return;
            }
            const cfg = reloadRecord.config && typeof reloadRecord.config === "object" ? reloadRecord.config : {};
            setConfig(cfg);
            loadFormFromConfig(cfg);
            setProviders(configToProviders(cfg));
            setLastMsg("配置已重载（providers 等改动已生效）");
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
                setProviders(configToProviders(config));
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

    // ---------- 主题色（遵循 MaterialTheme，不硬编码） ----------
    const T = ctx.MaterialTheme.colorScheme;

    // ---------- 字段控件渲染 ----------
    function fieldControl(f) {
        const value = Object.prototype.hasOwnProperty.call(form, f.path) ? form[f.path] : (f.def === undefined || f.def === null ? "" : f.def);
        if (f.type === "bool") {
            return UI.Row({ fillMaxWidth: true, verticalAlignment: "center" }, [
                UI.Column({ weight: 1 }, [
                    UI.Text({ text: f.label, color: T.onSurface, fontSize: 14, bold: true }),
                    UI.Text({ text: f.desc, color: T.onSurfaceVariant, fontSize: 11, maxLines: 3 })
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
            const options = f.options || [];
            const selectedColor = T.primary;
            const unselectedColor = T.surfaceVariant;
            const selectedContent = T.onPrimary;
            const unselectedContent = T.onSurfaceVariant;
            return UI.Column({ fillMaxWidth: true }, [
                UI.Text({ text: f.label, color: T.onSurface, fontSize: 14, bold: true }),
                UI.Text({ text: f.desc, color: T.onSurfaceVariant, fontSize: 11, maxLines: 3 }),
                UI.Spacer({ height: 6 }),
                UI.Row({ spacing: 8 }, [
                    options.indexOf("enabled") >= 0
                        ? UI.Button({
                            text: "enabled",
                            onClick: function () {
                                const next = Object.assign({}, form);
                                next[f.path] = "enabled";
                                setForm(next);
                            },
                            containerColor: asText(value) === "enabled" ? selectedColor : unselectedColor,
                            contentColor: asText(value) === "enabled" ? selectedContent : unselectedContent
                        })
                        : UI.Spacer({ height: 0 }),
                    options.indexOf("disabled") >= 0
                        ? UI.Button({
                            text: "disabled",
                            onClick: function () {
                                const next = Object.assign({}, form);
                                next[f.path] = "disabled";
                                setForm(next);
                            },
                            containerColor: asText(value) === "disabled" ? selectedColor : unselectedColor,
                            contentColor: asText(value) === "disabled" ? selectedContent : unselectedContent
                        })
                        : UI.Spacer({ height: 0 }),
                    options.indexOf("auto") >= 0
                        ? UI.Button({
                            text: "auto",
                            onClick: function () {
                                const next = Object.assign({}, form);
                                next[f.path] = "auto";
                                setForm(next);
                            },
                            containerColor: asText(value) === "auto" ? selectedColor : unselectedColor,
                            contentColor: asText(value) === "auto" ? selectedContent : unselectedContent
                        })
                        : UI.Spacer({ height: 0 })
                ])
            ]);
        }
        // number / text / csv
        return UI.Column({ fillMaxWidth: true }, [
            UI.Text({ text: f.label + (f.type === "csv" ? "（逗号分隔）" : ""), color: T.onSurface, fontSize: 14, bold: true }),
            UI.Text({ text: f.desc, color: T.onSurfaceVariant, fontSize: 11, maxLines: 3 }),
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
        return UI.Card({ fillMaxWidth: true, containerColor: T.surface, padding: 12 }, [
            fieldControl(f)
        ]);
    }

    // ---------- provider 行渲染（静态，固定下标） ----------
    function providerRow(idx) {
        const row = providers[idx];
        if (!row) {
            // 空行也渲染占位卡片，保证布局稳定
            return UI.Card({ fillMaxWidth: true, containerColor: T.surface, padding: 10 }, [
                UI.Row({ fillMaxWidth: true, verticalAlignment: "center" }, [
                    UI.Text({ text: "#" + (idx + 1), color: T.primary, fontSize: 12, bold: true }),
                    UI.Spacer({ width: 8 }),
                    UI.Button({
                        text: "删除",
                        onClick: function () {
                            const next = providers.slice();
                            next.splice(idx, 1);
                            setProviders(next);
                        },
                        containerColor: T.error,
                        contentColor: T.onError
                    })
                ]),
                UI.Spacer({ height: 6 }),
                UI.TextField({
                    value: "",
                    onValueChange: function (v) {
                        const next = providers.slice();
                        while (next.length <= idx) {
                            next.push({ url: "", proxy: "", context: "" });
                        }
                        next[idx] = Object.assign({}, next[idx], { url: v });
                        setProviders(next);
                    },
                    label: "上游 URL",
                    placeholder: "https://api.example.com/v1",
                    singleLine: true,
                    fillMaxWidth: true
                }),
                UI.Spacer({ height: 6 }),
                UI.TextField({
                    value: "",
                    onValueChange: function (v) {
                        const next = providers.slice();
                        while (next.length <= idx) {
                            next.push({ url: "", proxy: "", context: "" });
                        }
                        next[idx] = Object.assign({}, next[idx], { proxy: v });
                        setProviders(next);
                    },
                    label: "代理（可空）",
                    placeholder: "http://127.0.0.1:7890",
                    singleLine: true,
                    fillMaxWidth: true
                }),
                UI.Spacer({ height: 6 }),
                UI.TextField({
                    value: "",
                    onValueChange: function (v) {
                        const next = providers.slice();
                        while (next.length <= idx) {
                            next.push({ url: "", proxy: "", context: "" });
                        }
                        next[idx] = Object.assign({}, next[idx], { context: v });
                        setProviders(next);
                    },
                    label: "模型 context（可空）",
                    placeholder: "200000",
                    singleLine: true,
                    fillMaxWidth: true,
                    keyboardType: "number"
                })
            ]);
        }
        return UI.Card({ fillMaxWidth: true, containerColor: T.surface, padding: 10 }, [
            UI.Row({ fillMaxWidth: true, verticalAlignment: "center" }, [
                UI.Text({ text: "#" + (idx + 1), color: T.primary, fontSize: 12, bold: true }),
                UI.Spacer({ width: 8 }),
                UI.Button({
                    text: "删除",
                    onClick: function () {
                        const next = providers.slice();
                        next.splice(idx, 1);
                        setProviders(next);
                    },
                    containerColor: T.error,
                    contentColor: T.onError
                })
            ]),
            UI.Spacer({ height: 6 }),
            UI.TextField({
                value: row.url,
                onValueChange: function (v) {
                    const next = providers.slice();
                    next[idx] = Object.assign({}, row, { url: v });
                    setProviders(next);
                },
                label: "上游 URL",
                placeholder: "https://api.example.com/v1",
                singleLine: true,
                fillMaxWidth: true
            }),
            UI.Spacer({ height: 6 }),
            UI.TextField({
                value: row.proxy,
                onValueChange: function (v) {
                    const next = providers.slice();
                    next[idx] = Object.assign({}, row, { proxy: v });
                    setProviders(next);
                },
                label: "代理（可空）",
                placeholder: "http://127.0.0.1:7890",
                singleLine: true,
                fillMaxWidth: true
            }),
            UI.Spacer({ height: 6 }),
            UI.TextField({
                value: row.context,
                onValueChange: function (v) {
                    const next = providers.slice();
                    next[idx] = Object.assign({}, row, { context: v });
                    setProviders(next);
                },
                label: "模型 context（可空）",
                placeholder: "200000",
                singleLine: true,
                fillMaxWidth: true,
                keyboardType: "number"
            })
        ]);
    }

    // ---------- render（纯函数） ----------
    const loaded = config !== null && typeof config === "object";

    // 字段查找辅助（静态渲染，不用 map 展开动态子节点）
    function field(path) {
        for (let i = 0; i < FIELDS.length; i++) {
            if (FIELDS[i].path === path) {
                return FIELDS[i];
            }
        }
        return null;
    }

    return UI.LazyColumn({
        fillMaxSize: true,
        padding: 16,
        spacing: 10
    }, [
        UI.Text({ text: "billion-context 配置", fontSize: 20, bold: true }),

        // 配置路径 + 操作
        UI.Card({ fillMaxWidth: true, containerColor: T.surfaceVariant, padding: 12 }, [
            UI.Text({
                text: "配置文件：" + (configFile || "~/.config/billion-context/billion-context.json"),
                color: T.onSurfaceVariant,
                fontSize: 12,
                maxLines: 2
            }),
            UI.Spacer({ height: 8 }),
            UI.Row({ spacing: 8 }, [
                UI.Button({ text: "加载配置", onClick: doLoad, enabled: !busy }),
                UI.Button({ text: "保存", onClick: doSave, enabled: !busy && loaded, containerColor: T.primary, contentColor: T.onPrimary }),
                UI.Button({ text: "热更新", onClick: doHotApply, enabled: !busy && loaded, containerColor: T.tertiary, contentColor: T.onTertiary }),
                UI.Button({ text: "重载配置", onClick: doReload, enabled: !busy, containerColor: T.error, contentColor: T.onError }),
                UI.Button({ text: "重置表单", onClick: doReset, enabled: !busy && loaded })
            ])
        ]),

        // 字段分组 —— 静态直写（不使用 map 展开）
        UI.Column({ fillMaxWidth: true, spacing: 8 }, [
            UI.Text({ text: "基础设置", fontSize: 16, bold: true, color: T.primary }),
            fieldRow(field("port")),
            fieldRow(field("host")),
            fieldRow(field("upstream")),
            fieldRow(field("debug")),
            fieldRow(field("autoUpdate")),
            fieldRow(field("passthrough"))
        ]),
        UI.Column({ fillMaxWidth: true, spacing: 8 }, [
            UI.Text({ text: "上下文压缩", fontSize: 16, bold: true, color: T.primary }),
            fieldRow(field("compress.minCompressRange")),
            fieldRow(field("compress.modelContextLimit")),
            fieldRow(field("compress.maxContextLimit")),
            fieldRow(field("compress.emergencyThresholdPercent")),
            fieldRow(field("compress.nudgeGrowthTokens")),
            fieldRow(field("compress.preserveRecentMessages")),
            fieldRow(field("compress.preserveRecentTokens")),
            fieldRow(field("compress.tiers")),
            fieldRow(field("compress.injectTool")),
            fieldRow(field("compress.injectNudge"))
        ]),
        UI.Column({ fillMaxWidth: true, spacing: 8 }, [
            UI.Text({ text: "MITM 抓包", fontSize: 16, bold: true, color: T.primary }),
            fieldRow(field("mitm.enabled")),
            fieldRow(field("mitm.domains"))
        ]),
        UI.Column({ fillMaxWidth: true, spacing: 8 }, [
            UI.Text({ text: "提示缓存", fontSize: 16, bold: true, color: T.primary }),
            fieldRow(field("promptCache.routing"))
        ]),

        // Providers 管理 —— 静态渲染固定行（不使用 map 展开）
        UI.Column({ fillMaxWidth: true, spacing: 8 }, [
            UI.Text({ text: "Providers（按上游 URL 路由）", fontSize: 16, bold: true, color: T.primary }),
            UI.Text({ text: "每条 = 一个上游 URL 及其专属代理 / 全局模型 context。留空 proxy/context 表示继承全局。保存后需点「重载配置」生效。", color: T.onSurfaceVariant, fontSize: 11, maxLines: 3 }),
            UI.Spacer({ height: 4 }),
            providerRow(0),
            providerRow(1),
            providerRow(2),
            UI.Spacer({ height: 4 }),
            UI.Button({
                text: "+ 添加 Provider",
                onClick: function () {
                    const next = providers.slice();
                    next.push({ url: "", proxy: "", context: "" });
                    setProviders(next);
                },
                containerColor: T.surfaceVariant,
                contentColor: T.primary,
                fillMaxWidth: true
            })
        ]),

        // 说明
        UI.Card({ fillMaxWidth: true, containerColor: T.surfaceVariant, padding: 12 }, [
            UI.Text({
                text: "说明：修改写入 billion-context.json（持久化）。标「可热更新」的 compress 字段保存后点「热更新」即可生效，无需重启；port/host/upstream 等基础设置与 providers 改动需重启 bili（providers 也可在保存后点「重载配置」强制生效）。优先级：CLI 参数 > 环境变量 > 配置文件。仅环境变量可用的开关（如 ACP_RENDER_NONE）请在「管理」页启动时通过 env 参数注入。",
                color: T.onSurfaceVariant,
                fontSize: 11,
                maxLines: 8
            })
        ]),

        // 忙碌 / 消息
        busy ? UI.Row({ spacing: 8, verticalAlignment: "center" }, [
            UI.CircularProgressIndicator({ strokeWidth: 3 }),
            UI.Text({ text: busyLabel || "处理中…", color: T.primary, fontSize: 12 })
        ]) : UI.Spacer({ height: 0 }),
        lastMsg ? UI.Text({ text: "✓ " + lastMsg, color: T.primary, fontSize: 12 }) : UI.Spacer({ height: 0 }),
        lastError ? UI.Text({ text: "✗ " + lastError, color: T.error, fontSize: 12 }) : UI.Spacer({ height: 0 }),

        UI.Spacer({ height: 8 })
    ]);
}

exports.default = Screen;
