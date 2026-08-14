#!/usr/bin/env node
/**
 * dsh-client-ui-girlfriend 安装后置脚本（postinstall）
 *
 * 安装即生成两套启动配置，无需任何手写配置：
 *   - 原生界面：pnpm dsh web               → http://127.0.0.1:3080
 *   - 女友界面：pnpm dsh --profile girlfriend → http://127.0.0.1:3081
 *
 * 做法：
 *   1) 在 <DSH主目录>/profiles/girlfriend 生成一个只需 4 个文件的 profile：
 *      —— 与 web profile 使用同一套 bundle（dsh-base + dsh-web-app + 本插件）；
 *      —— 其 cordis.patch.yml 把本插件的行重新启用（web 层默认是禁用，保证
 *         `pnpm dsh web` 永远是原生界面），并把 webServer 默认端口改为 3081；
 *   2) 在 girl-friend profile 的 node_modules 里建立一个指向本包安装目录的
 *      目录链接（Windows junction / POSIX symlink），让女友 profile 启动时直接
 *      解析到本包（无需二次安装，也不会在 postinstall 里递归调用 pnpm）。
 *
 * 幂等：重复安装/升级时覆盖生成并修复链接，不会破坏已有数据。
 * 失败说明：DSH 主目录不可写等异常只打印警告，不影响 npm/pnpm 安装本身。
 */

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const PKG_NAME = 'dsh-client-ui-girlfriend'

function dshHome() {
  const env = process.env.DSH_HOME
  if (env !== undefined && env.trim() !== '') return path.resolve(env.trim())
  return path.join(os.homedir(), '.dsh')
}

function safeWrite(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content, 'utf8')
}

function ensureLink(linkPath, target) {
  try {
    const stat = fs.lstatSync(linkPath)
    if (stat.isSymbolicLink() || stat.isDirectory()) {
      const resolved = fs.realpathSync(linkPath)
      if (resolved === fs.realpathSync(target)) return
      fs.rmSync(linkPath, { recursive: true, force: true })
    }
  } catch {
    // not present — create below
  }
  const type = process.platform === 'win32' ? 'junction' : 'dir'
  try {
    fs.symlinkSync(target, linkPath, type)
  } catch (error) {
    if (fs.existsSync(linkPath)) return // created concurrently
    throw error
  }
}

function main() {
  const home = dshHome()
  const profileDir = path.join(home, 'profiles', 'girlfriend')
  const nodeModules = path.join(profileDir, 'node_modules')
  const selfDir = path.resolve(__dirname, '..') // 本包安装目录（含 lib/、cordis.patch.yml）

  safeWrite(path.join(profileDir, 'package.json'), `${JSON.stringify({
    name: 'dsh-profile-girlfriend',
    private: true,
    dependencies: {},
    dsh: {
      profile: {
        bundles: [
          '@deepseek-ai/dsh-base',
          '@deepseek-ai/dsh-web-app',
          PKG_NAME,
        ],
      },
    },
  }, null, 2)}\n`)

  safeWrite(path.join(profileDir, 'cordis.yml'), `# dsh profile root — an empty entry list. Edit cordis.patch.yml, not this file.\n[]\n`)

  safeWrite(path.join(profileDir, 'cordis.patch.yml'), `# AI 女友助手 profile：与 web profile 使用同一套 bundle，只做两处覆盖
# 1) 启用本插件行（web 层默认禁用，保证 pnpm dsh web 永远是原生界面）；
# 2) webServer 默认端口改为 3081，与原生实例（3080）并存不冲突。

- id: ui-girlfriend
  disabled: false

- id: webserver
  config:
    host: !!js ctx.webStartup.host ?? '127.0.0.1'
    port: !!js ctx.webStartup.port ?? 3081
`)

  safeWrite(path.join(profileDir, 'pnpm-workspace.yaml'), `packages:
  - .

nodeLinker: hoisted
autoInstallPeers: false
`)

  fs.mkdirSync(nodeModules, { recursive: true })
  ensureLink(path.join(nodeModules, PKG_NAME), selfDir)

  console.log('')
  console.log('  💘 dsh-client-ui-girlfriend 安装完成：已生成两套启动配置。')
  console.log(`     配置目录：${profileDir}`)
  console.log('  打开方式（两条命令，随时切换，无需再改任何设置）：')
  console.log('    pnpm dsh web                     # 原生 DeepSeek Harness 界面 → http://127.0.0.1:3080')
  console.log('    pnpm dsh --profile girlfriend    # AI 女友界面               → http://127.0.0.1:3081')
  console.log('')
}

try {
  main()
} catch (error) {
  console.warn(`[dsh-client-ui-girlfriend] 未能自动生成 girlfriend 配置（不影响本次安装）：${error instanceof Error ? error.message : String(error)}`)
  console.warn('如需手动启用女友界面：安装后进入 `~/.dsh/profiles/web/cordis.patch.yml` 把插件行改为 `disabled: false` 并重启。')
}