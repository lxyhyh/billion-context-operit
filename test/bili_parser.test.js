/**
 * bili_parser 单元测试（node test/bili_parser.test.js 直接运行，不参与打包）
 */
"use strict";
const assert = require("assert");
const p = require("../src/packages/bili_parser.js");

let passed = 0;
function check(name, fn) {
    try {
        fn();
        passed++;
        console.log("  ✓ " + name);
    } catch (e) {
        console.error("  ✗ " + name + ": " + e.message);
        process.exitCode = 1;
    }
}

// asText
check("asText 常规/空/数字", () => {
    assert.strictEqual(p.asText("abc"), "abc");
    assert.strictEqual(p.asText(null), "");
    assert.strictEqual(p.asText(undefined), "");
    assert.strictEqual(p.asText(0), "0");
});

// firstNonBlank
check("firstNonBlank", () => {
    assert.strictEqual(p.firstNonBlank("", "  ", "abc"), "abc");
    assert.strictEqual(p.firstNonBlank("", ""), "");
});

// parsePositiveInt
check("parsePositiveInt", () => {
    assert.strictEqual(p.parsePositiveInt("8787", 1), 8787);
    assert.strictEqual(p.parsePositiveInt("", 1), 1);
    assert.strictEqual(p.parsePositiveInt("-5", 1), 1);
    assert.strictEqual(p.parsePositiveInt("8.9", 1), 8);
});

// toLines
check("toLines", () => {
    assert.deepStrictEqual(p.toLines("a\nb\r\n  c  \n\n"), ["a", "b", "c"]);
});

// extractVersion / extractPath
check("extractVersion 前缀剥除", () => {
    assert.strictEqual(p.extractVersion(["v24.19.0", "/usr/bin/node"], "v"), "24.19.0");
    assert.strictEqual(p.extractVersion(["/usr/bin/bili", "0.1.83"], ""), "0.1.83");
});
check("extractPath", () => {
    assert.strictEqual(p.extractPath(["v24.19.0", "/usr/bin/node"], "node"), "/usr/bin/node");
    assert.strictEqual(p.extractPath(["warn"], "x"), "");
});

// parseVersionPath
check("parseVersionPath 标准输出", () => {
    const r = p.parseVersionPath("v24.19.0\n/usr/bin/node", "node");
    assert.deepStrictEqual(r, { version: "24.19.0", path: "/usr/bin/node" });
});
check("parseVersionPath bili 路径在版本前", () => {
    const r = p.parseVersionPath("/usr/bin/bili\n0.1.83", "bili");
    assert.deepStrictEqual(r, { version: "0.1.83", path: "/usr/bin/bili" });
});
check("parseVersionPath 单行无斜杠 → version 兜底", () => {
    const r = p.parseVersionPath("0.1.83", "bili");
    assert.deepStrictEqual(r, { version: "0.1.83", path: "" });
});
check("parseVersionPath 空", () => {
    assert.deepStrictEqual(p.parseVersionPath("", "bili"), { version: "", path: "" });
});

// getByDotPath
check("getByDotPath", () => {
    const cfg = { compress: { modelContextLimit: 200000 } };
    assert.deepStrictEqual(p.getByDotPath(cfg, "compress.modelContextLimit"), { ok: true, value: 200000 });
    assert.deepStrictEqual(p.getByDotPath(cfg, "compress.nope"), { ok: false, value: undefined });
    assert.deepStrictEqual(p.getByDotPath(cfg, "nope.x"), { ok: false, value: undefined });
});

// setByDotPath
check("setByDotPath 建父对象", () => {
    const cfg = {};
    assert.strictEqual(p.setByDotPath(cfg, "a.b.c", 1), null);
    assert.strictEqual(cfg.a.b.c, 1);
    assert.strictEqual(p.setByDotPath(cfg, "", 1), "路径不能为空");
});

// deleteByDotPath
check("deleteByDotPath 级联清理", () => {
    const cfg = { compress: { minCompressRange: 5 } };
    assert.strictEqual(p.deleteByDotPath(cfg, "compress.minCompressRange"), null);
    assert.deepStrictEqual(cfg, {});
});
check("deleteByDotPath 不存在安全", () => {
    const cfg = { a: 1 };
    assert.strictEqual(p.deleteByDotPath(cfg, "x.y"), null);
    assert.deepStrictEqual(cfg, { a: 1 });
});

// parseJsonValue
check("parseJsonValue", () => {
    assert.deepStrictEqual(p.parseJsonValue('"200000"'), { ok: true, value: "200000" });
    assert.deepStrictEqual(p.parseJsonValue("200000"), { ok: true, value: 200000 });
    assert.deepStrictEqual(p.parseJsonValue(""), { ok: false, error: "值为空" });
    assert.strictEqual(p.parseJsonValue("{bad").ok, false);
    assert.deepStrictEqual(p.parseJsonValue(true), { ok: true, value: true });
});

// compareVersions
check("compareVersions", () => {
    assert.strictEqual(p.compareVersions("0.3.8", "0.3.7"), 1);
    assert.strictEqual(p.compareVersions("0.3.8", "0.3.8"), 0);
    assert.strictEqual(p.compareVersions("v0.3.7", "0.3.8"), -1);
});

console.log("\n通过 " + passed + " 项");
if (process.exitCode) {
    console.error("存在失败用例");
} else {
    console.log("全部通过");
}