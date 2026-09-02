/**
 * billion-context-operit — Compose DSL UI
 *
 * 铁律（来自踩坑记录）：
 * 1. render 必须纯函数，setState 只在 action 窗口（onLoad / onClick async handler）。
 * 2. 所有 ctx.callTool 进入全局串行队列（bridge 并发响应错配免疫）。
 * 3. 失败不覆盖旧数据；未就绪显示 "--" 加载态。
 * 4. 异步 setState 不触发重绘 → 关键操作在 onClick/onLoad 的 await 链内完成。
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

function Screen(ctx) {
    const UI = ctx.UI;
    const T = ctx.MaterialTheme.colorScheme;

    // ---------- 状态 ----------
    const [installed, setInstalled] = ctx.useState("bc_installed", null);        // null=未知 true/false
    const [running, setRunning] = ctx.useState("bc_running", null);
    const [healthy, setHealthy] = ctx.useState("bc_healthy", null);
    const [biliVersion, setBiliVersion] = ctx.useState("bc_bili_version", "");
    const [nodeVersion, setNodeVersion] = ctx.useState("bc_node_version", "");
    const [npmVersion, setNpmVersion] = ctx.useState("bc_npm_version", "");
    const [biliPath, setBiliPath] = ctx.useState("bc_bili_path", "");
    const [port, setPort] = ctx.useState("bc_port", "8787");
    const [host, setHost] = ctx.useState("bc_host", "127.0.0.1");
    const [pid, setPid] = ctx.useState("bc_pid", null);
    const [healthBody, setHealthBody] = ctx.useState("bc_health_body", "");
    const [upstream, setUpstream] = ctx.useState("bc_upstream", "");
    const [proxyUrl, setProxyUrl] = ctx.useState("bc_proxy_url", "");
    const [logText, setLogText] = ctx.useState("bc_log_text", "");
    const [logLines, setLogLines] = ctx.useState("bc_log_lines", "200");
    const [busy, setBusy] = ctx.useState("bc_busy", false);
    const [busyLabel, setBusyLabel] = ctx.useState("bc_busy_label", "");
    const [lastMsg, setLastMsg] = ctx.useState("bc_last_msg", "");
    const [lastError, setLastError] = ctx.useState("bc_last_error", "");
    // 最新版本检测：null=未检测，{checked:true,...} 或 {checked:true,error}；单次查询，失败不自动重试
    const [latestInfo, setLatestInfo] = ctx.useState("bc_latest_info", null);

    // ---------- 全局串行调用队列（bridge 错配免疫） ----------
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

    // ---------- 数据加载（全部在 action 窗口） ----------

    async function refreshAll() {
        setBusy(true);
        setBusyLabel("正在读取状态…");
        setLastError("");
        try {
            const statusResult = await serialCall("status", {});
            const record = parseRecord(statusResult);
            if (record.success === false) {
                setLastError(asText(record.error) || "status 失败");
            } else {
                setRunning(record.running === true || record.healthy === true);
                setHealthy(record.healthy === true);
                setPid(record.pid === undefined || record.pid === null ? null : record.pid);
                setBiliVersion(asText(record.biliVersion));
                setBiliPath(asText(record.biliPath));
                setHealthBody(asText(record.health && record.health.body) || "");
            }

            const versionResult = await serialCall("version", {});
            const vRecord = parseRecord(versionResult);
            if (vRecord.success !== false) {
                if (asText(vRecord.biliVersion)) {
                    setBiliVersion(asText(vRecord.biliVersion));
                }
                if (asText(vRecord.biliPath)) {
                    setBiliPath(asText(vRecord.biliPath));
                }
                const node = vRecord.node || {};
                const npm = vRecord.npm || {};
                setInstalled(vRecord.installed === true);
                setNodeVersion(asText(node.version));
                setNpmVersion(asText(npm.version));
            }

            setLastMsg("状态已刷新");
        } catch (error) {
            setLastError(toErrorText(error));
        } finally {
            setBusy(false);
            setBusyLabel("");
        }
    }

    async function doDetect() {
        setBusy(true);
        setBusyLabel("正在检测环境…");
        setLastError("");
        try {
            const result = await serialCall("detect", {});
            const record = parseRecord(result);
            if (record.success === false) {
                setLastError(asText(record.error) || "detect 失败");
                setLastMsg("");
                return;
            }
            const node = record.node || {};
            const npm = record.npm || {};
            const bili = record.bili || {};
            setInstalled(bili.installed === true);
            setNodeVersion(asText(node.version));
            setNpmVersion(asText(npm.version));
            setBiliVersion(asText(bili.version));
            setBiliPath(asText(bili.path));
            setLastMsg("检测完成: node=" + asText(node.version || "missing") + " npm=" + asText(npm.version || "missing") + " bili=" + asText(bili.version || "missing"));
            // 顺带查 npm 最新版（单次查询；失败只标 latestInfo.error，不覆盖上面的检测结果）
            setLatestInfo(null);
            try {
                const latestResult = await serialCall("check_latest", {});
                const lr = parseRecord(latestResult);
                if (lr.success === false) {
                    setLatestInfo({ checked: true, error: asText(lr.error) || "查询最新版本失败" });
                } else {
                    setLatestInfo({
                        checked: true,
                        latest: asText(lr.latestVersion),
                        installed: asText(lr.installedVersion),
                        hasUpdate: !!lr.hasUpdate,
                        message: asText(lr.message)
                    });
                    if (asText(lr.installedVersion)) {
                        setBiliVersion(asText(lr.installedVersion));
                    }
                }
            } catch (latestError) {
                setLatestInfo({ checked: true, error: toErrorText(latestError) });
            }
        } catch (error) {
            setLastError(toErrorText(error));
        } finally {
            setBusy(false);
            setBusyLabel("");
        }
    }

    async function doInstall() {
        setBusy(true);
        setBusyLabel("正在安装 billion-context（npm install -g，可能较久）…");
        setLastError("");
        try {
            const result = await serialCall("install", {});
            const record = parseRecord(result);
            if (record.success === false) {
                setLastError(asText(record.error) || "install 失败");
                if (record.missingNodeRuntime === true) {
                    setLastError("缺少 Node runtime：请先在 Operit Ubuntu/PRoot 容器中安装 Node.js（本插件不自行下载 Node）。");
                }
                setLastMsg("");
            } else {
                setInstalled(true);
                if (asText(record.biliVersion)) {
                    setBiliVersion(asText(record.biliVersion));
                }
                if (asText(record.biliPath)) {
                    setBiliPath(asText(record.biliPath));
                }
                setLastMsg(record.alreadyInstalled ? "bili 已安装，无需重复安装" : "billion-context 安装成功");
            }
        } catch (error) {
            setLastError(toErrorText(error));
        } finally {
            setBusy(false);
            setBusyLabel("");
        }
    }

    async function doStart() {
        setBusy(true);
        setBusyLabel("正在启动 bili（等待健康检查通过）…");
        setLastError("");
        try {
            const result = await serialCall("start", { host: host.trim() || "127.0.0.1", port: Number(port) || 8787, wait_seconds: 45 });
            const record = parseRecord(result);
            if (record.success === false) {
                setLastError(asText(record.error) || "start 失败");
                if (record.needInstall === true) {
                    setLastError("bili 未安装，请先点击「安装」");
                }
                if (asText(record.startupLogTail)) {
                    setLogText(asText(record.startupLogTail));
                }
                setLastMsg("");
                return;
            }
            setRunning(true);
            setHealthy(record.healthy === true);
            setPid(record.pid === undefined || record.pid === null ? null : record.pid);
            if (asText(record.biliVersion)) {
                setBiliVersion(asText(record.biliVersion));
            }
            if (asText(record.health && record.health.body)) {
                setHealthBody(asText(record.health.body));
            }
            setLastMsg(record.alreadyRunning ? "bili 已在运行且健康" : "bili 启动成功（健康检查通过）");
        } catch (error) {
            setLastError(toErrorText(error));
        } finally {
            setBusy(false);
            setBusyLabel("");
        }
    }

    async function doStop() {
        setBusy(true);
        setBusyLabel("正在停止 bili…");
        setLastError("");
        try {
            const result = await serialCall("stop", { timeout_seconds: 20 });
            const record = parseRecord(result);
            if (record.success === false) {
                setLastError(asText(record.error) || "stop 失败");
                setLastMsg("");
                return;
            }
            setRunning(false);
            setHealthy(false);
            setPid(null);
            setHealthBody("");
            setLastMsg(record.stopped ? "bili 已停止" : "bili 未能确认停止（health 仍通过）");
        } catch (error) {
            setLastError(toErrorText(error));
        } finally {
            setBusy(false);
            setBusyLabel("");
        }
    }

    async function doRestart() {
        setBusy(true);
        setBusyLabel("正在重启 bili…");
        setLastError("");
        try {
            const result = await serialCall("restart", { host: host.trim() || "127.0.0.1", port: Number(port) || 8787, wait_seconds: 45 });
            const record = parseRecord(result);
            if (record.success === false) {
                setLastError(asText(record.error) || "restart 失败");
                if (record.needInstall === true) {
                    setLastError("bili 未安装，请先点击「安装」");
                }
                setLastMsg("");
                return;
            }
            setRunning(true);
            setHealthy(record.healthy === true);
            setPid(record.pid === undefined || record.pid === null ? null : record.pid);
            setLastMsg("bili 重启成功（健康检查通过）");
        } catch (error) {
            setLastError(toErrorText(error));
        } finally {
            setBusy(false);
            setBusyLabel("");
        }
    }

    async function doUpdate() {
        setBusy(true);
        setBusyLabel("正在更新 billion-context（bili update）…");
        setLastError("");
        try {
            const result = await serialCall("update", {});
            const record = parseRecord(result);
            if (record.success === false) {
                setLastError(asText(record.error) || "update 失败");
                if (record.needInstall === true) {
                    setLastError("bili 未安装，无法 update。请先点击「安装」");
                }
                setLastMsg("");
                return;
            }
            if (asText(record.biliVersion)) {
                setBiliVersion(asText(record.biliVersion));
            }
            setLastMsg(record.updated ? "bili update 完成（版本 " + asText(record.biliVersion || "?") + "）" : "bili update 未确认成功");
        } catch (error) {
            setLastError(toErrorText(error));
        } finally {
            setBusy(false);
            setBusyLabel("");
        }
    }

    async function doHealth() {
        setBusy(true);
        setBusyLabel("正在探测健康检查…");
        setLastError("");
        try {
            const result = await serialCall("health", { port: Number(port) || 8787 });
            const record = parseRecord(result);
            if (record.success === false) {
                setLastError(asText(record.error) || "health 失败");
                setLastMsg("");
                return;
            }
            setHealthy(record.healthy === true);
            setRunning(record.healthy === true);
            setHealthBody(asText(record.body));
            setLastMsg(record.healthy ? "健康检查通过（ok=true）" : "健康检查未通过（statusCode=" + asText(record.statusCode) + "）");
        } catch (error) {
            setLastError(toErrorText(error));
        } finally {
            setBusy(false);
            setBusyLabel("");
        }
    }

    async function doLogs() {
        setBusy(true);
        setBusyLabel("正在读取官方日志尾部…");
        setLastError("");
        try {
            const result = await serialCall("logs", { lines: Number(logLines) || 200 });
            const record = parseRecord(result);
            if (record.success === false) {
                setLastError(asText(record.error) || "logs 失败");
                setLastMsg("");
                return;
            }
            setLogText(asText(record.content) || "（日志为空）");
            setLastMsg("已读取日志尾部 " + asText(record.linesReturned) + " 行");
        } catch (error) {
            setLastError(toErrorText(error));
        } finally {
            setBusy(false);
            setBusyLabel("");
        }
    }

    async function doProxyUrl() {
        setBusy(true);
        setBusyLabel("正在生成 Proxy URL…");
        setLastError("");
        try {
            const result = await serialCall("proxy_url", { upstream_base_url: upstream.trim(), port: Number(port) || 8787, host: host.trim() || "127.0.0.1" });
            const record = parseRecord(result);
            if (record.success === false) {
                setLastError(asText(record.error) || "proxy_url 失败");
                setLastMsg("");
                return;
            }
            setProxyUrl(asText(record.proxyUrl));
            setLastMsg("Proxy URL 已生成");
        } catch (error) {
            setLastError(toErrorText(error));
        } finally {
            setBusy(false);
            setBusyLabel("");
        }
    }

    async function doCopyProxyUrl() {
        if (!proxyUrl) {
            setLastError("请先生成 Proxy URL");
            return;
        }
        try {
            var copied = false;
            // Compose DSL 无原生 clipboard API → 用 Java bridge 写 Android 剪贴板
            // （官方 message_insert 在 UI 上下文使用 Java.getApplicationContext() 的先例）
            if (typeof Java !== "undefined" && Java && typeof Java.getApplicationContext === "function") {
                try {
                    var context = Java.getApplicationContext();
                    var ClipboardManager = Java.type("android.content.ClipboardManager");
                    var ClipData = Java.type("android.content.ClipData");
                    var cm = context.getSystemService("clipboard");
                    if (cm) {
                        cm.setPrimaryClip(ClipData.newPlainText("bili_proxy_url", proxyUrl));
                        copied = true;
                    }
                } catch (javaErr) {
                    copied = false;
                }
            }
            if (copied) {
                setLastMsg("Proxy URL 已复制到剪贴板（可粘贴到 Provider Base URL）");
            } else {
                setLastMsg("当前环境不支持自动复制，请长按下方 Proxy URL 手动选择复制");
                setLastError("");
                return;
            }
            setLastError("");
        } catch (error) {
            setLastError(toErrorText(error));
        }
    }

    // ---------- 派生展示 ----------
    const statusText = healthy === true
        ? "运行中（健康）"
        : (running === true ? "启动中/未健康" : (running === false ? "已停止" : "--"));
    const statusColor = healthy === true ? T.primary : (running === true ? T.tertiary : T.onSurfaceVariant);
    const installedText = installed === null ? "--" : (installed ? "已安装" : "未安装");

    // ---------- render（纯函数，无副作用） ----------

    return UI.LazyColumn({
        fillMaxSize: true,
        padding: 16,
        spacing: 8
    }, [
        // （平台顶栏已显示页面名，不再自绘大标题）

        // 状态卡片（加大间距，信息分块）
        UI.Card({ fillMaxWidth: true, containerColor: T.surfaceVariant, padding: 20 }, [
            // 核心状态：「状态：已停止」连在一起显示
            UI.Row({ fillMaxWidth: true, verticalAlignment: "center", paddingHorizontal: 8 }, [
                UI.Text({ text: "状态：" + statusText, color: statusColor, bold: true, fontSize: 16 }),
                UI.Text({ text: healthy === true ? "  ✓ ok=true" : "", color: T.primary, fontSize: 15, bold: true })
            ]),
            UI.Spacer({ height: 12 }),

            // 安装 / 版本（左右分布）
            UI.Row({ fillMaxWidth: true, verticalAlignment: "center", horizontalArrangement: "spaceEvenly", paddingHorizontal: 8 }, [
                UI.Row({ spacing: 8, verticalAlignment: "center", weight: 1 }, [
                    UI.Text({ text: "安装:", color: T.onSurfaceVariant, fontSize: 14 }),
                    UI.Text({ text: installedText, color: installed === true ? T.primary : T.tertiary, fontSize: 14, bold: true })
                ]),
                UI.Row({ spacing: 8, verticalAlignment: "center", weight: 1 }, [
                    UI.Text({ text: "版本:", color: T.onSurfaceVariant, fontSize: 14 }),
                    UI.Text({ text: biliVersion || "--", color: T.onSurface, fontSize: 14, bold: true })
                ]),
                UI.Row({ spacing: 8, verticalAlignment: "center", weight: 1 }, [
                    UI.Text({ text: "最新:", color: T.onSurfaceVariant, fontSize: 14 }),
                    UI.Text({
                        text: latestInfo && latestInfo.checked
                            ? (latestInfo.error ? "查询失败" : (latestInfo.latest || "--"))
                            : "--",
                        color: latestInfo && latestInfo.checked && !latestInfo.error
                            ? (latestInfo.hasUpdate ? T.tertiary : T.primary)
                            : T.onSurface,
                        fontSize: 14,
                        bold: true
                    })
                ])
            ]),
            UI.Spacer({ height: 10 }),

            // Node / npm（左右分布）
            UI.Row({ fillMaxWidth: true, verticalAlignment: "center", horizontalArrangement: "spaceEvenly", paddingHorizontal: 8 }, [
                UI.Row({ spacing: 8, verticalAlignment: "center", weight: 1 }, [
                    UI.Text({ text: "Node:", color: T.onSurfaceVariant, fontSize: 13 }),
                    UI.Text({ text: nodeVersion || "--", color: T.onSurface, fontSize: 13 })
                ]),
                UI.Row({ spacing: 8, verticalAlignment: "center", weight: 1 }, [
                    UI.Text({ text: "npm:", color: T.onSurfaceVariant, fontSize: 13 }),
                    UI.Text({ text: npmVersion || "--", color: T.onSurface, fontSize: 13 })
                ])
            ]),
            UI.Spacer({ height: 10 }),

            // bili 路径（与其他行同缩进）
            UI.Row({ fillMaxWidth: true, verticalAlignment: "center", horizontalArrangement: "spaceEvenly", paddingHorizontal: 8 }, [
                UI.Row({ spacing: 8, verticalAlignment: "center", weight: 1 }, [
                    UI.Text({ text: "bili 路径:", color: T.onSurfaceVariant, fontSize: 13 }),
                    UI.Text({ text: biliPath || "--", color: T.onSurface, fontSize: 13, maxLines: 1, overflow: "ellipsis" })
                ]),
                UI.Row({ spacing: 8, verticalAlignment: "center", weight: 1 }, [
                    UI.Text({ text: "", color: T.onSurfaceVariant, fontSize: 13 })
                ])
            ]),
            UI.Spacer({ height: 10 }),

            // 端口 / PID（左右分布）
            UI.Row({ fillMaxWidth: true, verticalAlignment: "center", horizontalArrangement: "spaceEvenly", paddingHorizontal: 8 }, [
                UI.Row({ spacing: 8, verticalAlignment: "center", weight: 1 }, [
                    UI.Text({ text: "端口:", color: T.onSurfaceVariant, fontSize: 13 }),
                    UI.Text({ text: port || "8787", color: T.onSurface, fontSize: 13, bold: true })
                ]),
                UI.Row({ spacing: 8, verticalAlignment: "center", weight: 1 }, [
                    UI.Text({ text: "PID:", color: T.onSurfaceVariant, fontSize: 13 }),
                    UI.Text({ text: pid === null ? "--" : String(pid), color: T.onSurface, fontSize: 13 })
                ])
            ]),
            UI.Spacer({ height: 10 }),

            // health 响应（与其他行同缩进）
            UI.Row({ fillMaxWidth: true, verticalAlignment: "center", horizontalArrangement: "spaceEvenly", paddingHorizontal: 8 }, [
                UI.Row({ spacing: 8, verticalAlignment: "center", weight: 1 }, [
                    UI.Text({
                        text: healthBody ? "health: " + healthBody.slice(0, 200) : "health: （未探测）",
                        color: T.onSurfaceVariant,
                        fontSize: 12,
                        maxLines: 2
                    })
                ]),
                UI.Row({ spacing: 8, verticalAlignment: "center", weight: 1 }, [
                    UI.Text({ text: "", color: T.onSurfaceVariant, fontSize: 13 })
                ])
            ]),
            // 最新版本检测状态（仅检测后显示；失败为红色提示，不自动重试）
            latestInfo && latestInfo.checked ? UI.Spacer({ height: 10 }) : UI.Spacer({ height: 0 }),
            latestInfo && latestInfo.checked ? UI.Row({ fillMaxWidth: true, verticalAlignment: "center", paddingHorizontal: 8, spacing: 8 }, [
                UI.Text({
                    text: latestInfo.error
                        ? "最新版查询失败：" + latestInfo.error
                        : (latestInfo.message || ("最新 " + (latestInfo.latest || "--"))),
                    color: latestInfo.error ? T.error : (latestInfo.hasUpdate ? T.tertiary : T.onSurfaceVariant),
                    fontSize: 12,
                    maxLines: 3,
                    softWrap: true
                })
            ]) : UI.Spacer({ height: 0 })
        ]),

        // 操作按钮（weight:1 均分，配置页款式）
        UI.Row({ spacing: 8 }, [
            UI.Button({ text: "刷新", onClick: refreshAll, enabled: !busy, weight: 1 }),
            UI.Button({ text: "检测", onClick: doDetect, enabled: !busy, weight: 1 }),
            UI.Button({ text: "安装", onClick: doInstall, enabled: !busy && installed !== true, weight: 1 })
        ]),
        UI.Row({ spacing: 8 }, [
            UI.Button({ text: "启动", onClick: doStart, enabled: !busy && healthy !== true && installed === true, weight: 1 }),
            UI.Button({ text: "停止", onClick: doStop, enabled: !busy && running === true, weight: 1 }),
            UI.Button({ text: "重启", onClick: doRestart, enabled: !busy && installed === true, weight: 1 })
        ]),
        UI.Row({ spacing: 8 }, [
            UI.Button({ text: "更新", onClick: doUpdate, enabled: !busy && installed === true, weight: 1 }),
            UI.Button({ text: "健康检查", onClick: doHealth, enabled: !busy, weight: 1 })
        ]),

        // Proxy URL 生成（分组标题 + 输入 + 按钮，配置页款式）
        UI.Text({ text: "Proxy URL 生成", style: "titleSmall", color: "primary", fontWeight: "bold", softWrap: true }),
        UI.Card({ fillMaxWidth: true, containerColor: T.surfaceVariant, shape: { cornerRadius: 8 }, elevation: 1 }, [
            UI.Column({ fillMaxWidth: true, padding: 14, spacing: 8 }, [
                UI.TextField({
                    value: upstream,
                    onValueChange: setUpstream,
                    label: "Upstream Base URL",
                    placeholder: "https://api.openai.com/v1",
                    singleLine: true
                }),
                UI.Row({ spacing: 8 }, [
                    UI.Button({ text: "生成", onClick: doProxyUrl, enabled: !busy, weight: 1 }),
                    UI.Button({ text: "复制", onClick: doCopyProxyUrl, enabled: !busy && !!proxyUrl, weight: 1 })
                ]),
                UI.Text({
                    text: proxyUrl ? "Proxy URL: " + proxyUrl : "输入 upstream 后点击生成，例如 http://127.0.0.1:8787/bili/https://api.openai.com/v1",
                    color: proxyUrl ? T.primary : T.onSurfaceVariant,
                    fontSize: 12,
                    maxLines: 4,
                    softWrap: true
                })
            ])
        ]),

        // 日志（分组标题 + 输入 + 按钮 + 卡片，配置页款式）
        UI.Text({ text: "日志（官方 bili.log 尾部）", style: "titleSmall", color: "primary", fontWeight: "bold", softWrap: true }),
        UI.Card({ fillMaxWidth: true, containerColor: T.surfaceVariant, shape: { cornerRadius: 8 }, elevation: 1 }, [
            UI.Column({ fillMaxWidth: true, padding: 14, spacing: 8 }, [
                UI.TextField({
                    value: logLines,
                    onValueChange: setLogLines,
                    label: "行数",
                    singleLine: true,
                    fillMaxWidth: true
                }),
                UI.Button({
                    text: "读取日志",
                    onClick: doLogs,
                    enabled: !busy,
                    fillMaxWidth: true
                }),
                UI.Text({
                    text: logText ? logText.slice(-12000) : "点击「读取」查看 ~/.local/state/billion-context/bili.log 尾部",
                    color: T.onSurfaceVariant,
                    fontSize: 11,
                    maxLines: 60,
                    softWrap: true
                })
            ])
        ]),

        // 忙碌指示
        busy ? UI.Row({ spacing: 8, verticalAlignment: "center" }, [
            UI.CircularProgressIndicator({ strokeWidth: 3 }),
            UI.Text({ text: busyLabel || "处理中…", color: T.tertiary, fontSize: 12 })
        ]) : UI.Spacer({ height: 0 }),

        // 消息区
        lastMsg ? UI.Text({ text: "✓ " + lastMsg, color: T.primary, fontSize: 12 }) : UI.Spacer({ height: 0 }),
        lastError ? UI.Text({ text: "✗ " + lastError, color: T.error, fontSize: 12 }) : UI.Spacer({ height: 0 }),

        UI.Spacer({ height: 8 }),
        UI.Text({
            text: "本插件只是 Launcher/Manager。billion-context 是真正的 Context Engine，ACP 由官方 Proxy 自己完成；API Key 仍由 Operit Provider 持有并透传。",
            style: "bodySmall",
            color: "onSurfaceVariant",
            softWrap: true
        })
    ]);
}

exports.default = Screen;
