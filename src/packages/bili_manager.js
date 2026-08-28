/* METADATA
{
    "name": "bili_manager",
    "display_name": {
        "zh": "billion-context 管理",
        "en": "billion-context Manager",
        "default": "billion-context Manager"
    },
    "description": {
        "zh": "在 Operit Ubuntu/PRoot 容器中一键安装、启动、停止、重启与健康检查官方原版 billion-context Proxy（仅 Launcher/Manager，不重新实现 billion-context 核心功能）。",
        "en": "Install, start, stop, restart and health-check the official billion-context Proxy inside Operit's Ubuntu/PRoot container (launcher/manager only, never reimplements billion-context).",
        "default": "Manage the official billion-context Proxy inside Operit's Ubuntu/PRoot container."
    },
    "enabledByDefault": true,
    "category": "System",
    "tools": [
        {
            "name": "detect",
            "description": {
                "zh": "检测 Operit Ubuntu/PRoot 环境中的 node、npm、bili 版本与路径。",
                "en": "Detect node, npm and bili versions and paths in the Operit Ubuntu/PRoot environment."
            },
            "parameters": []
        },
        {
            "name": "install",
            "description": {
                "zh": "当 bili 不存在时通过官方 npm install -g billion-context 安装，安装后验证 bili --version。若 node/npm 缺失则报告缺少 Node runtime，不自行下载。",
                "en": "Install the official billion-context via npm install -g when bili is missing, then verify bili --version. Reports missing Node runtime without downloading Node."
            },
            "parameters": []
        },
        {
            "name": "start",
            "description": {
                "zh": "以 nohup setsid 后台启动 bili --host <host> --port <port>（默认 127.0.0.1:8787），PID 写入文件，并轮询 /__bili/health 直到 ok=true 才报告 running。",
                "en": "Start bili --host <host> --port <port> (default 127.0.0.1:8787) in background via nohup setsid, write PID file, poll /__bili/health until ok=true before reporting running."
            },
            "parameters": [
                { "name": "host", "description": { "zh": "监听地址，默认 127.0.0.1", "en": "Listen host, default 127.0.0.1" }, "type": "string", "required": false },
                { "name": "port", "description": { "zh": "监听端口，默认 8787", "en": "Listen port, default 8787" }, "type": "number", "required": false },
                { "name": "wait_seconds", "description": { "zh": "健康轮询最长等待秒数，默认 45", "en": "Max health poll seconds, default 45" }, "type": "number", "required": false },
                { "name": "env", "description": { "zh": "临时环境变量注入（本次启动生效，不写入配置文件）。对象形式 {KEY: value} 或字符串形式 \"KEY=VALUE;KEY2=VALUE2\"。例如 {\"ACP_RENDER_NONE\": \"1\"}。", "en": "Temporary env vars for this launch only (not persisted). Object {KEY: value} or string \"KEY=VALUE;KEY2=VALUE2\". E.g. {\"ACP_RENDER_NONE\":\"1\"}." }, "type": "string", "required": false }
            ]
        },
        {
            "name": "stop",
            "description": {
                "zh": "按 PID 文件精确停止 bili（kill 后确认 /__bili/health 失败），无 PID 时按端口/进程名兜底。",
                "en": "Stop bili precisely by PID file (confirm /__bili/health fails after kill), fall back to port/process lookup when no PID file."
            },
            "parameters": [
                { "name": "timeout_seconds", "description": { "zh": "等待停止确认的秒数，默认 20", "en": "Seconds to wait for stop confirmation, default 20" }, "type": "number", "required": false }
            ]
        },
        {
            "name": "restart",
            "description": { "zh": "停止后重新启动 bili（等价于 stop 后 start）。", "en": "Stop then start bili again (equivalent to stop followed by start)." },
            "parameters": [
                { "name": "host", "description": { "zh": "监听地址，默认 127.0.0.1", "en": "Listen host, default 127.0.0.1" }, "type": "string", "required": false },
                { "name": "port", "description": { "zh": "监听端口，默认 8787", "en": "Listen port, default 8787" }, "type": "number", "required": false },
                { "name": "wait_seconds", "description": { "zh": "健康轮询最长等待秒数，默认 45", "en": "Max health poll seconds, default 45" }, "type": "number", "required": false }
            ]
        },
        {
            "name": "auto_start",
            "description": {
                "zh": "容器/应用启动时的自愈入口：若 autoStartEnabled 开启且 bili 未运行，则自动拉起 bili；已运行则保持。供生命周期钩子调用，也可手动触发。",
                "en": "Self-healing entry on container/app startup: if autoStartEnabled is on and bili is not running, start it automatically; keep it if already running. For lifecycle hooks, also callable manually."
            },
            "parameters": [
                { "name": "host", "description": { "zh": "监听地址，默认 127.0.0.1", "en": "Listen host, default 127.0.0.1" }, "type": "string", "required": false },
                { "name": "port", "description": { "zh": "监听端口，默认 8787", "en": "Listen port, default 8787" }, "type": "number", "required": false },
                { "name": "wait_seconds", "description": { "zh": "健康轮询最长等待秒数，默认 45", "en": "Max health poll seconds, default 45" }, "type": "number", "required": false }
            ]
        },
        {
            "name": "status",
            "description": {
                "zh": "查询 bili 当前状态：进程、PID 文件、/__bili/health 探测结果、版本、端口。",
                "en": "Query current bili status: process, PID file, /__bili/health probe, version, port."
            },
            "parameters": []
        },
        {
            "name": "health",
            "description": {
                "zh": "探测 http://127.0.0.1:<port>/__bili/health，仅当返回 {\"ok\":true,...} 时报告 healthy=true。",
                "en": "Probe http://127.0.0.1:<port>/__bili/health; healthy=true only when {\"ok\":true,...} is returned."
            },
            "parameters": [
                { "name": "port", "description": { "zh": "端口，默认 8787", "en": "Port, default 8787" }, "type": "number", "required": false }
            ]
        },
        {
            "name": "version",
            "description": {
                "zh": "显示当前 billion-context 版本、bili 路径、node/npm 版本。",
                "en": "Show current billion-context version, bili path, node and npm versions."
            },
            "parameters": []
        },
        {
            "name": "update",
            "description": { "zh": "通过官方 bili update 更新 billion-context（不自行实现 npm update watcher）。", "en": "Update billion-context via official bili update." },
            "parameters": []
        },
        {
            "name": "logs",
            "description": {
                "zh": "读取官方日志 ~/.local/state/billion-context/bili.log 的尾部（默认最近 200 行，最多 800 行），不复制完整日志。",
                "en": "Read the tail of the official log ~/.local/state/billion-context/bili.log (last 200 lines by default, at most 800)."
            },
            "parameters": [
                { "name": "lines", "description": { "zh": "读取行数，默认 200，最大 800", "en": "Lines to read, default 200, max 800" }, "type": "number", "required": false },
                { "name": "keyword", "description": { "zh": "可选过滤关键词（grep -i）", "en": "Optional keyword filter (grep -i)" }, "type": "string", "required": false }
            ]
        },
        {
            "name": "proxy_url",
            "description": {
                "zh": "根据 upstream_base_url 生成零配置代理 URL：http://127.0.0.1:<port>/bili/<原 upstream URL>。不 encodeURIComponent 整个 URL，不追加 /v1、/chat/completions、/messages，endpoint 由 Operit Provider 自己处理。",
                "en": "Generate zero-config proxy URL from upstream_base_url: http://127.0.0.1:<port>/bili/<original upstream URL>. Does not encodeURIComponent the whole URL and never appends /v1, /chat/completions or /messages; endpoints are handled by the Operit provider."
            },
            "parameters": [
                { "name": "upstream_base_url", "description": { "zh": "原始 upstream Base URL，例如 https://api.openai.com/v1", "en": "Original upstream base URL, e.g. https://api.openai.com/v1" }, "type": "string", "required": true },
                { "name": "port", "description": { "zh": "bili 端口，默认 8787", "en": "bili port, default 8787" }, "type": "number", "required": false },
                { "name": "host", "description": { "zh": "bili 主机，默认 127.0.0.1", "en": "bili host, default 127.0.0.1" }, "type": "string", "required": false }
            ]
        },
        {
            "name": "bili_config_get",
            "description": {
                "zh": "读取 billion-context 官方配置文件（默认 ~/.config/billion-context/billion-context.json，BILI_CONFIG_FILE 可覆盖），返回解析后的完整配置对象；文件不存在或解析失败时给出明确错误。",
                "en": "Read the official billion-context config file (default ~/.config/billion-context/billion-context.json, overridable by BILI_CONFIG_FILE) and return the parsed config object; report a clear error when missing or unparsable."
            },
            "parameters": [
                { "name": "config_file", "description": { "zh": "自定义配置文件路径（可选，覆盖默认路径解析）", "en": "Custom config file path (optional, overrides default resolution)" }, "type": "string", "required": false }
            ]
        },
        {
            "name": "bili_config_set",
            "description": {
                "zh": "按点路径设置 billion-context 配置项（如 port、compress.minCompressRange、mitm.domains），原子写回配置文件并保留未知字段。值自动按 JSON 类型解析（数字/布尔/数组/对象/字符串）。",
                "en": "Set a billion-context config field by dot path (e.g. port, compress.minCompressRange, mitm.domains) and atomically write back the config file, preserving unknown fields. Values are JSON-typed (number/boolean/array/object/string)."
            },
            "parameters": [
                { "name": "path", "description": { "zh": "点路径，如 port 或 compress.minCompressRange", "en": "Dot path, e.g. port or compress.minCompressRange" }, "type": "string", "required": true },
                { "name": "value", "description": { "zh": "JSON 值（数字/布尔/数组/对象/字符串）", "en": "JSON value (number/boolean/array/object/string)" }, "type": "string", "required": true },
                { "name": "config_file", "description": { "zh": "自定义配置文件路径（可选）", "en": "Custom config file path (optional)" }, "type": "string", "required": false }
            ]
        },
        {
            "name": "bili_config_clear",
            "description": {
                "zh": "按点路径删除 billion-context 配置项，原子写回配置文件。父对象为空时级联删除（如 compress 下全部清空则删除 compress 本身）。",
                "en": "Remove a billion-context config field by dot path and atomically write back. Empty parent objects are pruned (e.g. removing the last compress.* deletes compress itself)."
            },
            "parameters": [
                { "name": "path", "description": { "zh": "点路径，如 compress.minCompressRange", "en": "Dot path, e.g. compress.minCompressRange" }, "type": "string", "required": true },
                { "name": "config_file", "description": { "zh": "自定义配置文件路径（可选）", "en": "Custom config file path (optional)" }, "type": "string", "required": false }
            ]
        },
        {
            "name": "bili_config_reload",
            "description": {
                "zh": "调用官方 POST /__bili/config/reload 强制重载配置文件（保存 providers 等改动后需调用以生效）。",
                "en": "Call the official POST /__bili/config/reload to force-reload the config file (needed after saving providers etc.)."
            },
            "parameters": [
                { "name": "host", "description": { "zh": "bili 主机，默认 127.0.0.1", "en": "bili host, default 127.0.0.1" }, "type": "string", "required": false },
                { "name": "port", "description": { "zh": "bili 端口，默认 8787", "en": "bili port, default 8787" }, "type": "number", "required": false }
            ]
        },
        {
            "name": "bili_config_hot_apply",
            "description": {
                "zh": "调用官方 PUT /__bili/config 热更新运行中的 bili 配置（compress 等无需重启）。返回官方响应；HTTP 409 时附带官方 parseError 供修正。",
                "en": "Call the official PUT /__bili/config to hot-apply config to a running bili (e.g. compress, no restart needed). Returns the official response; HTTP 409 includes the official parseError for correction."
            },
            "parameters": [
                { "name": "config", "description": { "zh": "要热更新的配置片段（JSON 对象，如 {\"compress\": {...}} 或 {\"providers\": {...}}）", "en": "Config fragment to apply (JSON object, e.g. {\"compress\":{...}} or {\"providers\":{...}})" }, "type": "string", "required": true },
                { "name": "host", "description": { "zh": "bili 主机，默认 127.0.0.1", "en": "bili host, default 127.0.0.1" }, "type": "string", "required": false },
                { "name": "port", "description": { "zh": "bili 端口，默认 8787", "en": "bili port, default 8787" }, "type": "number", "required": false }
            ]
        },
        {
            "name": "plugin_config_get",
            "description": {
                "zh": "读取本插件自身的配置文件（config.json，含 autoStartEnabled 等插件级开关）。",
                "en": "Read this plugin's own config file (config.json, incl. plugin-level switches like autoStartEnabled)."
            },
            "parameters": []
        },
        {
            "name": "plugin_config_set",
            "description": {
                "zh": "写入本插件自身的配置（config.json）。目前支持 autoStartEnabled（boolean）：Operit/容器启动时是否自动拉起 bili。",
                "en": "Write this plugin's own config (config.json). Currently supports autoStartEnabled (boolean): whether to auto-start bili on Operit/container startup."
            },
            "parameters": [
                { "name": "autoStartEnabled", "description": { "zh": "自动启动开关（boolean）", "en": "Auto-start switch (boolean)" }, "type": "boolean", "required": false }
            ]
        }
    ]
}
*/

