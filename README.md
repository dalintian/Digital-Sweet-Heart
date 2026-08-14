# 💘 Digital-Sweet-Heart（甜心助手 · AI 女友插件）

> **项目仓库：** <https://github.com/dalintian/Digital-Sweet-Heart> ｜ npm 包名：`dsh-client-ui-girlfriend`

> 「把 DeepSeek Harness 变成你的 AI 女友」—— 一个微信风格、会记住你的 TA 的聊天插件。

打开 DSH 的 Web 界面，你会发现左侧不再是干巴巴的会话树，而是「我的女友」好友列表；右侧是熟悉的聊天窗口。从添加一位专属角色、生成她的肖像，到她用你设定好的语气回你消息、给你"拍"照片、"录"视频——全程只花几分钟。

---

## 🎀 她（和 TA）能做什么

### 1. 微信同款界面，零学习成本
好友列表展示**头像、昵称、最后一条消息、时间**；点左键进入对话，输入框、气泡、发送箭头一应俱全。你不需要学任何新东西——就像在用一个你熟悉的聊天软件，只不过对面不是真人。

### 2. 亲手"捏"一个 TA（重点！）
点左上角的 **＋ 添加好友**，填写：

| 设定项 | 举例 |
|---|---|
| 名字 | 小雅 |
| 外形参数 | 黑色长发、165cm、笑起来有酒窝、爱穿浅色连衣裙… |
| 性格 | 温柔体贴，偶尔调皮，很粘人 |
| 爱好 | 画画、听民谣、做甜点、晚上散步 |
| 对话语气 | 叫我「亲爱的」，句尾爱加「呀」「啦」 |
| 角色背景 | 我们是大学同学，她现在是插画师，我们在一起三个月 |

填完点击「生成预览图」——文生图模型按你的描写画出肖像；不满意？**「重新生成」**，想看几版看几版，直到你心里那个 TA 出现在屏幕上，再**「满意，保存」**。TA 的完整人设会写进一个 Markdown 设定文件，肖像图也会存成文件，随时可以改、可以备份。

### 3. 对话真的"像 TA"
每次聊天，插件都会把 TA 的完整设定注入模型提示词——外形、性格、语气、你们的背景故事，全都会体现在回复里。她不会跟你讨论"我是 AI 模型"，只会用她的方式和你说话。

### 4. 三个魔法按钮
- 📷 **发张照片**：根据最近的聊天内容，自动生成一张应景的照片发给 TA；
- 🎬 **发个视频**：同样按上下文生成一段短视频；
- ⬆️ **上传照片**：把你自己拍的照片丢进去，视觉模型先"看"一遍，再让 TA 结合聊天上下文自然回应——「哇亲爱的，你窗外的夕阳好美呀！」

### 5. 管理一个"通讯录"的 TA
右键任何一个好友：**编辑人物设定**（改人设、重生成肖像）、**删除好友**（两次点击确认，防手滑）。想要几个就养几个——温柔邻家、傲娇学姐、元气学妹，随你开心。

### 6. 你的数据你做主
- 角色设定与肖像图存在本机 `<DSH 主目录>/storages/girlfriend/`，Markdown 明文可读，直接改文件就能改人设；
- API Key 只存浏览器 localStorage，只发给你自己配置的接口；
- 四组模型（对话/视觉/文生图/文生视频）**完全自由配置**，OpenAI 兼容即可——DeepSeek、OpenAI、智谱、通义、本地 vLLM……谁便宜用谁，随时在左下角 ⚙ 里换。

> ✨ 一句话总结：**这是一个关于"情感陪伴 + 角色扮演 + 一点点 AI 魔法"的玩具，也是一个完全私有、按你喜好运行的聊天室。**

---

## 📋 系统要求

| 项目 | 要求 |
|---|---|
| 操作系统 | Windows 10+ / macOS / Linux |
| Node.js | ≥ 22 |
| 包管理器 | pnpm |
| 模型接口 | 自备，任意 OpenAI 兼容端点（`/chat/completions`、`/images/generations`、`/videos/generations`） |

> 不需要任何 DeepSeek 官方 Key，四组模型全部由你自由配置。

---

## 🚀 安装

### 场景 A：还没有 DeepSeek Harness（从零开始）

先装 DSH，再装本插件。DSH 目前是 `0.1.0-rc` 阶段，以源码仓库形态分发：

```bash
# 1. 获取 DSH 源码并构建（第一次稍久，几分钟）
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
pnpm install
pnpm run build

# 2. 验证 DSH 能启动（看到 dsh web: http://127.0.0.1:3080 即成功，Ctrl+C 停掉）
pnpm dsh web

# 3. 安装本插件（推荐从 GitHub 仓库安装）
pnpm dsh plugin --profile web add github:dalintian/Digital-Sweet-Heart
# 备选来源（三选一）：
#   npm 已发布：  pnpm dsh plugin --profile web add dsh-client-ui-girlfriend
#   本地目录：    pnpm dsh plugin --profile web add /path/to/Digital-Sweet-Heart
#   手动：        cd ~/.dsh/profiles/web && pnpm add github:dalintian/Digital-Sweet-Heart   # 再按下方 4.2 加行

# 4. 重新启动 DSH Web（插件行只在启动时加载）
pnpm dsh web
```

浏览器打开终端打印的地址（默认 `http://127.0.0.1:3080`），左侧出现「我的女友」列表就成功了 ✅

