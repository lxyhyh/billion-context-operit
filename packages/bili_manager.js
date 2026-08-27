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
                { "name": "wait_seconds", "description": { "zh": "健康轮询最长等待秒数，默认 45", "en": "Max health poll seconds, default 45" }, "type": "number", "required": false }
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
    var PACKAGE_VERSION = "0.1.0";

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
            port: parsePositiveInt(config.port, DEFAULT_PORT)
        };
    }

    async function saveConfig(host, port) {
        var config = await readConfigFile();
        config.host = firstNonBlank(host, config.host, DEFAULT_HOST);
        config.port = parsePositiveInt(port, config.port, DEFAULT_PORT);
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
            var launchCommand = [
                "nohup setsid bili --host " + shellQuote(host) + " --port " + String(port),
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
    /* 导出                                                               */
    /* ------------------------------------------------------------------ */

    tools.detect = detect;
    tools.install = install;
    tools.start = start;
    tools.stop = stop;
    tools.restart = restart;
    tools.status = status;
    tools.health = health;
    tools.version = version;
    tools.update = update;
    tools.logs = logs;
    tools.proxy_url = proxy_url;

    return {
        detect: function (params) { return tools.detect(params); },
        install: function (params) { return tools.install(params); },
        start: function (params) { return tools.start(params); },
        stop: function (params) { return tools.stop(params); },
        restart: function (params) { return tools.restart(params); },
        status: function (params) { return tools.status(params); },
        health: function (params) { return tools.health(params); },
        version: function (params) { return tools.version(params); },
        update: function (params) { return tools.update(params); },
        logs: function (params) { return tools.logs(params); },
        proxy_url: function (params) { return tools.proxy_url(params); }
    };
})();

exports.detect = BiliManager.detect;
exports.install = BiliManager.install;
exports.start = BiliManager.start;
exports.stop = BiliManager.stop;
exports.restart = BiliManager.restart;
exports.status = BiliManager.status;
exports.health = BiliManager.health;
exports.version = BiliManager.version;
exports.update = BiliManager.update;
exports.logs = BiliManager.logs;
exports.proxy_url = BiliManager.proxy_url;
