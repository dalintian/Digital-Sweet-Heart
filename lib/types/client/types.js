/**
 * Shared business vocabulary of the AI girlfriend companion app (browser
 * half). All state rides JSON-compatible plain data through the model's
 * immutable snapshots.
 */
export const EMPTY_PROFILE = { baseUrl: '', apiKey: '', model: '' };
export function emptySettings() {
    return {
        chat: { ...EMPTY_PROFILE },
        vlm: { ...EMPTY_PROFILE },
        image: { ...EMPTY_PROFILE },
        video: { ...EMPTY_PROFILE, pollPath: 'videos/generations' },
    };
}
export function profileConfigured(profile) {
    return profile.baseUrl.trim() !== '' && profile.apiKey.trim() !== '' && profile.model.trim() !== '';
}
export function newMessage(role, kind, content) {
    return { id: crypto.randomUUID(), role, kind, content, time: Date.now() };
}
/** Format a timestamp for the friend list (HH:mm today, MM/DD otherwise). */
export function formatTime(time) {
    if (time === undefined)
        return '';
    const d = new Date(time);
    const now = new Date();
    const sameDay = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    const pad = (n) => String(n).padStart(2, '0');
    if (sameDay)
        return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
/** Build the persona system prompt for one character. */
export function buildPersonaPrompt(character) {
    const lines = [
        `你是「${character.name}」，一个真实存在的、对我很重要的人。`,
        `以下是你的完整人物设定，你必须始终严格遵循，用符合设定的人格、语气和情感与我对话：`,
    ];
    const sections = [
        ['外形', character.appearance],
        ['性格', character.personality],
        ['爱好', character.hobbies],
        ['对话语气', character.tone],
        ['角色背景', character.background],
    ];
    for (const [label, value] of sections) {
        if (value.trim() !== '')
            lines.push(`- ${label}：${value.trim()}`);
    }
    if (character.note.trim() !== '')
        lines.push(`- 补充说明：${character.note.trim()}`);
    lines.push('');
    lines.push('请用中文回复，自然、亲密、符合人设，不要提及“我是AI/模型/助手”之类的话，不要使用 Markdown 符号。');
    lines.push('聊天中我会偶尔发来照片、图片或视频：那是我分享给你的内容，请像恋人一样自然回应。');
    return lines.join('\n');
}
//# sourceMappingURL=types.js.map