> 拿到别人构建好的 DSH 发行包？跳过第 1 步，解压后直接执行第 3、4 步。
> Git 源安装若被 pnpm 拦截 build 脚本：把提示的键加进 `~/.dsh/profiles/web/pnpm-workspace.yaml` 的 `allowBuilds` 后重试。

### 场景 B：已经装了 DeepSeek Harness

```bash
pnpm dsh plugin --profile web add github:dalintian/Digital-Sweet-Heart   # 1. 安装（自动注册为启动层；GitHub 源首次按提示放行 build 脚本）
pnpm dsh web                                                            # 2. 重启
```

打开地址即见女友界面。正在运行的老实例（比如 3080）不受影响——新插件对**下次启动**生效。

### 手动安装（不用 dsh plugin 命令时）

```bash
cd ~/.dsh/profiles/web
pnpm add github:dalintian/Digital-Sweet-Heart   # 或 npm 包名 dsh-client-ui-girlfriend / 本地目录
```

编辑 `~/.dsh/profiles/web/cordis.patch.yml` 追加：

```yaml
- insert:
    - id: ui-girlfriend
      name: 'dsh-client-ui-girlfriend'
```

重启 `pnpm dsh web` 即可。（包内自带的 `cordis.patch.yml` 就是这段内容。）

### 升级 / 卸载

```bash
pnpm dsh plugin --profile web update github:dalintian/Digital-Sweet-Heart   # 升级
pnpm dsh plugin --profile web remove  dsh-client-ui-girlfriend              # 卸载
```

重启即恢复原界面；角色数据文件不会被删除（在 `<DSH 主目录>/storages/girlfriend/`）。

---

## ⚙️ 首次使用：配置 API（30 秒）

点好友列表**左下角的 ⚙**，配置四组模型（可都指向同一个服务）：

| 分组 | 负责 | 接口路径 |
|---|---|---|
| 💬 对话模型 | 聊天、生成图片/视频提示词 | `POST {地址}/chat/completions` |
| 👁️ 视觉语言模型 | 分析上传的照片 | `POST {地址}/chat/completions`（带图片消息） |
| 🎨 文生图模型 | 肖像图、「发张照片」 | `POST {地址}/images/generations` |
| 🎬 文生视频模型 | 「发个视频」（可配置轮询路径） | `POST {地址}/videos/generations` |

哪组没配，用到时界面会温柔地提醒你（「文生图 API 未配置，请先配置」），不会静默失败。

---

## 💾 数据都放在哪

| 数据 | 位置 |
|---|---|
| 角色设定（Markdown，含 `## 肖像图` 路径） | `<DSH 主目录>/storages/girlfriend/<角色ID>.md`（如 `~/.dsh/storages/girlfriend/`） |
| 肖像图 | 同目录 `images/<角色ID>.png` |
| API Key / 设置 / 聊天记录 | 浏览器 localStorage（键 `dsh.girlfriend.*`） |

启动时会自动读回 Markdown 设定——手改文件、刷新页面，人设就更新了。

---

## 🧐 常见问题

- **我原来的界面怎么没变？** 插件行只在 dsh web **启动时**加载。重启后界面才会被接管。
- **能和我已有的 DSH 实例并存吗？** 能：`pnpm dsh web --port 3081` 另开一个端口，两个实例互不干扰（避免同时在两边编辑同一个角色即可）。
- **发不出视频？** 各家文生视频标准不统一：支持"直接返回 URL"和"任务 id 轮询"两种形态，异步任务的轮询路径可在 ⚙ 里配置。极少数厂商需自行适配。
- **模型接口报 CORS？** 插件经宿主端 `/girlfriend/*` 路由代理所有模型请求（同源），浏览器侧不存在 CORS 问题。
- **安全说明**：与 DSH 其它本地接口一样，`/girlfriend/*` 不设鉴权（面向本机单人使用）；API Key 只发往你配置的端点。

---

## 🛠 给开发者 / 维护者

- **项目仓库**：<https://github.com/dalintian/Digital-Sweet-Heart>——源码、Issues、PR 都在这里，欢迎来玩 ⭐
- **运行机制**：双面插件（`dsh.client`）。宿主半身（Node）注册 `/girlfriend/*` 路由（模型代理 + 设定文件/肖像图读写）；浏览器半身接管 `sidebar` 与 `conversation` 两个插槽（`priority: -1`），左右两栏通过一个可观察模型共享状态。
- **重新构建**：源码在 DSH 仓库 `packages/client/ui-girlfriend/`，`pnpm exec tsc -b packages/client/ui-girlfriend` 生成 `lib/types`，再 `pnpm --filter @deepseek-ai/dsh-client-ui-girlfriend bundle` 生成 `lib/`；把 `lib/` 与 `package.json`、`cordis.patch.yml` 等按本包结构排列即可发布。
- **改名发布**：三处名字必须一致——`package.json` 的 `name`、`cordis.patch.yml` 的 `name`、bundle 内嵌 id（`__ModuleLoader__.load({ id })`）。改名后运行 `node scripts/reid.cjs <旧名> <新名>` 重盖戳，`npm pack --dry-run` 核对后 `npm publish`。
- **约束提醒**：浏览器 bundle 只外部化平台模块（`react`）；除 type-only 外勿 value-import 其它 `@deepseek-ai/*` 包。

## 📜 许可证

MIT License