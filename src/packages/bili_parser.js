/**
 * bili_parser — billion-context-operit 纯函数工具集（无副作用、无 Tools 依赖）
 *
 * 从 bili_manager.js 拆出的可复用纯逻辑：文本/数值规整、版本与路径解析、
 * 点路径取值/赋值/删除、JSON 值解析。所有函数无外部依赖，便于单测。
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

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

/** 多行文本 → 去空行数组 */
function toLines(text) {
    return asText(text).split(/\r?\n/).map(function (line) { return line.trim(); }).filter(Boolean);
}

/**
 * 从命令输出行中提取版本号。prefix 非空时优先匹配前缀开头的行（去掉前缀返回）；
 * 否则返回第一个形如 v1.2.3 的版本（保留原样，不剥 v）。
 */
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

/** 从输出行中提取二进制路径（行内含 binaryName 且含 /，或行首为 /） */
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

/**
 * 从命令输出文本解析版本 + 路径。返回 {version, path}：
 * version 剥掉前导 v（与各工具返回的 biliVersion 约定一致）；
 * path 为第一个含 / 的行（binaryName 命中优先）。
 */
function parseVersionPath(text, binaryName) {
    var lines = toLines(text);
    var version = "";
    var path = "";
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (!version && /^v?\d+\.\d+\.\d+/.test(line)) {
            version = line.replace(/^v/i, "");
        } else if (!path && line.indexOf("/") >= 0 && (!binaryName || line.indexOf(binaryName) >= 0)) {
            path = line;
        }
    }
    if (!version && !path && lines.length === 1 && lines[0].indexOf("/") < 0) {
        version = lines[0];
    }
    return { version: version, path: path };
}

/** 点路径取值。返回 {ok, value} */
function getByDotPath(obj, path) {
    var parts = path.split(".").filter(Boolean);
    var current = obj;
    for (var i = 0; i < parts.length; i++) {
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

/** 点路径赋值。返回错误串或 null */
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

/** 点路径删除（父对象为空时级联清理）。返回错误串或 null */
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

/** 解析 JSON 值：数字/布尔/null/数组/对象/字符串。失败返回 {ok:false,error} */
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

/** 语义化版本比较：a>b 返回 1，a<b 返回 -1，相等返回 0（仅比较 x.y.z 三段） */
function compareVersions(a, b) {
    function parts(v) {
        var out = [];
        var raw = asText(v).replace(/^v/i, "").trim().split(".");
        for (var i = 0; i < 3; i++) {
            var n = parseInt(raw[i], 10);
            out.push(Number.isFinite(n) ? n : 0);
        }
        return out;
    }
    var pa = parts(a);
    var pb = parts(b);
    for (var i = 0; i < 3; i++) {
        if (pa[i] !== pb[i]) {
            return pa[i] > pb[i] ? 1 : -1;
        }
    }
    return 0;
}

exports.asText = asText;
exports.firstNonBlank = firstNonBlank;
exports.parsePositiveInt = parsePositiveInt;
exports.toLines = toLines;
exports.extractVersion = extractVersion;
exports.extractPath = extractPath;
exports.parseVersionPath = parseVersionPath;
exports.getByDotPath = getByDotPath;
exports.setByDotPath = setByDotPath;
exports.deleteByDotPath = deleteByDotPath;
exports.parseJsonValue = parseJsonValue;
exports.compareVersions = compareVersions;
