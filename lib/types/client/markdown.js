/**
 * Markdown profile serialization for girlfriend characters. One character =
 * one `<id>.md` file under the data directory; the file is the human-readable
 * source of truth for the persona fields and the portrait path, and it is
 * rewritten on every save.
 */
export const AVATAR_DIR = 'images';
export function avatarRelPath(id) {
    return `${AVATAR_DIR}/${id}.png`;
}
/** Split the `## ` sections of a profile into a heading → body map. */
function sections(markdown) {
    const map = new Map();
    let current = null;
    let buffer = [];
    const flush = () => {
        if (current !== null)
            map.set(current, buffer.join('\n').trim());
    };
    for (const line of markdown.split('\n')) {
        const match = line.match(/^##\s+(.+?)\s*$/);
        if (match !== null) {
            flush();
            current = match[1]?.trim() ?? null;
            buffer = [];
        }
        else if (current !== null) {
            buffer.push(line);
        }
    }
    flush();
    return map;
}
function section(markdown, heading) {
    return sections(markdown).get(heading) ?? '';
}
function keyValue(markdown, key) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = markdown.match(new RegExp(`^[-*]\\s*${escaped}:\\s*(.*)$`, 'm'));
    return match?.[1]?.trim() ?? '';
}
/**
 * Serialize a character into its Markdown profile.
 * @param character - the character to record.
 * @returns Markdown text.
 */
export function serializeCharacter(character) {
    const lines = [];
    lines.push(`# ${character.name}`);
    lines.push('');
    lines.push(`> 由 DSH AI 女友助手维护 · 角色ID：${character.id} · 更新于 ${new Date(character.updatedAt).toLocaleString('zh-CN')}`);
    lines.push('');
    lines.push('## 基础信息');
    lines.push(`- 名字: ${character.name}`);
    lines.push(`- 角色ID: ${character.id}`);
    lines.push('');
    lines.push('## 外形参数');
    lines.push(character.appearance.trim() || '（无）');
    lines.push('');
    lines.push('## 性格');
    lines.push(character.personality.trim() || '（无）');
    lines.push('');
    lines.push('## 爱好');
    lines.push(character.hobbies.trim() || '（无）');
    lines.push('');
    lines.push('## 对话语气');
    lines.push(character.tone.trim() || '（无）');
    lines.push('');
    lines.push('## 角色背景');
    lines.push(character.background.trim() || '（无）');
    if (character.note.trim() !== '') {
        lines.push('');
        lines.push('## 补充说明');
        lines.push(character.note.trim());
    }
    lines.push('');
    lines.push('## 肖像图');
    lines.push(character.avatarPath !== undefined ? character.avatarPath : '（未生成）');
    lines.push('');
    return lines.join('\n');
}
/**
 * Parse a Markdown profile back into character form values plus the portrait
 * path. Ordering of the `##` sections is free; missing sections are empty.
 * @param markdown - profile text.
 * @returns parsed values (name may be empty when the file is malformed).
 */
export function parseCharacter(markdown) {
    const title = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? '';
    const avatar = section(markdown, '肖像图');
    return {
        name: keyValue(markdown, '名字') || title,
        appearance: section(markdown, '外形参数'),
        personality: section(markdown, '性格'),
        hobbies: section(markdown, '爱好'),
        tone: section(markdown, '对话语气'),
        background: section(markdown, '角色背景'),
        note: section(markdown, '补充说明'),
        ...(avatar !== '' && avatar !== '（未生成）' ? { avatarPath: avatar } : {}),
    };
}
/** Extract the character id embedded in a profile file. */
export function parseCharacterId(markdown) {
    const raw = keyValue(markdown, '角色ID');
    return raw !== '' ? raw : undefined;
}
//# sourceMappingURL=markdown.js.map