#!/bin/bash
# billion-context-operit 打包脚本
set -e
cd "$(dirname "$0")/.."

VERSION=$(node -e "console.log(JSON.parse(require('fs').readFileSync('manifest.json','utf8')).version)")
PKG_ID=$(node -e "console.log(JSON.parse(require('fs').readFileSync('manifest.json','utf8')).toolpkg_id)")

# 语法与 JSON 校验
node --check src/main.js
node --check src/packages/bili_manager.js
node --check src/ui/bili_console/index.ui.js
node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8')); console.log('manifest OK')"

# METADATA 工具数 == exports 工具数 一致性自查（新增工具必须同步 METADATA，否则静默不注册）
node -e "
const src = require('fs').readFileSync('src/packages/bili_manager.js','utf8');
const meta = JSON.parse(src.match(/\/\* METADATA\s*([\s\S]*?)\*\//)[1]);
const toolNames = meta.tools.map(t => t.name);
const exportsNames = src.match(/^exports\.(\w+)/gm).map(l => l.split('.')[1].split('=')[0].trim());
const missing = toolNames.filter(n => !exportsNames.includes(n));
const extra = exportsNames.filter(n => !toolNames.includes(n));
if (missing.length || extra.length) {
  console.error('工具注册不一致! missing=' + missing + ' extra=' + extra);
  process.exit(1);
}
console.log('✓ 工具注册一致性 OK (' + toolNames.length + '/' + exportsNames.length + ')');
"

rm -rf dist
mkdir -p dist
zip -rq "dist/${PKG_ID}-v${VERSION}.toolpkg" manifest.json src -x '*.git*'
unzip -l "dist/${PKG_ID}-v${VERSION}.toolpkg" | grep -E 'manifest.json|src/main.js|src/packages/bili_manager|src/ui/bili_console'
echo "== 产物: dist/${PKG_ID}-v${VERSION}.toolpkg =="
