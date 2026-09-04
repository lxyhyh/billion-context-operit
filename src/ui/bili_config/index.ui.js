/**
 * billion-context-operit — 配置页 UI（工具箱第二个入口）
 *
 * 铁律（与 bili_console 一致）：
 * 1. render 必须纯函数，setState 只在 action 窗口（onClick / onCheckedChange / onValueChange）。
 * 2. 所有 ctx.callTool 进入全局串行队列（bridge 并发响应错配免疫）。
 * 3. 失败不覆盖旧数据；未就绪显示 "--" 加载态。
 * 4. 保存 = 逐字段 diff 后 bili_config_set / bili_config_clear，全部串行。
 * 5. 保存后按字段自动生效：compress.* 以磁盘全量对象 PUT 热更；autoStart 写插件配置；
 *    其余字段仅写盘，需重启 bili。
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers = require("../_shared/ui-helpers.js");

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
    { path: "autoStart", label: "自动启动", type: "bool", def: true, plugin: true, pluginKey: "autoStartEnabled", desc: "Operit/容器启动时自动拉起 bili（自愈，无需手动启动）。关闭后需手动启动。" },
    { path: "debug", label: "调试模式", type: "bool", def: false, desc: "输出更详细的调试日志。" },
    { path: "autoUpdate", label: "自动更新", type: "bool", def: true, desc: "启动时自动检查并更新 billion-context。" },
    { path: "passthrough", label: "透传模式", type: "bool", def: false, desc: "关闭压缩/上下文管理，请求原样透传（相当于禁用 ACP）。" },
    { path: "compress.minCompressRange", label: "最小压缩范围", type: "number", def: "1000", desc: "上下文低于该字符数时不触发压缩。调小可更积极压缩。" },
    { path: "compress.modelContextLimit", label: "模型上下文上限", type: "number", def: "200000", desc: "模型 context 上限（token）。留空 = 官方默认 200000。" },
    { path: "compress.maxContextLimit", label: "最大上下文上限", type: "number", def: "", desc: "压缩器允许的最大上下文。留空 = 官方默认。" },
    { path: "compress.emergencyThresholdPercent", label: "紧急压缩阈值", type: "number", def: "0.95", desc: "上下文占用达到该比例时触发紧急压缩（0~1）。留空 = 官方默认。" },
    { path: "compress.nudgeGrowthTokens", label: "提示增长阈值", type: "number", def: "50000", desc: "上下文增量超过该 token 数时给出压缩提示。留空 = 官方默认。" },
    { path: "compress.preserveRecentMessages", label: "保留最近消息数", type: "number", def: "5", desc: "压缩时保留最近 N 条消息原文。留空 = 官方默认。" },
    { path: "compress.preserveRecentTokens", label: "保留最近 token 数", type: "number", def: "5000", desc: "压缩时保留最近 N 个 token 原文。留空 = 官方默认。" },
    { path: "compress.tiers", label: "分层压缩", type: "bool", def: true, desc: "启用分层压缩（tier2/tier3 逐级压缩）。" },
    { path: "compress.injectTool", label: "注入压缩工具", type: "bool", def: true, desc: "向模型注入压缩工具声明（模型可主动触发压缩）。" },
    { path: "compress.injectNudge", label: "注入压缩提示", type: "bool", def: true, desc: "向模型注入压缩引导语（模型被提醒可压缩时）。" },
    { path: "mitm.enabled", label: "MITM 抓包", type: "bool", def: false, desc: "启用 HTTPS 中间人代理（用于调试外部流量）。" },
    { path: "mitm.domains", label: "MITM 域名", type: "csv", def: "", desc: "需要 MITM 的域名，逗号分隔（如 api.example.com,cdn.example.com）。" },
    { path: "promptCache.routing", label: "提示缓存路由", type: "select", def: "auto", options: ["enabled", "disabled", "auto"], desc: "prompt cache 路由策略：enabled 强制开启 / disabled 关闭 / auto 自动。" }
];

function Screen(ctx) {
    const UI = ctx.UI;

    // ---------- 共享脚手架（串行队列 / 文本 / 解析，见 ../_shared/ui-helpers.js） ----------
    const { serialCall } = helpers.createSerialQueue(ctx);
    const asText = helpers.asText;
    const toErrorText = helpers.toErrorText;
    const parseRecord = helpers.parseRecord;

    // ---------- 状态 ----------
    const [config, setConfig] = ctx.useState("bc_cfg_config", null);        // null=未加载，{} = 已加载
    const [pluginCfg, setPluginCfg] = ctx.useState("bc_cfg_plugin_cfg", null); // 插件自身配置（autoStart 等）
    const [configFile, setConfigFile] = ctx.useState("bc_cfg_file", "");
    const [form, setForm] = ctx.useState("bc_cfg_form", {});                // path -> 表单值
    const [busy, setBusy] = ctx.useState("bc_cfg_busy", false);
    const [busyLabel, setBusyLabel] = ctx.useState("bc_cfg_busy_label", "");
    const [lastMsg, setLastMsg] = ctx.useState("bc_cfg_last_msg", "");
    const [lastError, setLastError] = ctx.useState("bc_cfg_last_error", "");

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

    function loadFormFromConfig(cfg, pluginCfg) {
        const next = {};
        FIELDS.forEach(function (f) {
            let source = cfg;
            let lookupPath = f.path;
            if (f.plugin) {
                if (!pluginCfg) {
                    // 未提供插件配置时保留当前表单值（不重置为默认）
                    if (Object.prototype.hasOwnProperty.call(form, f.path)) {
                        next[f.path] = form[f.path];
                        return;
                    }
                    pluginCfg = {};
                }
                source = pluginCfg;
                lookupPath = f.pluginKey || f.path;
            }
            const got = getByPath(source, lookupPath);
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
            // 插件自身配置（autoStart 开关等）单独读取
            let pluginConfig = {};
            try {
                const pluginResult = await serialCall("plugin_config_get", {});
                const pluginRecord = parseRecord(pluginResult);
                if (pluginRecord.success !== false && pluginRecord.config && typeof pluginRecord.config === "object") {
                    pluginConfig = pluginRecord.config;
                }
            } catch (_e) {
                // 插件配置读取失败不影响主配置加载
            }
            setPluginCfg(pluginConfig);
            loadFormFromConfig(cfg, pluginConfig);
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
                setLastError("请先点击「刷新」读取当前配置，再修改保存");
                return;
            }
            // diff 基准：官方配置字段取 config；插件字段（autoStart）取插件配置，避免基准错位导致单向失效
            let pluginCfg = {};
            try {
                const pluginResult = await serialCall("plugin_config_get", {});
                const pluginRecord = parseRecord(pluginResult);
                if (pluginRecord.success !== false && pluginRecord.config && typeof pluginRecord.config === "object") {
                    pluginCfg = pluginRecord.config;
                }
            } catch (_e) {
                // 插件配置读取失败时按"无改动"对待插件字段
            }
            const baseFor = function (f) {
                if (f.plugin) {
                    const got = getByPath(pluginCfg, f.pluginKey || f.path);
                    return got.ok ? configToFormValue(f, got.value) : (f.def === undefined || f.def === null ? "" : f.def);
                }
                const got = getByPath(config, f.path);
                return got.ok ? configToFormValue(f, got.value) : (f.def === undefined || f.def === null ? "" : f.def);
            };
            let changed = 0;
            let compressChanged = false;
            let pluginChanged = false;
            let restartChanged = false;
            for (let i = 0; i < FIELDS.length; i++) {
                const f = FIELDS[i];
                const orig = baseFor(f);
                const current = Object.prototype.hasOwnProperty.call(form, f.path) ? form[f.path] : orig;
                // 规范化比较：bool 直接比，其余按字符串比
                const same = f.type === "bool" ? !!current === !!orig : asText(current) === asText(orig);
                if (same) {
                    continue;
                }
                const newValue = formToConfigValue(f, current);
                const isEmpty = f.type === "csv" ? (Array.isArray(newValue) && newValue.length === 0) : asText(current).trim() === "";
                if (f.plugin) {
                    // 插件自身配置（autoStart 等）：走 plugin_config_set，不写入官方 bili 配置
                    pluginChanged = true;
                    const pluginSetResult = await serialCall("plugin_config_set", {
                        autoStartEnabled: !!newValue
                    });
                    const pluginSetRecord = parseRecord(pluginSetResult);
                    if (pluginSetRecord.success === false) {
                        setLastError("保存 " + f.path + " 失败：" + asText(pluginSetRecord.error));
                        return;
                    }
                } else if (isEmpty) {
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
                if (f.path.indexOf("compress.") === 0) {
                    compressChanged = true;
                } else if (!f.plugin) {
                    restartChanged = true;
                }
            }
            if (compressChanged) {
                // compress.* 已随上面写盘（bili_config_set/clear）；再以磁盘现网 compress 全量对象热更，
                // 避免官方 PUT 整对象覆盖语义把未改动键冲掉（如 UI 未覆盖的官方键 prompts.* 等）
                setBusyLabel("正在保存并热更新 compress…");
                const getResult = await serialCall("bili_config_get", {});
                const getRecord = parseRecord(getResult);
                if (getRecord.success === false) {
                    setLastError("compress 已写盘，但热更新失败：" + asText(getRecord.error));
                    return;
                }
                const freshCfg = getRecord.config && typeof getRecord.config === "object" ? getRecord.config : {};
                const freshCompress = freshCfg.compress && typeof freshCfg.compress === "object" ? freshCfg.compress : {};
                const hotApplyResult = await serialCall("bili_config_hot_apply", { config: JSON.stringify({ compress: freshCompress }) });
                const hotApplyRecord = parseRecord(hotApplyResult);
                if (hotApplyRecord.success === false) {
                    setLastError("compress 已写盘，但热更新失败：" + (asText(hotApplyRecord.error) || "bili_config_hot_apply 失败"));
                    return;
                }
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
            // 同步刷新插件配置（autoStart 等），避免被默认值覆盖
            let savedPluginConfig = {};
            try {
                const pluginResult = await serialCall("plugin_config_get", {});
                const pluginRecord = parseRecord(pluginResult);
                if (pluginRecord.success !== false && pluginRecord.config && typeof pluginRecord.config === "object") {
                    savedPluginConfig = pluginRecord.config;
                }
            } catch (_e) {
                // 忽略：保持已保存的表单值
            }
            setPluginCfg(savedPluginConfig);
            loadFormFromConfig(cfg, savedPluginConfig);
            if (changed === 0) {
                setLastMsg("配置无变化，未写入");
            } else {
                let msg = "已保存 " + changed + " 项配置";
                const notes = [];
                if (compressChanged) {
                    notes.push("compress 已热更生效（无需重启）");
                }
                if (pluginChanged) {
                    notes.push("autoStart 在下次 Operit/容器启动时生效");
                }
                if (restartChanged) {
                    notes.push("port/host 等基础设置需重启 bili 生效");
                }
                if (notes.length > 0) {
                    msg += "；" + notes.join("；");
                }
                setLastMsg(msg);
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
                UI.Column({ weight: 1, spacing: 2 }, [
                    UI.Text({ text: f.label, color: T.onSurface, fontSize: 14, bold: true, softWrap: true }),
                    UI.Text({ text: f.desc, color: T.onSurfaceVariant, fontSize: 11, maxLines: 3, softWrap: true })
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
                UI.Text({ text: f.label, color: T.onSurface, fontSize: 14, bold: true, softWrap: true }),
                UI.Text({ text: f.desc, color: T.onSurfaceVariant, fontSize: 11, maxLines: 3, softWrap: true }),
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
        // number / text / csv —— 使用官方 TextField 结构（label 悬浮、softWrap 换行）
        return UI.Column({ fillMaxWidth: true, spacing: 6 }, [
            UI.Text({ text: f.label + (f.type === "csv" ? "（逗号分隔）" : ""), color: T.onSurface, fontSize: 14, bold: true, softWrap: true }),
            UI.Text({ text: f.desc, color: T.onSurfaceVariant, fontSize: 11, maxLines: 3, softWrap: true }),
            UI.Spacer({ height: 2 }),
            UI.TextField({
                value: asText(value),
                onValueChange: function (newValue) {
                    const next = Object.assign({}, form);
                    next[f.path] = newValue;
                    setForm(next);
                },
                singleLine: false,
                minLines: 1,
                maxLines: 3,
                fillMaxWidth: true,
                keyboardType: f.type === "number" ? "number" : undefined
            })
        ]);
    }

    function fieldRow(f) {
        return UI.Card({
            fillMaxWidth: true,
            containerColor: T.surfaceVariant,
            shape: { cornerRadius: 8 },
            elevation: 1
        }, [
            UI.Column({ fillMaxWidth: true, padding: 14, spacing: 6 }, [
                fieldControl(f)
            ])
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
        spacing: 8
    }, [
        // 配置路径（独立小字，无卡片背景，不被遮挡）
        UI.Text({
            text: "配置文件：" + (configFile || "~/.config/billion-context/billion-context.json"),
            style: "bodySmall",
            color: "onSurfaceVariant",
            softWrap: true
        }),

        // 操作按钮
        UI.Row({ spacing: 8 }, [
            UI.Button({ text: "刷新", onClick: doLoad, enabled: !busy, weight: 1 }),
            UI.Button({ text: "保存", onClick: doSave, enabled: !busy && loaded, containerColor: T.primary, contentColor: T.onPrimary, weight: 1 })
        ]),

        // 字段分组 —— 静态直写（不使用 map 展开）
        UI.Column({ fillMaxWidth: true, spacing: 8 }, [
            UI.Text({ text: "基础设置", style: "titleSmall", color: "primary", fontWeight: "bold", softWrap: true }),
            fieldRow(field("port")),
            fieldRow(field("host")),
            fieldRow(field("upstream")),
            fieldRow(field("debug")),
            fieldRow(field("autoUpdate")),
            fieldRow(field("passthrough")),
            fieldRow(field("autoStart"))
        ]),
        UI.Column({ fillMaxWidth: true, spacing: 8 }, [
            UI.Text({ text: "上下文压缩", style: "titleSmall", color: "primary", fontWeight: "bold", softWrap: true }),
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
            UI.Text({ text: "MITM 抓包", style: "titleSmall", color: "primary", fontWeight: "bold", softWrap: true }),
            fieldRow(field("mitm.enabled")),
            fieldRow(field("mitm.domains"))
        ]),
        UI.Column({ fillMaxWidth: true, spacing: 8 }, [
            UI.Text({ text: "提示缓存", style: "titleSmall", color: "primary", fontWeight: "bold", softWrap: true }),
            fieldRow(field("promptCache.routing"))
        ]),


        // 说明
        UI.Card({
            fillMaxWidth: true,
            containerColor: T.surfaceVariant,
            shape: { cornerRadius: 8 },
            elevation: 1
        }, [
            UI.Column({ fillMaxWidth: true, padding: 14, spacing: 6 }, [
                UI.Text({
                    text: "说明：修改后点「保存」写入 billion-context.json（持久化）。compress 字段保存后自动热更新，立即生效，无需重启；autoStart 在下次 Operit/容器启动时生效；port/host/upstream 等其余字段需重启 bili 生效。优先级：CLI 参数 > 环境变量 > 配置文件。仅环境变量可用的开关（如 ACP_RENDER_NONE）请在「管理」页启动时通过 env 参数注入。",
                    style: "bodySmall",
                    color: "onSurfaceVariant",
                    softWrap: true
                })
            ])
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