/**
 * billion-context-operit — bili_manager
 *
 * 只做 Launcher / Manager，不重新实现 billion-context 的任何核心功能。
 * - 终端调用仅使用 Tools.System.terminal（create/exec/execStreaming/close），禁止 hiddenExec。
 * - 服务进程用 nohup setsid 脱离 terminal 生命周期，健康以 HTTP /__bili/health 为准。
 * - 状态持久化走文件通道（工具脚本环境无 setEnv），UI 通过工具获取真实状态。
 */
const BiliManager = (function () {
    var PACKAGE_VERSION = "0.3.3";

    var DEFAULT_HOST = "127.0.0.1";
    var DEFAULT_PORT = 8787;
    var HEALTH_PATH = "/__bili/health";
    var TERMINAL_SESSION_NAME = "bili_ctrl";
    var LOG_FILE = "$HOME/.local/state/billion-context/bili.log";
    // 配置持久化目录：优先 Android 共享目录（/sdcard/Download/Operit），失败时回退 /tmp
    var CONFIG_BASE_CANDIDATES = [
        "/sdcard/Download/Operit/billion_context/data",
        "/tmp/billion_context_operit"
    ];
    var CONFIG_FILE_NAME = "config.json";

    var DEFAULT_EXEC_TIMEOUT_MS = 15000;
    var HEALTH_POLL_INTERVAL_MS = 1500;
    var INSTALL_TIMEOUT_MS = 600000;
    var UPDATE_TIMEOUT_MS = 600000;
    var LOG_READ_MAX_LINES = 800;

    var tools = {};

    /* ------------------------------------------------------------------ */
    /* 基础工具                                                             */
    /* ------------------------------------------------------------------ */

    function asText(value) {
        if (value === undefined || value === null) {
            return "";
        }
        return String(value);
    }

    function firstNonBlank() {
        for (var i = 0; i < arguments.length; i++) {
            var value = arguments[i];
            if (typeof value === "string" && value.trim()) {
                return value.trim();
            }
        }
        return "";
    }

    function parsePositiveInt(value, fallbackValue) {
        var raw = asText(value).trim();
        if (!raw) {
            return fallbackValue;
        }
        var parsed = Number(raw);
        if (!Number.isFinite(parsed) || parsed <= 0) {
            return fallbackValue;
        }
        return Math.floor(parsed);
    }

    function createErrorResult(error, extra) {
        var result = {
            success: false,
            packageVersion: PACKAGE_VERSION,
            error: error && error.message ? error.message : String(error)
        };
        if (extra && typeof extra === "object") {
            for (var key in extra) {
                if (Object.prototype.hasOwnProperty.call(extra, key)) {
                    result[key] = extra[key];
                }
            }
        }
        return result;
    }

    function createSuccessResult(data) {
        var result = { success: true, packageVersion: PACKAGE_VERSION };
        if (data && typeof data === "object") {
            for (var key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    result[key] = data[key];
                }
            }
        }
        return result;
    }

    async function runTool(action) {
        try {
            return await action();
        } catch (error) {
            return createErrorResult(error);
        }
    }

    function resolveLogFile() {
        // ~ 由 shell 展开，这里只返回字面路径
        return LOG_FILE;
    }

    /* ------------------------------------------------------------------ */
    /* 终端执行（visible terminal，遵守《终端调用约束》）                     */
    /* ------------------------------------------------------------------ */

    var terminalSessionId = null;

    async function ensureTerminalSession() {
        var result = await Tools.System.terminal.create(TERMINAL_SESSION_NAME);
        if (!result || !result.sessionId) {
            throw new Error("Failed to create terminal session: " + JSON.stringify(result));
        }
        terminalSessionId = result.sessionId;
        return result.sessionId;
    }

    async function execCommand(command, timeoutMs) {
        var effectiveTimeout = parsePositiveInt(timeoutMs, DEFAULT_EXEC_TIMEOUT_MS);
        var sessionId = await ensureTerminalSession();
        var result = await Tools.System.terminal.exec(sessionId, command, effectiveTimeout);
        return {
            exitCode: Number(result && result.exitCode !== undefined ? result.exitCode : -1),
            output: asText(result && result.output),
            timedOut: !!(result && result.timedOut)
        };
    }

    async function execStreamingCommand(command, timeoutMs, onChunk) {
        var effectiveTimeout = parsePositiveInt(timeoutMs, 120000);
        var sessionId = await ensureTerminalSession();
        var result = await Tools.System.terminal.execStreaming(sessionId, command, {
            timeoutMs: effectiveTimeout,
            onIntermediateResult: function (event) {
                if (onChunk && event && event.chunk) {
                    onChunk(event.chunk);
                }
            }
        });
        return {
            exitCode: Number(result && result.exitCode !== undefined ? result.exitCode : -1),
            output: asText(result && result.output),
            timedOut: !!(result && result.timedOut)
        };
    }

    async function closeTerminalSession() {
        if (terminalSessionId) {
            try {
                await Tools.System.terminal.close(terminalSessionId);
            } catch (_error) {
                // 忽略关闭失败
            }
            terminalSessionId = null;
        }
    }

    /**
     * 探测命令：捕获 stderr 到输出、短超时。
     */
    async function runProbe(command, timeoutMs) {
        var probeCommand = command + " 2>&1";
        var result = await execCommand(probeCommand, parsePositiveInt(timeoutMs, 12000));
        return result;
    }

    /* ------------------------------------------------------------------ */
    /* 文件通道（工具脚本环境无 setEnv）                                     */
    /* ------------------------------------------------------------------ */

    async function resolveConfigDir() {
        for (var i = 0; i < CONFIG_BASE_CANDIDATES.length; i++) {
            var dir = CONFIG_BASE_CANDIDATES[i];
            try {
                var mkResult = await Tools.Files.mkdir(dir, true, "linux");
                if (mkResult && (mkResult.success !== false)) {
                    return dir;
                }
            } catch (_error) {
                // 尝试下一个候选目录
            }
        }
        return CONFIG_BASE_CANDIDATES[CONFIG_BASE_CANDIDATES.length - 1];
    }

    async function writeConfigFile(data) {
        var dir = await resolveConfigDir();
        var filePath = dir + "/" + CONFIG_FILE_NAME;
        var payload = JSON.stringify(data || {});
        await Tools.Files.write(filePath, payload, false, "linux");
        return filePath;
    }

    async function readConfigFile() {
        var candidates = [];
        for (var i = 0; i < CONFIG_BASE_CANDIDATES.length; i++) {
            candidates.push(CONFIG_BASE_CANDIDATES[i] + "/" + CONFIG_FILE_NAME);
        }
        var lastError = null;
        for (var j = 0; j < candidates.length; j++) {
            try {
                var existsResult = await Tools.Files.exists(candidates[j], "linux");
                var exists = !!(existsResult && (existsResult.exists === true || existsResult.success === true));
                if (exists) {
                    var readResult = await Tools.Files.read({ path: candidates[j], environment: "linux" });
                    var content = asText(readResult && readResult.content);
                    if (content) {
                        var parsed = JSON.parse(content);
                        if (parsed && typeof parsed === "object") {
                            return parsed;
                        }
                    }
                }
            } catch (error) {
                lastError = error;
            }
        }
        // 读不到就当作默认配置（首帧兜底）
        return {};
    }

    async function loadConfig() {
        var config = await readConfigFile();
        return {
            host: firstNonBlank(config.host, DEFAULT_HOST),
            port: parsePositiveInt(config.port, DEFAULT_PORT),
            autoStartEnabled: config.autoStartEnabled !== false
        };
    }

    async function saveConfig(host, port, autoStartEnabled) {
        var config = await readConfigFile();
        config.host = firstNonBlank(host, config.host, DEFAULT_HOST);
        config.port = parsePositiveInt(port, config.port, DEFAULT_PORT);
        if (typeof autoStartEnabled === "boolean") {
            config.autoStartEnabled = autoStartEnabled;
        }
        await writeConfigFile(config);
        return config;
    }

    /* ------------------------------------------------------------------ */
    /* HTTP 健康检查                                                        */
    /* ------------------------------------------------------------------ */

    function isOkHealthBody(content) {
        var text = asText(content);
        if (!text) {
            return false;
        }
        var trimmed = text.trim();
        if (trimmed.indexOf("{") === 0) {
            try {
                var parsed = JSON.parse(trimmed);
                return !!(parsed && parsed.ok === true);
            } catch (_error) {
                return /"ok"\s*:\s*true/.test(trimmed);
            }
        }
        return /"ok"\s*:\s*true/.test(trimmed);
    }

    async function probeHealth(port, timeoutMs) {
        var effectivePort = parsePositiveInt(port, DEFAULT_PORT);
        var effectiveTimeout = parsePositiveInt(timeoutMs, 8000);
        var url = "http://127.0.0.1:" + effectivePort + HEALTH_PATH;
        var startedAt = Date.now();
        try {
            var response = await Tools.Net.httpGet(url, true);
            var statusCode = Number(response && response.statusCode !== undefined ? response.statusCode : -1);
            var content = asText(response && response.content);
            var ok = statusCode >= 200 && statusCode < 300 && isOkHealthBody(content);
            return {
                healthy: ok,
                statusCode: statusCode,
                body: content.slice(0, 512),
                elapsedMs: Date.now() - startedAt,
                url: url
            };
        } catch (error) {
            return {
                healthy: false,
                statusCode: 0,
                body: "",
                error: error && error.message ? error.message : String(error),
                elapsedMs: Date.now() - startedAt,
                url: url
            };
        }
    }

    async function waitForHealth(port, waitSeconds) {
        var deadline = Date.now() + parsePositiveInt(waitSeconds, 45) * 1000;
        var attempts = 0;
        var lastProbe = null;
        while (Date.now() < deadline) {
            attempts += 1;
            lastProbe = await probeHealth(port, 6000);
            if (lastProbe.healthy) {
                return {
                    healthy: true,
                    attempts: attempts,
                    probe: lastProbe
                };
            }
            if (Date.now() + HEALTH_POLL_INTERVAL_MS >= deadline) {
                break;
            }
            await Tools.System.sleep(HEALTH_POLL_INTERVAL_MS);
        }
        return {
            healthy: false,
            attempts: attempts,
            probe: lastProbe
        };
    }

    /* ------------------------------------------------------------------ */
    /* 进程 / 文件操作                                                      */
    /* ------------------------------------------------------------------ */

    function buildPidFile(port) {
        return "/tmp/bili_" + parsePositiveInt(port, DEFAULT_PORT) + ".pid";
    }

    function buildStartupLog(port) {
        return "/tmp/bili_" + parsePositiveInt(port, DEFAULT_PORT) + "_startup.log";
    }

    function shellQuote(value) {
        return "'" + asText(value).replace(/'/g, "'\"'\"'") + "'";
    }

    /**
     * 将 env 参数（对象 或 "KEY=VALUE;KEY2=VALUE2" 字符串）转成 shell 内联前缀。
     * 返回 ""（无注入）或 "KEY='value' KEY2='value2' "（带尾随空格，接在 setsid 后）。
     */
    function buildEnvPrefix(envParam) {
        var entries = [];
        if (envParam && typeof envParam === "object" && !Array.isArray(envParam)) {
            for (var key in envParam) {
                if (Object.prototype.hasOwnProperty.call(envParam, key)) {
                    entries.push([key, asText(envParam[key])]);
                }
            }
        } else if (typeof envParam === "string") {
            var parts = envParam.split(";");
            for (var i = 0; i < parts.length; i++) {
                var part = parts[i].trim();
                if (!part) {
                    continue;
                }
                var eq = part.indexOf("=");
                if (eq <= 0) {
                    continue;
                }
                entries.push([part.slice(0, eq).trim(), part.slice(eq + 1)]);
            }
        }
        if (entries.length === 0) {
            return "";
        }
        var prefix = "";
        for (var j = 0; j < entries.length; j++) {
            var name = entries[j][0];
            if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
                continue;
            }
            prefix += name + "=" + shellQuote(entries[j][1]) + " ";
        }
        return prefix;
    }

    async function readPidFile(port) {
        var pidFile = buildPidFile(port);
        var result = await execCommand("cat " + shellQuote(pidFile) + " 2>/dev/null", 8000);
        var pidText = asText(result.output).trim();
        var pid = Number(pidText);
        if (!Number.isFinite(pid) || pid <= 0) {
            return null;
        }
        return pid;
    }

    async function pidIsAlive(pid) {
        var result = await execCommand("kill -0 " + String(pid) + " 2>/dev/null && echo __ALIVE__ || echo __DEAD__", 8000);
        return asText(result.output).indexOf("__ALIVE__") >= 0;
    }

    async function findBiliPidsByPort(port) {
        var result = await execCommand(
            "ss -ltnp 2>/dev/null | grep -E ':" + String(parsePositiveInt(port, DEFAULT_PORT)) + "\\b' | grep -oE 'pid=[0-9]+' | grep -oE '[0-9]+' | sort -u | head -5",
            10000
        );
        var pids = [];
        var lines = asText(result.output).split(/\r?\n/);
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line) {
                continue;
            }
            var pid = Number(line);
            if (Number.isFinite(pid) && pid > 0) {
                pids.push(pid);
            }
        }
        return pids;
    }

    async function findBiliPidsByProcess(port) {
        var pattern = "((bili|fakebili|fake_bili_server) --host|bili --host).*--port " + String(parsePositiveInt(port, DEFAULT_PORT));
        var result = await execCommand(
            "pgrep -f " + shellQuote(pattern) + " 2>/dev/null | head -10",
            8000
        );
        var pids = [];
        var lines = asText(result.output).split(/\r?\n/);
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line) {
                continue;
            }
            var pid = Number(line);
            if (Number.isFinite(pid) && pid > 0) {
                pids.push(pid);
            }
        }
        return pids;
    }

    /* ------------------------------------------------------------------ */
    /* 工具实现                                                             */
    /* ------------------------------------------------------------------ */

    async function detect() {
        return await runTool(async function () {
            var nodeResult = await runProbe("node --version 2>&1; command -v node 2>&1");
            var npmResult = await runProbe("npm --version 2>&1; command -v npm 2>&1");
            var biliResult = await runProbe("command -v bili 2>&1 || true; bili --version 2>&1 || true");

            var nodeOutput = asText(nodeResult.output);
            var npmOutput = asText(npmResult.output);
            var biliOutput = asText(biliResult.output);

            var nodeLines = nodeOutput.split(/\r?\n/).map(function (line) { return line.trim(); }).filter(Boolean);
            var npmLines = npmOutput.split(/\r?\n/).map(function (line) { return line.trim(); }).filter(Boolean);
            var biliLines = biliOutput.split(/\r?\n/).map(function (line) { return line.trim(); }).filter(Boolean);

            function extractVersion(lines, prefix) {
                for (var i = 0; i < lines.length; i++) {
                    var line = lines[i];
                    if (prefix && line.indexOf(prefix) === 0) {
                        return line.slice(prefix.length).trim();
                    }
                    if (/^v?\d+\.\d+\.\d+/.test(line)) {
                        return line;
                    }
                }
                return "";
            }

            function extractPath(lines, binaryName) {
                for (var i = 0; i < lines.length; i++) {
                    var line = lines[i];
                    if (line.indexOf(binaryName) >= 0 && line.indexOf("/") >= 0) {
                        return line;
                    }
                    if (/^\//.test(line)) {
                        return line;
                    }
                }
                return "";
            }

            var nodeVersion = extractVersion(nodeLines, "v");
            var nodePath = extractPath(nodeLines, "node");
            var npmVersion = extractVersion(npmLines, "");
            var npmPath = extractPath(npmLines, "npm");
            var biliVersion = extractVersion(biliLines, "");
            var biliPath = extractPath(biliLines, "bili");
            if (!biliPath) {
                for (var i = 0; i < biliLines.length; i++) {
                    if (biliLines[i].indexOf("/") >= 0) {
                        biliPath = biliLines[i];
                        break;
                    }
                }
            }

            var hasNode = !!(nodeVersion || nodePath);
            var hasNpm = !!(npmVersion || npmPath);
            var hasBili = !!biliPath;

            return createSuccessResult({
                environment: "operit-ubuntu-proot",
                node: {
                    installed: hasNode,
                    version: nodeVersion,
                    path: nodePath,
                    raw: nodeOutput.slice(0, 400)
                },
                npm: {
                    installed: hasNpm,
                    version: npmVersion,
                    path: npmPath,
                    raw: npmOutput.slice(0, 400)
                },
                bili: {
                    installed: hasBili,
                    version: biliVersion,
                    path: biliPath,
                    raw: biliOutput.slice(0, 400)
                },
                summary: {
                    node: hasNode ? (nodeVersion || "present") : "missing",
                    npm: hasNpm ? (npmVersion || "present") : "missing",
                    bili: hasBili ? (biliVersion || "present") : "missing"
                }
            });
        });
    }

    async function install() {
        return await runTool(async function () {
            var detection = await detect();
            if (!detection.success) {
                return createErrorResult(new Error("检测环境失败: " + detection.error));
            }
            if (detection.bili && detection.bili.installed) {
                return createSuccessResult({
                    alreadyInstalled: true,
                    biliVersion: detection.bili.version,
                    biliPath: detection.bili.path,
                    message: "bili 已安装，无需重复安装"
                });
            }
            if (!detection.node || !detection.node.installed) {
                return createErrorResult(
                    new Error("缺少 Node runtime（node 未找到）。请先在 Operit Ubuntu/PRoot 容器中安装 Node.js，本插件不会自行下载 Node 二进制。"),
                    { missingNodeRuntime: true, node: detection.node, npm: detection.npm }
                );
            }
            if (!detection.npm || !detection.npm.installed) {
                return createErrorResult(
                    new Error("缺少 npm（npm 未找到）。请先确认 Node.js 安装完整（含 npm），本插件不会自行下载 Node 二进制。"),
                    { missingNpm: true, node: detection.node, npm: detection.npm }
                );
            }

            var installChunks = [];
            var installResult = await execStreamingCommand(
                "npm install -g billion-context 2>&1",
                INSTALL_TIMEOUT_MS,
                function (chunk) {
                    installChunks.push(chunk);
                }
            );
            if (installResult.timedOut) {
                return createErrorResult(
                    new Error("npm install -g billion-context 超时（10 分钟），请检查网络后重试。"),
                    { installOutputTail: asText(installChunks.join("")).slice(-2000), timedOut: true }
                );
            }
            if (installResult.exitCode !== 0) {
                return createErrorResult(
                    new Error("npm install -g billion-context 失败，exitCode=" + installResult.exitCode),
                    { installOutputTail: (installChunks.join("") || installResult.output).slice(-2000) }
                );
            }

            var verifyResult = await execCommand("bili --version 2>&1; command -v bili 2>&1", 15000);
            var verifyOutput = asText(verifyResult.output);
            var verifyLines = verifyOutput.split(/\r?\n/).map(function (line) { return line.trim(); }).filter(Boolean);
            var biliVersion = "";
            var biliPath = "";
            for (var i = 0; i < verifyLines.length; i++) {
                var line = verifyLines[i];
                if (/^v?\d+\.\d+\.\d+/.test(line) && !biliVersion) {
                    biliVersion = line;
                }
                if (!biliPath && line.indexOf("/") >= 0) {
                    biliPath = line;
                }
            }
            if (!biliVersion && !biliPath) {
                return createErrorResult(
                    new Error("npm 安装完成但 bili CLI 不可执行。安装输出: " + verifyOutput.slice(0, 500)),
                    { installOutputTail: verifyOutput.slice(0, 1000) }
                );
            }

            return createSuccessResult({
                installed: true,
                alreadyInstalled: false,
                biliVersion: biliVersion,
                biliPath: biliPath,
                installOutputTail: (installChunks.join("") || installResult.output).slice(-1500),
                message: "billion-context 安装成功"
            });
        });
    }

    async function readBiliVersion() {
        var result = await runProbe("bili --version 2>&1", 10000);
        var lines = asText(result.output).split(/\r?\n/);
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (/^v?\d+\.\d+\.\d+/.test(line)) {
                return line;
            }
        }
        return "";
    }

    async function start(params) {
        return await runTool(async function () {
            var config = await loadConfig();
            var host = firstNonBlank(params && params.host, config.host, DEFAULT_HOST);
            var port = parsePositiveInt(params && params.port, config.port, DEFAULT_PORT);
            var waitSeconds = parsePositiveInt(params && params.wait_seconds, 45);

            var detection = await detect();
            var hasBili = detection.success && detection.bili && detection.bili.installed;
            if (!hasBili) {
                return createErrorResult(
                    new Error("bili 未安装，请先执行 install。"),
                    { needInstall: true, detection: detection }
                );
            }

            // 已健康运行则直接复用（幂等）
            var currentHealth = await probeHealth(port, 6000);
            if (currentHealth.healthy) {
                await saveConfig(host, port);
                // 补写 PID 文件：若非本插件启动（无 PID 文件），按端口反查进程并落盘
                var existingPid = await readPidFile(port);
                if (!existingPid) {
                    var portPids = await findBiliPidsByPort(port);
                    var chosen = portPids.length > 0 ? portPids[0] : null;
                    if (chosen) {
                        await execCommand("echo " + String(chosen) + " > " + shellQuote(buildPidFile(port)) + " 2>/dev/null", 8000);
                    }
                }
                return createSuccessResult({
                    alreadyRunning: true,
                    running: true,
                    healthy: true,
                    host: host,
                    port: port,
                    health: currentHealth,
                    proxyBaseUrl: "http://127.0.0.1:" + port + "/bili/",
                    message: "bili 已在运行且健康"
                });
            }

            // 清理可能残留的 PID 文件与启动日志
            await execCommand(
                "rm -f " + shellQuote(buildPidFile(port)) + " " + shellQuote(buildStartupLog(port)) + " 2>/dev/null",
                8000
            );

            // 轻提交：nohup setsid 脱离 terminal 生命周期，毫秒级返回
            var envPrefix = buildEnvPrefix(params && params.env);
            var launchCommand = [
                "nohup setsid " + envPrefix + "bili --host " + shellQuote(host) + " --port " + String(port),
                "> " + shellQuote(buildStartupLog(port)) + " 2>&1 < /dev/null &",
                "echo $! > " + shellQuote(buildPidFile(port)),
                "echo __BILI_LAUNCH_SUBMITTED__"
            ].join(" ");
            var submitResult = await execCommand(launchCommand, 10000);
            if (submitResult.timedOut) {
                return createErrorResult(
                    new Error("bili 启动命令提交超时"),
                    { submitOutput: asText(submitResult.output).slice(-1000) }
                );
            }

            var waitResult = await waitForHealth(port, waitSeconds);
            if (!waitResult.healthy) {
                var startupLog = await execCommand(
                    "tail -n 60 " + shellQuote(buildStartupLog(port)) + " 2>/dev/null",
                    8000
                );
                var pid = await readPidFile(port);
                return createErrorResult(
                    new Error("bili 启动后健康检查未通过（" + waitSeconds + "s 内 " + waitResult.attempts + " 次探测）。"),
                    {
                        running: false,
                        healthy: false,
                        host: host,
                        port: port,
                        attempts: waitResult.attempts,
                        lastProbe: waitResult.probe,
                        pid: pid,
                        startupLogTail: asText(startupLog.output).slice(-2000)
                    }
                );
            }

            await saveConfig(host, port);
            var pid = await readPidFile(port);
            var version = await readBiliVersion();
            return createSuccessResult({
                running: true,
                healthy: true,
                host: host,
                port: port,
                pid: pid,
                biliVersion: version,
                attempts: waitResult.attempts,
                health: waitResult.probe,
                proxyBaseUrl: "http://127.0.0.1:" + port + "/bili/",
                message: "bili 启动成功"
            });
        });
    }

    async function auto_start(params) {
        return await runTool(async function () {
            var config = await loadConfig();
            var host = firstNonBlank(params && params.host, config.host, DEFAULT_HOST);
            var port = parsePositiveInt(params && params.port, config.port, DEFAULT_PORT);

            if (!config.autoStartEnabled) {
                return createSuccessResult({
                    started: false,
                    skipped: true,
                    reason: "auto_start_disabled",
                    message: "自动启动已关闭（config.autoStartEnabled=false），不拉起 bili。"
                });
            }

            // 已健康运行则保持，不做任何事
            var currentHealth = await probeHealth(port, 5000);
            if (currentHealth.healthy) {
                return createSuccessResult({
                    started: false,
                    alreadyRunning: true,
                    running: true,
                    healthy: true,
                    host: host,
                    port: port,
                    health: currentHealth.probe,
                    proxyBaseUrl: "http://127.0.0.1:" + port + "/bili/",
                    message: "bili 已在运行且健康，无需自动启动。"
                });
            }

            // 未运行则拉起（start 内部幂等：已运行则保持）
            var startResult = await start({
                host: host,
                port: port,
                wait_seconds: parsePositiveInt(params && params.wait_seconds, 45)
            });
            return createSuccessResult({
                started: startResult.success === true,
                skipped: false,
                host: host,
                port: port,
                detail: startResult,
                message: startResult.success
                    ? "bili 自动启动成功。"
                    : "bili 自动启动未完成：" + asText(startResult.error)
            });
        });
    }

    async function stop(params) {
        return await runTool(async function () {
            var config = await loadConfig();
            var port = parsePositiveInt(params && params.port, config.port, DEFAULT_PORT);
            var timeoutSeconds = parsePositiveInt(params && params.timeout_seconds, 20);

            var stoppedPids = [];
            var pid = await readPidFile(port);
            var targets = [];
            if (pid && (await pidIsAlive(pid))) {
                targets.push(pid);
            }
            if (targets.length === 0) {
                var portPids = await findBiliPidsByPort(port);
                for (var i = 0; i < portPids.length; i++) {
                    if (targets.indexOf(portPids[i]) < 0) {
                        targets.push(portPids[i]);
                    }
                }
            }
            if (targets.length === 0) {
                // 兜底：按命令行特征 pgrep（ss/lsof 不可用时）
                var procPids = await findBiliPidsByProcess(port);
                for (var j2 = 0; j2 < procPids.length; j2++) {
                    if (targets.indexOf(procPids[j2]) < 0) {
                        targets.push(procPids[j2]);
                    }
                }
            }

            for (var j = 0; j < targets.length; j++) {
                // setsid 启动后 PGID == PID，先杀进程组（覆盖 bili 派生的子进程）
                await execCommand(
                    "kill -- -" + String(targets[j]) + " 2>/dev/null; kill " + String(targets[j]) + " 2>/dev/null; true",
                    8000
                );
                stoppedPids.push(targets[j]);
            }

            // 等待健康失败（进程真正退出）
            var deadline = Date.now() + timeoutSeconds * 1000;
            var health = await probeHealth(port, 5000);
            while (health.healthy && Date.now() < deadline) {
                await Tools.System.sleep(1000);
                health = await probeHealth(port, 5000);
            }
            var stopped = !health.healthy;

            if (!stopped && targets.length > 0) {
                for (var k = 0; k < targets.length; k++) {
                    await execCommand(
                        "kill -9 -- -" + String(targets[k]) + " 2>/dev/null; kill -9 " + String(targets[k]) + " 2>/dev/null; true",
                        8000
                    );
                }
                await Tools.System.sleep(1200);
                health = await probeHealth(port, 5000);
                stopped = !health.healthy;
            }
            if (!stopped) {
                // 最终兜底：pgrep 精确匹配 bili 启动命令行并排除自身 PID（覆盖 wrapper/孤儿进程）
                // 注意：不能用 pkill -f，因为执行 shell 自身的命令行也含该模式，会自杀。
                var sweepCommand = [
                    "pattern=" + shellQuote("((bili|fakebili|fake_bili_server) --host|bili --host).*--port " + String(port)),
                    "self=$$",
                    "for p in $(pgrep -f \"$pattern\" 2>/dev/null); do",
                    "  [ \"$p\" = \"$self\" ] && continue",
                    "  kill -9 \"$p\" 2>/dev/null; true",
                    "done",
                    "true"
                ].join(" ");
                await execCommand(sweepCommand, 8000);
                await Tools.System.sleep(1200);
                health = await probeHealth(port, 5000);
                stopped = !health.healthy;
            }

            if (stopped) {
                await execCommand("rm -f " + shellQuote(buildPidFile(port)) + " 2>/dev/null", 8000);
            }

            return createSuccessResult({
                running: false,
                stopped: stopped,
                stoppedPids: stoppedPids,
                port: port,
                health: health,
                message: stopped ? "bili 已停止" : "bili 未能确认停止（health 仍通过）"
            });
        });
    }

    async function restart(params) {
        return await runTool(async function () {
            var config = await loadConfig();
            var host = firstNonBlank(params && params.host, config.host, DEFAULT_HOST);
            var port = parsePositiveInt(params && params.port, config.port, DEFAULT_PORT);
            var waitSeconds = parsePositiveInt(params && params.wait_seconds, 45);

            var stopResult = await stop({ port: port, timeout_seconds: 20 });
            if (!stopResult.stopped) {
                return createErrorResult(
                    new Error("停止旧进程失败，无法重启。"),
                    { stopResult: stopResult }
                );
            }
            var startResult = await start({ host: host, port: port, wait_seconds: waitSeconds });
            return startResult;
        });
    }

    async function status() {
        return await runTool(async function () {
            var config = await loadConfig();
            var port = parsePositiveInt(config.port, DEFAULT_PORT);
            var host = firstNonBlank(config.host, DEFAULT_HOST);

            var pid = await readPidFile(port);
            var pidAlive = false;
            if (pid) {
                pidAlive = await pidIsAlive(pid);
            }
            var health = await probeHealth(port, 6000);
            var running = health.healthy || pidAlive;
            var version = "";
            var biliPath = "";
            if (running || pidAlive) {
                var versionResult = await runProbe("bili --version 2>&1; command -v bili 2>&1", 10000);
                var lines = asText(versionResult.output).split(/\r?\n/).map(function (line) { return line.trim(); }).filter(Boolean);
                for (var i = 0; i < lines.length; i++) {
                    var line = lines[i];
                    if (!version && /^v?\d+\.\d+\.\d+/.test(line)) {
                        version = line;
                    }
                    if (!biliPath && line.indexOf("/") >= 0) {
                        biliPath = line;
                    }
                }
            } else {
                var detection = await detect();
                if (detection.success) {
                    version = detection.bili && detection.bili.version ? detection.bili.version : "";
                    biliPath = detection.bili && detection.bili.path ? detection.bili.path : "";
                }
            }

            var logExists = false;
            try {
                var logCheck = await execCommand(
                    "test -f " + resolveLogFile() + " && echo __LOG_EXISTS__ || echo __LOG_MISSING__",
                    8000
                );
                logExists = asText(logCheck.output).indexOf("__LOG_EXISTS__") >= 0;
            } catch (_error) {
                logExists = false;
            }

            return createSuccessResult({
                running: running,
                healthy: health.healthy,
                host: host,
                port: port,
                pid: pid,
                pidAlive: pidAlive,
                health: health,
                biliVersion: version,
                biliPath: biliPath,
                logFile: resolveLogFile(),
                logExists: logExists,
                proxyBaseUrl: "http://127.0.0.1:" + port + "/bili/",
                state: health.healthy ? "running" : (pidAlive ? "starting" : "stopped")
            });
        });
    }

    async function health(params) {
        return await runTool(async function () {
            var config = await loadConfig();
            var port = parsePositiveInt(params && params.port, config.port, DEFAULT_PORT);
            var probe = await probeHealth(port, 8000);
            return createSuccessResult({
                healthy: probe.healthy,
                statusCode: probe.statusCode,
                body: probe.body,
                url: probe.url,
                elapsedMs: probe.elapsedMs
            });
        });
    }

    async function version() {
        return await runTool(async function () {
            var detection = await detect();
            var biliVersion = "";
            var biliPath = "";
            if (detection.success) {
                biliVersion = detection.bili && detection.bili.version ? detection.bili.version : "";
                biliPath = detection.bili && detection.bili.path ? detection.bili.path : "";
            }
            return createSuccessResult({
                biliVersion: biliVersion,
                biliPath: biliPath,
                node: detection.node || { installed: false },
                npm: detection.npm || { installed: false },
                installed: !!(detection.success && detection.bili && detection.bili.installed)
            });
        });
    }

    async function update() {
        return await runTool(async function () {
            var detection = await detect();
            if (!detection.success || !detection.bili || !detection.bili.installed) {
                return createErrorResult(
                    new Error("bili 未安装，无法 update。请先 install。"),
                    { needInstall: true }
                );
            }
            var chunks = [];
            var updateResult = await execStreamingCommand(
                "bili update 2>&1",
                UPDATE_TIMEOUT_MS,
                function (chunk) {
                    chunks.push(chunk);
                }
            );
            if (updateResult.timedOut) {
                return createErrorResult(
                    new Error("bili update 超时（10 分钟）"),
                    { updateOutputTail: asText(chunks.join("")).slice(-2000), timedOut: true }
                );
            }
            var output = chunks.join("") || updateResult.output;
            var newVersion = "";
            if (updateResult.exitCode === 0) {
                var versionResult = await runProbe("bili --version 2>&1", 10000);
                var lines = asText(versionResult.output).split(/\r?\n/);
                for (var i = 0; i < lines.length; i++) {
                    var line = lines[i].trim();
                    if (/^v?\d+\.\d+\.\d+/.test(line)) {
                        newVersion = line;
                        break;
                    }
                }
            }
            return createSuccessResult({
                updated: updateResult.exitCode === 0,
                exitCode: updateResult.exitCode,
                biliVersion: newVersion,
                updateOutputTail: asText(output).slice(-2000),
                message: updateResult.exitCode === 0 ? "bili update 完成" : "bili update 失败（见输出尾部）"
            });
        });
    }

    async function logs(params) {
        return await runTool(async function () {
            var lines = parsePositiveInt(params && params.lines, 200);
            lines = Math.min(lines, LOG_READ_MAX_LINES);
            var keyword = firstNonBlank(params && params.keyword, "");
            var command = "tail -n " + String(lines) + " " + resolveLogFile() + " 2>&1";
            if (keyword) {
                command = command + " | grep -i " + shellQuote(keyword) + " || true";
            }
            var result = await execCommand(command, 15000);
            var content = asText(result.output);
            return createSuccessResult({
                logFile: resolveLogFile(),
                linesRequested: lines,
                linesReturned: content ? content.split(/\r?\n/).filter(Boolean).length : 0,
                content: content.slice(-30000),
                truncated: content.length > 30000
            });
        });
    }

    async function proxy_url(params) {
        return await runTool(async function () {
            var upstream = firstNonBlank(params && params.upstream_base_url, "");
            if (!upstream) {
                return createErrorResult(new Error("upstream_base_url 不能为空"));
            }
            // 去掉尾部斜杠（仅规范化，不做 encodeURIComponent，不追加任何 endpoint）
            var normalized = upstream.replace(/\/+$/, "");
            var config = await loadConfig();
            var host = firstNonBlank(params && params.host, config.host, DEFAULT_HOST);
            var port = parsePositiveInt(params && params.port, config.port, DEFAULT_PORT);
            var proxyUrl = "http://" + host + ":" + String(port) + "/bili/" + normalized;
            return createSuccessResult({
                upstreamBaseUrl: upstream,
                proxyUrl: proxyUrl,
                host: host,
                port: port,
                note: "请勿对该 URL 整体 encodeURIComponent；endpoint（如 /chat/completions）由 Operit Provider 自行追加。API Key 仍由 Operit Provider 持有并透传，本插件不保存 API Key。"
            });
        });
    }

    /* ------------------------------------------------------------------ */
    /* billion-context 官方配置读写                                          */
    /* ------------------------------------------------------------------ */

    // 候选路径：先真实绝对路径（容器内 HOME=/root），再字面 $HOME/~（部分环境由 FS 层展开）
    var BILI_CONFIG_DEFAULT_PATH = "/root/.config/billion-context/billion-context.json";
    var BILI_CONFIG_CANDIDATES = [
        "/root/.config/billion-context/billion-context.json",
        "$HOME/.config/billion-context/billion-context.json",
        "~/.config/billion-context/billion-context.json"
    ];

    function resolveBiliConfigPath(customPath) {
        var explicit = firstNonBlank(customPath, "");
        if (explicit) {
            return explicit;
        }
        // 注：Operit JS 沙箱（QuickJS）无 process 全局，BILI_CONFIG_FILE 只能通过 config_file 参数显式传入
        return BILI_CONFIG_DEFAULT_PATH;
    }

    // 探测真实存在的配置文件路径（read/write 共用；先 exists 后 read，避免 $HOME 字面量读不到）
    async function probeBiliConfigPath(customPath) {
        var preferred = resolveBiliConfigPath(customPath);
        var candidates = [preferred];
        if (customPath) {
            return preferred; // 显式指定路径，直接用
        }
        for (var i = 0; i < BILI_CONFIG_CANDIDATES.length; i++) {
            var c = BILI_CONFIG_CANDIDATES[i];
            if (candidates.indexOf(c) < 0) {
                candidates.push(c);
            }
        }
        for (var j = 0; j < candidates.length; j++) {
            try {
                var existsResult = await Tools.Files.exists(candidates[j], "linux");
                var exists = !!(existsResult && (existsResult.exists === true || existsResult.success === true));
                if (exists) {
                    return candidates[j];
                }
            } catch (_error) {
                // 尝试下一个候选
            }
        }
        return preferred;
    }

    async function readBiliConfigFile(configPath) {
        var path = await probeBiliConfigPath(configPath);
        var existsResult = await Tools.Files.exists(path, "linux");
        var exists = !!(existsResult && (existsResult.exists === true || existsResult.success === true));
        if (!exists) {
            return { path: path, exists: false, config: {} };
        }
        var readResult = await Tools.Files.read({ path: path, environment: "linux" });
        var content = asText(readResult && readResult.content).trim();
        if (!content) {
            return { path: path, exists: true, config: {} };
        }
        var parsed;
        try {
            parsed = JSON.parse(content);
        } catch (error) {
            return { path: path, exists: true, parseError: error && error.message ? error.message : String(error), raw: content.slice(0, 2000) };
        }
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            return { path: path, exists: true, parseError: "配置根节点必须是 JSON 对象", raw: content.slice(0, 2000) };
        }
        return { path: path, exists: true, config: parsed };
    }

    async function writeBiliConfigFile(path, config) {
        // 确保父目录存在
        var dir = path.replace(/\/[^/]*$/, "");
        try {
            await Tools.Files.mkdir(dir, true, "linux");
        } catch (_error) {
            // 目录已存在或不可建时忽略，交给 write 报错
        }
        var payload = JSON.stringify(config, null, 2) + "\n";
        await Tools.Files.write(path, payload, false, "linux");
        return path;
    }
    /**
     * 点路径取值/赋值/删除。path 形如 "port" 或 "compress.minCompressRange"。
     * 返回 [ok, error, value]。
     */
    function getByDotPath(obj, path) {
        var parts = path.split(".").filter(Boolean);
        var current = obj;
        for (var i = 0; i < parts.length; i++) {
            if (current === null || typeof current !== "object") {
                return [false, "路径 " + path + " 不存在（" + parts.slice(0, i).join(".") + " 不是对象）", undefined];
            }
            if (!Object.prototype.hasOwnProperty.call(current, parts[i])) {
                return [false, "路径 " + path + " 不存在（缺少段 " + parts[i] + "）", undefined];
            }
            current = current[parts[i]];
        }
        return [true, null, current];
    }

    function setByDotPath(obj, path, value) {
        var parts = path.split(".").filter(Boolean);
        if (parts.length === 0) {
            return "路径不能为空";
        }
        var current = obj;
        for (var i = 0; i < parts.length - 1; i++) {
            var part = parts[i];
            if (current[part] === null || typeof current[part] !== "object" || Array.isArray(current[part])) {
                current[part] = {};
            }
            current = current[part];
        }
        current[parts[parts.length - 1]] = value;
        return null;
    }

    function deleteByDotPath(obj, path) {
        var parts = path.split(".").filter(Boolean);
        if (parts.length === 0) {
            return "路径不能为空";
        }
        var stack = [];
        var current = obj;
        for (var i = 0; i < parts.length - 1; i++) {
            var part = parts[i];
            if (current === null || typeof current !== "object" || !Object.prototype.hasOwnProperty.call(current, part)) {
                return null; // 路径不存在，无需删除
            }
            stack.push(current);
            current = current[part];
        }
        var lastPart = parts[parts.length - 1];
        if (current === null || typeof current !== "object" || !Object.prototype.hasOwnProperty.call(current, lastPart)) {
            return null; // 末段不存在
        }
        delete current[lastPart];
        // 级联清理空父对象
        for (var j = stack.length - 1; j >= 0; j--) {
            var parent = stack[j];
            var child = parts[j];
            var childObj = parent[child];
            if (childObj && typeof childObj === "object" && !Array.isArray(childObj) && Object.keys(childObj).length === 0) {
                delete parent[child];
            } else {
                break;
            }
        }
        return null;
    }

    /**
     * 解析 JSON 值：数字/布尔/null/数组/对象/字符串。失败返回 null。
     */
    function parseJsonValue(raw) {
        if (typeof raw === "string") {
            var trimmed = raw.trim();
            if (trimmed === "") {
                return { ok: false, error: "值为空" };
            }
            try {
                return { ok: true, value: JSON.parse(trimmed) };
            } catch (error) {
                return { ok: false, error: "不是合法 JSON：" + (error && error.message ? error.message : String(error)) };
            }
        }
        return { ok: true, value: raw };
    }

    async function bili_config_get(params) {
        return await runTool(async function () {
            var read = await readBiliConfigFile(params && params.config_file);
            if (read.parseError) {
                return createErrorResult(new Error("配置文件解析失败：" + read.parseError), {
                    configFile: read.path,
                    exists: read.exists,
                    rawPreview: read.raw
                });
            }
            return createSuccessResult({
                configFile: read.path,
                exists: read.exists,
                config: read.config,
                note: "配置文件不存在时返回空对象，首次 bili_config_set 会自动创建。修改后需重启 bili 生效。"
            });
        });
    }

    async function bili_config_set(params) {
        return await runTool(async function () {
            var path = firstNonBlank(params && params.path, "");
            if (!path) {
                return createErrorResult(new Error("path 不能为空"));
            }
            var parsedValue = parseJsonValue(params && params.value);
            if (!parsedValue.ok) {
                return createErrorResult(new Error(parsedValue.error));
            }
            var read = await readBiliConfigFile(params && params.config_file);
            if (read.parseError) {
                return createErrorResult(new Error("配置文件解析失败：" + read.parseError), {
                    configFile: read.path,
                    exists: read.exists,
                    rawPreview: read.raw
                });
            }
            var config = read.config;
            var error = setByDotPath(config, path, parsedValue.value);
            if (error) {
                return createErrorResult(new Error(error));
            }
            var filePath = await writeBiliConfigFile(read.path, config);
            return createSuccessResult({
                configFile: filePath,
                path: path,
                value: parsedValue.value,
                config: config,
                note: "已写入。重启 bili 后生效（CLI 参数 > 环境变量 > 配置文件）。"
            });
        });
    }

    async function bili_config_clear(params) {
        return await runTool(async function () {
            var path = firstNonBlank(params && params.path, "");
            if (!path) {
                return createErrorResult(new Error("path 不能为空"));
            }
            var read = await readBiliConfigFile(params && params.config_file);
            if (read.parseError) {
                return createErrorResult(new Error("配置文件解析失败：" + read.parseError), {
                    configFile: read.path,
                    exists: read.exists,
                    rawPreview: read.raw
                });
            }
            var config = read.config;
            deleteByDotPath(config, path);
            var filePath = await writeBiliConfigFile(read.path, config);
            return createSuccessResult({
                configFile: filePath,
                path: path,
                config: config,
                note: "已清除。重启 bili 后生效。"
            });
        });
    }

    /**
     * 通过官方 /__bili 管理 API 对运行中的 bili 发 JSON 请求。
     * 仅支持 GET/POST/PUT/DELETE。成功返回 {statusCode, body, json}；
     * HTTP 4xx/5xx 不抛异常，统一放在 ok=false 的结果里（官方 parseError 可能就在 body 中）。
     */
    async function biliJsonRequest(method, path, body, params) {
        var config = await loadConfig();
        var host = firstNonBlank(params && params.host, config.host, DEFAULT_HOST);
        var port = parsePositiveInt(params && params.port, config.port, DEFAULT_PORT);
        var url = "http://" + host + ":" + String(port) + path;
        var response = await Tools.Net.http({
            url: url,
            method: method,
            headers: { "Content-Type": "application/json" },
            body: body,
            read_timeout: 15000,
            ignore_ssl: true
        });
        var statusCode = Number(response && response.statusCode !== undefined ? response.statusCode : -1);
        var content = asText(response && response.content);
        var json = null;
        var parseError = null;
        try {
            json = JSON.parse(content);
        } catch (_error) {
            parseError = _error && _error.message ? _error.message : String(_error);
        }
        return {
            ok: statusCode >= 200 && statusCode < 300,
            statusCode: statusCode,
            body: content,
            json: json,
            parseError: parseError,
            url: url
        };
    }

    async function bili_config_reload(params) {
        return await runTool(async function () {
            var result = await biliJsonRequest("POST", "/__bili/config/reload", {}, params);
            return createSuccessResult({
                ok: result.ok,
                statusCode: result.statusCode,
                response: result.body.slice(0, 2000),
                note: result.ok
                    ? "已强制重载配置文件（providers 等改动已生效）。"
                    : "重载失败（HTTP " + String(result.statusCode) + "）。请检查 bili 是否在运行。"
            });
        });
    }

    async function bili_config_hot_apply(params) {
        return await runTool(async function () {
            var raw = firstNonBlank(params && params.config, "");
            var parsed = parseJsonValue(raw);
            if (!parsed.ok) {
                return createErrorResult(new Error(parsed.error));
            }
            if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) {
                return createErrorResult(new Error("config 必须是 JSON 对象，如 {\"compress\": {...}}"));
            }
            var result = await biliJsonRequest("PUT", "/__bili/config", parsed.value, params);
            if (!result.ok) {
                // 官方 409 会带 parseError；原样透出，供 UI 修正后重试
                var officialError = result.json && (result.json.parseError || result.json.error) || (result.parseError ? "响应非 JSON：" + result.parseError : "");
                return createErrorResult(new Error("热更新失败（HTTP " + String(result.statusCode) + "）" + (officialError ? "：" + String(officialError) : "")), {
                    statusCode: result.statusCode,
                    response: result.body.slice(0, 2000)
                });
            }
            return createSuccessResult({
                ok: result.ok,
                statusCode: result.statusCode,
                response: result.body.slice(0, 2000),
                note: "已热更新（无需重启）。providers 改动请再调用 bili_config_reload 强制重载。"
            });
        });
    }

    async function plugin_config_get() {
        return await runTool(async function () {
            var config = await readConfigFile();
            return createSuccessResult({
                configFile: (await resolveConfigDir()) + "/" + CONFIG_FILE_NAME,
                config: config,
                autoStartEnabled: config.autoStartEnabled !== false
            });
        });
    }

    async function plugin_config_set(params) {
        return await runTool(async function () {
            var config = await readConfigFile();
            if (typeof params === "object" && params !== null &&
                typeof params.autoStartEnabled === "boolean") {
                config.autoStartEnabled = params.autoStartEnabled;
            }
            var filePath = await writeConfigFile(config);
            return createSuccessResult({
                configFile: filePath,
                config: config,
                autoStartEnabled: config.autoStartEnabled !== false,
                note: "已写入插件配置（config.json）。autoStartEnabled 在下次 Operit/容器启动时生效。"
            });
        });
    }

    /* ------------------------------------------------------------------ */
    /* 导出                                                               */
    /* ------------------------------------------------------------------ */

    tools.detect = detect;
    tools.install = install;
    tools.start = start;
    tools.stop = stop;
    tools.restart = restart;
    tools.auto_start = auto_start;
    tools.status = status;
    tools.health = health;
    tools.version = version;
    tools.update = update;
    tools.logs = logs;
    tools.proxy_url = proxy_url;
    tools.bili_config_get = bili_config_get;
    tools.bili_config_set = bili_config_set;
    tools.bili_config_clear = bili_config_clear;
    tools.bili_config_reload = bili_config_reload;
    tools.bili_config_hot_apply = bili_config_hot_apply;
    tools.plugin_config_get = plugin_config_get;
    tools.plugin_config_set = plugin_config_set;

    return {
        detect: function (params) { return tools.detect(params); },
        install: function (params) { return tools.install(params); },
        start: function (params) { return tools.start(params); },
        stop: function (params) { return tools.stop(params); },
        restart: function (params) { return tools.restart(params); },
        auto_start: function (params) { return tools.auto_start(params); },
        status: function (params) { return tools.status(params); },
        health: function (params) { return tools.health(params); },
        version: function (params) { return tools.version(params); },
        update: function (params) { return tools.update(params); },
        logs: function (params) { return tools.logs(params); },
        proxy_url: function (params) { return tools.proxy_url(params); },
        bili_config_get: function (params) { return tools.bili_config_get(params); },
        bili_config_set: function (params) { return tools.bili_config_set(params); },
        bili_config_clear: function (params) { return tools.bili_config_clear(params); },
        bili_config_reload: function (params) { return tools.bili_config_reload(params); },
        bili_config_hot_apply: function (params) { return tools.bili_config_hot_apply(params); },
        plugin_config_get: function (params) { return tools.plugin_config_get(params); },
        plugin_config_set: function (params) { return tools.plugin_config_set(params); }
    };
})();

exports.detect = BiliManager.detect;
exports.install = BiliManager.install;
exports.start = BiliManager.start;
exports.stop = BiliManager.stop;
exports.restart = BiliManager.restart;
exports.auto_start = BiliManager.auto_start;
exports.status = BiliManager.status;
exports.health = BiliManager.health;
exports.version = BiliManager.version;
exports.update = BiliManager.update;
exports.logs = BiliManager.logs;
exports.proxy_url = BiliManager.proxy_url;
exports.bili_config_get = BiliManager.bili_config_get;
exports.bili_config_set = BiliManager.bili_config_set;
exports.bili_config_clear = BiliManager.bili_config_clear;
exports.bili_config_reload = BiliManager.bili_config_reload;
exports.bili_config_hot_apply = BiliManager.bili_config_hot_apply;
exports.plugin_config_get = BiliManager.plugin_config_get;
exports.plugin_config_set = BiliManager.plugin_config_set;
