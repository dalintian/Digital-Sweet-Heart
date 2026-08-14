/**
 * The companion app's single business model (browser half). One instance is
 * created inside the plugin's apply closure and shared by every registered
 * entry through the inject `hooks` compartment — components subscribe via the
 * `useModel` selector hook and write exclusively through these actions.
 *
 * Persistence: provider settings, character list, and chat history live in
 * localStorage (browser-local); the character persona fields and portraits
 * are additionally recorded as Markdown files on the host (via `/girlfriend`
 * routes) and re-hydrated on boot when files exist.
 */
import { avatarRelPath, parseCharacter, parseCharacterId, serializeCharacter } from "./markdown.js";
import * as api from "./host-api.js";
import { buildPersonaPrompt, emptySettings, newMessage, profileConfigured, } from "./types.js";
const LS_SETTINGS = 'dsh.girlfriend.settings.v1';
const LS_CHARACTERS = 'dsh.girlfriend.characters.v1';
const LS_MESSAGES = 'dsh.girlfriend.messages.v1';
const MAX_MESSAGES = 200;
function readJson(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
    }
    catch {
        return fallback;
    }
}
function writeJson(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    }
    catch {
        // localStorage full or unavailable: the app keeps working in-memory.
    }
}
/** Tail of recent messages as chat-completion payloads (text only). */
function recentTextMessages(messages, limit) {
    const picked = [];
    for (let i = messages.length - 1; i >= 0 && picked.length < limit; i -= 1) {
        const message = messages[i];
        if (message === undefined)
            continue;
        if (message.kind === 'image')
            picked.push({ role: 'assistant', content: `[图片] ${message.content}` });
        else if (message.kind === 'video')
            picked.push({ role: 'assistant', content: `[视频] ${message.content}` });
        else if (message.kind === 'photo') {
            picked.push({ role: 'user', content: `[我发来一张照片] ${message.content}${message.analysis !== undefined ? ` 照片内容：${message.analysis}` : ''}` });
        }
        else {
            picked.push({ role: message.role === 'user' ? 'user' : 'assistant', content: message.content });
        }
    }
    return picked.reverse();
}
/** Build an image/video prompt for the selected character from recent context. */
async function deriveMediaPrompt(character, messages, kind, settings, callChat) {
    const context = recentTextMessages(messages, 4);
    const lastUser = [...context].reverse().find(m => m.role === 'user')?.content ?? '';
    const fallback = kind === 'image'
        ? `给「${character.name}」拍一张生活照。人物设定：${character.appearance}，${character.personality}。画面氛围围绕：${lastUser.slice(0, 120) || character.background.slice(0, 120) || '温馨日常'}。写实摄影风格，自然光线，高质量。`
        : `为「${character.name}」生成一段 5 秒生活短视频。人物设定：${character.appearance}，${character.personality}。画面内容围绕：${lastUser.slice(0, 120) || character.background.slice(0, 120) || '温馨日常'}。真实人物动作，自然运镜，高清。`;
    if (!profileConfigured(settings.chat))
        return fallback;
    const system = kind === 'image'
        ? '你是短视频/照片画面的提示词专家。根据对话上下文，用中文写一段用于生成一张照片的提示词(50 字以内，描写画面内容与氛围)，只输出提示词本身。'
        : '你是短视频/照片画面的提示词专家。根据对话上下文，用中文写一段用于生成一段短视频的提示词(80 字以内，描写人物动作与运镜)，只输出提示词本身。';
    try {
        const reply = await callChat({
            baseUrl: settings.chat.baseUrl,
            apiKey: settings.chat.apiKey,
            model: settings.chat.model,
            messages: [
                { role: 'system', content: system },
                ...context.slice(-4).map(m => ({ role: m.role, content: m.content })),
            ],
            temperature: 0.7,
        });
        const trimmed = reply.trim();
        return trimmed.length > 0 ? trimmed : fallback;
    }
    catch {
        return fallback;
    }
}
function mediaPreview(message) {
    if (message.kind === 'image')
        return '[图片] 刚刚生成了一张照片';
    if (message.kind === 'video')
        return '[视频] 刚刚生成了一段视频';
    if (message.kind === 'photo')
        return '[照片] 我发来一张照片';
    return message.content;
}
/** The observable app model (HostObservable<AppState> + actions). */
export class GirlfriendModel {
    state;
    snapshot;
    listeners = new Set();
    constructor() {
        const settings = readJson(LS_SETTINGS, emptySettings());
        const cached = readJson(LS_CHARACTERS, []);
        const messages = readJson(LS_MESSAGES, {});
        const characters = cached.map(c => ({ ...c }));
        this.state = {
            settings,
            characters,
            messages,
            view: { kind: 'chat', characterId: '' },
            toasts: [],
            busy: {},
        };
        this.snapshot = this.state;
        void this.hydrateFromFiles();
    }
    // ---- HostObservable contract (fed to the renderer's hooks compartment) ----
    getSnapshot() {
        return this.snapshot;
    }
    subscribe(fn) {
        this.listeners.add(fn);
        return () => { this.listeners.delete(fn); };
    }
    // ---- internals ----
    /** Publish a state change to subscribers. Durability is explicit: callers
     * that change persona/messages/settings follow up with {@link persist}. */
    commit(patch) {
        this.state = { ...this.state, ...patch };
        this.snapshot = this.state;
        for (const listener of this.listeners)
            listener();
    }
    persist() {
        writeJson(LS_SETTINGS, this.state.settings);
        const cached = this.state.characters.map(c => ({
            id: c.id, name: c.name, appearance: c.appearance, personality: c.personality,
            hobbies: c.hobbies, tone: c.tone, background: c.background, note: c.note,
            createdAt: c.createdAt, updatedAt: c.updatedAt,
            lastMessage: c.lastMessage,
            ...(c.avatarPath !== undefined ? { avatarPath: c.avatarPath } : {}),
            ...(c.lastTime !== undefined ? { lastTime: c.lastTime } : {}),
        }));
        writeJson(LS_CHARACTERS, cached);
        writeJson(LS_MESSAGES, this.state.messages);
    }
    toast(text, kind = 'warn') {
        const item = { id: crypto.randomUUID(), text, kind };
        this.commit({ toasts: [...this.state.toasts, item] });
    }
    appendMessage(characterId, message) {
        const next = [...(this.state.messages[characterId] ?? []), message].slice(-MAX_MESSAGES);
        const messages = { ...this.state.messages, [characterId]: next };
        this.commit({
            messages,
            characters: this.state.characters.map(c => (c.id === characterId
                ? { ...c, lastMessage: mediaPreview(message), lastTime: message.time }
                : c)),
        });
        this.persist();
    }
    chatSettingsPresent() {
        return profileConfigured(this.state.settings.chat);
    }
    chooseRecentForPrompt(characterId) {
        const all = this.state.messages[characterId] ?? [];
        return all.slice(-6);
    }
    // ---- view navigation ----
    openChat(characterId) {
        if (this.state.characters.some(c => c.id === characterId)) {
            this.commit({ view: { kind: 'chat', characterId } });
        }
    }
    openSettings() {
        this.commit({ view: { kind: 'settings' } });
    }
    openCreate() {
        this.commit({ view: { kind: 'create' } });
    }
    openEdit(characterId) {
        if (this.state.characters.some(c => c.id === characterId)) {
            this.commit({ view: { kind: 'edit', characterId } });
        }
    }
    /** Return to the most recently opened chat, or the empty hero. */
    goBack() {
        this.commit({ view: { kind: 'chat', characterId: this.state.characters[0]?.id ?? '' } });
    }
    saveSettings(settings) {
        this.commit({ settings });
        this.persist();
        this.toast('设置已保存', 'info');
    }
    dismissToast(id) {
        this.commit({ toasts: this.state.toasts.filter(t => t.id !== id) });
    }
    // ---- chat ----
    async sendChat(characterId, text) {
        const character = this.state.characters.find(c => c.id === characterId);
        const trimmed = text.trim();
        if (character === undefined || trimmed === '')
            return;
        if (this.state.busy.chat === true)
            return;
        if (!this.chatSettingsPresent()) {
            this.toast('对话模型 API 未配置，请先点击左下角「设置」配置后再聊天');
            return;
        }
        this.appendMessage(characterId, newMessage('user', 'text', trimmed));
        this.commit({ busy: { ...this.state.busy, chat: true } });
        try {
            const history = this.chooseRecentForPrompt(characterId);
            const reply = await api.chatCall({
                baseUrl: this.state.settings.chat.baseUrl,
                apiKey: this.state.settings.chat.apiKey,
                model: this.state.settings.chat.model,
                messages: [
                    { role: 'system', content: buildPersonaPrompt(this.state.characters.find(c => c.id === characterId) ?? character) },
                    ...recentTextMessages(history, 12).map(m => ({ role: m.role, content: m.content })),
                ],
                temperature: 0.8,
            });
            this.appendMessage(characterId, newMessage('girlfriend', 'text', reply.trim()));
        }
        catch (error) {
            this.toast(`对话失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
        }
        finally {
            this.commit({ busy: { ...this.state.busy, chat: false } });
        }
    }
    /** 发张照片：按最近上下文生成一张照片并以消息发出。 */
    async generateImageMessage(characterId) {
        const character = this.state.characters.find(c => c.id === characterId);
        if (character === undefined)
            return;
        if (this.state.busy.image === true)
            return;
        if (!profileConfigured(this.state.settings.image)) {
            this.toast('文生图 API 未配置，请先点击左下角「设置」配置');
            return;
        }
        this.commit({ busy: { ...this.state.busy, image: true } });
        try {
            const prompt = await deriveMediaPrompt(character, this.chooseRecentForPrompt(characterId), 'image', this.state.settings, api.chatCall);
            const dataUrl = await api.imageCall(this.state.settings.image.baseUrl, this.state.settings.image.apiKey, this.state.settings.image.model, prompt, '1024x1024');
            this.appendMessage(characterId, {
                ...newMessage('girlfriend', 'image', prompt),
                mediaUrl: dataUrl,
            });
        }
        catch (error) {
            this.toast(`生成照片失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
        }
        finally {
            this.commit({ busy: { ...this.state.busy, image: false } });
        }
    }
    /** 发个视频：按最近上下文生成一段视频并以消息发出。 */
    async generateVideoMessage(characterId) {
        const character = this.state.characters.find(c => c.id === characterId);
        if (character === undefined)
            return;
        if (this.state.busy.video === true)
            return;
        if (!profileConfigured(this.state.settings.video)) {
            this.toast('文生视频 API 未配置，请先点击左下角「设置」配置');
            return;
        }
        this.commit({ busy: { ...this.state.busy, video: true } });
        try {
            const prompt = await deriveMediaPrompt(character, this.chooseRecentForPrompt(characterId), 'video', this.state.settings, api.chatCall);
            const url = await api.videoCall(this.state.settings.video, prompt);
            this.appendMessage(characterId, {
                ...newMessage('girlfriend', 'video', prompt),
                mediaUrl: url,
            });
        }
        catch (error) {
            this.toast(`生成视频失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
        }
        finally {
            this.commit({ busy: { ...this.state.busy, video: false } });
        }
    }
    /** 上传照片：视觉语言模型分析 → 角色结合上下文回复。 */
    async uploadPhoto(characterId, file) {
        const character = this.state.characters.find(c => c.id === characterId);
        if (character === undefined || this.state.busy.photo === true)
            return;
        if (!profileConfigured(this.state.settings.vlm)) {
            this.toast('视觉语言模型 API 未配置，无法分析照片，请先配置');
            return;
        }
        let dataUrl;
        try {
            dataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result));
                reader.onerror = () => reject(new Error('读取文件失败'));
                reader.readAsDataURL(file);
            });
        }
        catch (error) {
            this.toast(`读取照片失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
            return;
        }
        this.commit({ busy: { ...this.state.busy, photo: true } });
        try {
            const analysis = await api.chatCall({
                baseUrl: this.state.settings.vlm.baseUrl,
                apiKey: this.state.settings.vlm.apiKey,
                model: this.state.settings.vlm.model,
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: '请仔细观察这张照片，用中文描述照片里的内容：人物、场景、动作、物品和氛围。不要评价照片本身，只描述内容。' },
                            { type: 'image_url', image_url: { url: dataUrl } },
                        ],
                    },
                ],
                temperature: 0.3,
            });
            this.appendMessage(characterId, {
                ...newMessage('user', 'photo', '（我发来一张照片）'),
                mediaUrl: dataUrl,
                analysis: analysis.trim(),
            });
            if (!this.chatSettingsPresent()) {
                this.toast('照片已分析，但对话模型 API 未配置，无法让角色回应');
                return;
            }
            const recent = this.chooseRecentForPrompt(characterId);
            const reply = await api.chatCall({
                baseUrl: this.state.settings.chat.baseUrl,
                apiKey: this.state.settings.chat.apiKey,
                model: this.state.settings.chat.model,
                messages: [
                    { role: 'system', content: buildPersonaPrompt(this.state.characters.find(c => c.id === characterId) ?? character) },
                    ...recentTextMessages(recent, 10).map(m => ({ role: m.role, content: m.content })),
                    {
                        role: 'user',
                        content: `（我刚刚给你发来一张照片，照片内容描述如下：${analysis.trim()}）请用你的人设和语气，自然地回应这张照片。`,
                    },
                ],
                temperature: 0.85,
            });
            this.appendMessage(characterId, newMessage('girlfriend', 'text', reply.trim()));
        }
        catch (error) {
            this.toast(`分析照片失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
        }
        finally {
            this.commit({ busy: { ...this.state.busy, photo: false } });
        }
    }
    // ---- character lifecycle ----
    /** 生成一张肖像预览图；返回 data URL，失败返回空字符串（已弹出提醒）。 */
    async generatePortrait(values) {
        if (!profileConfigured(this.state.settings.image)) {
            this.toast('文生图 API 未配置，无法生成肖像图，请先点击左下角「设置」配置');
            return '';
        }
        this.commit({ busy: { ...this.state.busy, portrait: true } });
        try {
            const prompt = [
                `为「${values.name.trim() || '一个女孩'}」生成一张半身肖像照（竖版）。`,
                `外形参数：${values.appearance.trim() || '清纯可爱'}。`,
                `性格气质：${values.personality.trim() || '温柔'}。`,
                '真实照片风格，柔和自然光线，面部特写，背景虚化，高清精致。',
            ].join('\n');
            return await api.imageCall(this.state.settings.image.baseUrl, this.state.settings.image.apiKey, this.state.settings.image.model, prompt, '1024x1024');
        }
        catch (error) {
            this.toast(`生成肖像失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
            return '';
        }
        finally {
            this.commit({ busy: { ...this.state.busy, portrait: false } });
        }
    }
    /** Record one character (MD file + portrait asset), then open her chat. */
    async addCharacter(values, portraitDataUrl) {
        if (values.name.trim() === '') {
            this.toast('请先填写名字');
            return;
        }
        const id = crypto.randomUUID();
        const now = Date.now();
        const character = {
            ...values,
            name: values.name.trim(),
            id,
            createdAt: now,
            updatedAt: now,
            lastMessage: '（你们刚刚认识）',
        };
        if (portraitDataUrl !== undefined && portraitDataUrl !== '') {
            try {
                await api.fsSaveAsset(avatarRelPath(id), portraitDataUrl);
                character.avatarPath = avatarRelPath(id);
            }
            catch (error) {
                this.toast(`保存肖像图失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
            }
        }
        try {
            await api.fsWrite(`${id}.md`, serializeCharacter(character));
        }
        catch (error) {
            this.toast(`写入角色设定文件失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
        }
        this.commit({
            characters: [...this.state.characters, character],
            view: { kind: 'chat', characterId: id },
        });
        this.persist();
        this.toast(`已添加好友「${character.name}」`, 'info');
    }
    /** Update an existing character (MD file rewritten; optional new portrait). */
    async updateCharacter(id, values, portraitDataUrl) {
        const existing = this.state.characters.find(c => c.id === id);
        if (existing === undefined)
            return;
        if (values.name.trim() === '') {
            this.toast('名字不能为空');
            return;
        }
        const character = {
            ...existing,
            ...values,
            name: values.name.trim(),
            updatedAt: Date.now(),
        };
        if (portraitDataUrl !== undefined && portraitDataUrl !== '') {
            try {
                await api.fsSaveAsset(avatarRelPath(id), portraitDataUrl);
                character.avatarPath = avatarRelPath(id);
            }
            catch (error) {
                this.toast(`保存肖像图失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
            }
        }
        try {
            await api.fsWrite(`${id}.md`, serializeCharacter(character));
        }
        catch (error) {
            this.toast(`写入角色设定文件失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
        }
        this.commit({
            characters: this.state.characters.map(c => (c.id === id ? character : c)),
        });
        this.persist();
        this.toast(`已保存「${character.name}」的设定`, 'info');
    }
    /** Delete a character: chat history and portrait are dropped, the Markdown
     * profile and portrait asset are removed from the host data directory. */
    async deleteCharacter(id) {
        const character = this.state.characters.find(c => c.id === id);
        if (character === undefined)
            return;
        // Best-effort file cleanup: local state removal is the user-visible part.
        try {
            await api.fsDelete(`${id}.md`);
        }
        catch {
            // profile may already be gone — not an error worth surfacing
        }
        if (character.avatarPath !== undefined) {
            try {
                await api.fsDelete(character.avatarPath);
            }
            catch {
                // portrait may already be gone
            }
        }
        const messages = { ...this.state.messages };
        delete messages[id];
        const characters = this.state.characters.filter(c => c.id !== id);
        const view = this.state.view.kind === 'chat' && this.state.view.characterId === id
            ? { kind: 'chat', characterId: characters[0]?.id ?? '' }
            : this.state.view;
        this.commit({ characters, messages, view });
        this.persist();
        this.toast(`已删除「${character.name}」`, 'info');
    }
    /**
     * Boot reconciliation: Markdown profile files are the source of truth for
     * persona fields and portraits; this merges them over the local cache when
     * host file access is available.
     */
    async hydrateFromFiles() {
        let names;
        try {
            names = await api.fsList();
        }
        catch (error) {
            this.toast(`角色数据目录读取失败，将使用本地缓存: ${error instanceof Error ? error.message : String(error)}`, 'error');
            return;
        }
        if (names.length === 0)
            return;
        const merged = new Map(this.state.characters.map(c => [c.id, c]));
        let loaded = 0;
        for (const file of names.sort((a, b) => a.updatedAt - b.updatedAt)) {
            try {
                const content = await api.fsRead(file.name);
                const parsed = parseCharacter(content);
                const id = parseCharacterId(content) ?? file.name.replace(/\.md$/, '');
                const existing = merged.get(id);
                const now = Date.now();
                const base = existing ?? { id, createdAt: now, lastMessage: '（你们刚刚认识）' };
                const updated = {
                    ...base,
                    ...parsed,
                    id,
                    updatedAt: now,
                };
                merged.set(id, updated);
                loaded += 1;
            }
            catch {
                // One malformed file must not abort the whole reconciliation.
            }
        }
        if (loaded === 0)
            return;
        const characters = [...merged.values()].sort((a, b) => (b.lastTime ?? b.createdAt) - (a.lastTime ?? a.createdAt));
        this.commit({ characters });
        this.persist();
        this.toast(`已从设定文件恢复 ${String(loaded)} 位好友`, 'info');
    }
}
/** Create the shared model (one instance per plugin load). */
export function createModel() {
    return new GirlfriendModel();
}
//# sourceMappingURL=model.js.map