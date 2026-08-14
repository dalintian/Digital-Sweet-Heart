#!/usr/bin/env node
/**
 * 重新盖戳 bundle 里的插件 id。
 *
 * dsh 的浏览器端 bundle 会把「插件 id（= 包名）」硬编码进
 * `window.__ModuleLoader__.load({ id: "<包名>", ... })` 以及注入的样式标签
 * data-plugin 属性中。装载器按启动清单里的包名去模块表取模块，因此
 * 产物里的 id 必须与发布名一致。
 *
 * 用途：以新名字发布（例如发布到自己的 npm scope 或换了仓库名）时，改完
 * package.json 的 name 与 cordis.patch.yml 里的 name 后，再跑一次本脚本
 * 重新盖戳构建产物，避免在完整 DSH 环境中重新构建。
 *
 * 用法：
 *   node scripts/reid.cjs <旧id> <新id>
 *   例：node scripts/reid.cjs @deepseek-ai/dsh-client-ui-girlfriend dsh-client-ui-girlfriend
 */
const fs = require('node:fs')
const path = require('node:path')

const [, , oldId, newId] = process.argv
if (!oldId || !newId) {
  console.error('usage: node scripts/reid.cjs <old> <new>')
  process.exit(1)
}

const targets = ['lib/client.js', 'lib/client.js.map', 'lib/index.js', 'lib/invariant.js']
let patched = 0
for (const file of targets) {
  const p = path.join(__dirname, '..', file)
  if (!fs.existsSync(p)) continue
  const src = fs.readFileSync(p, 'utf8')
  if (!src.includes(oldId)) continue
  fs.writeFileSync(p, src.split(oldId).join(newId), 'utf8')
  console.log(`re-stamped ${file}`)
  patched += 1
}
if (patched === 0) {
  console.warn(`no occurrence of ${JSON.stringify(oldId)} found — already stamped?`)
} else {
  console.log(`done: ${oldId} -> ${newId}`)
}