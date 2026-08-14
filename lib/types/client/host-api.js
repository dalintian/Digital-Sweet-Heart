/**
 * Browser-side client for the host `/girlfriend/*` routes
 * (`packages/client/ui-girlfriend/src/index.ts` node half). All provider
 * traffic and file I/O flows through these same-origin calls — no CORS.
 */
async function post(path, body) {
    const response = await fetch(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
    });
    const text = await response.text();
    let data;
    try {
        data = JSON.parse(text);
    }
    catch {
        throw new Error(`接口响应异常: HTTP ${response.status}`);
    }
    return data;
}
function unwrap(result, what) {
    if (result === null || typeof result !== 'object')
        throw new Error(`${what}: 响应格式错误`);
    const record = result;
    if (record.ok !== true)
        throw new Error(typeof record.message === 'string' ? record.message : `${what} 失败`);
    return record;
}
/** Call the configured chat model (also the vision-language model with image parts). */
export async function chatCall(params) {
    const result = unwrap(await post('/girlfriend/api/chat', params), '对话接口');
    if (typeof result.content !== 'string')
        throw new Error('对话接口: 缺少 content');
    return result.content;
}
/** Call the configured image model; returns a data URL. */
export async function imageCall(baseUrl, apiKey, model, prompt, size) {
    const result = unwrap(await post('/girlfriend/api/image', { baseUrl, apiKey, model, prompt, size }), '文生图接口');
    if (typeof result.dataUrl !== 'string')
        throw new Error('文生图接口: 缺少 dataUrl');
    return result.dataUrl;
}
/** Call the configured video model; returns a playable URL. */
export async function videoCall(profile, prompt) {
    const result = unwrap(await post('/girlfriend/api/video', { ...profile, prompt }), '文生视频接口');
    if (typeof result.url !== 'string')
        throw new Error('文生视频接口: 缺少 url');
    return result.url;
}
/** List the Markdown profile files in the data directory. */
export async function fsList() {
    const result = unwrap(await post('/girlfriend/fs/list', {}), '文件列表');
    if (!Array.isArray(result.names))
        return [];
    return result.names;
}
/** Read one Markdown profile file. */
export async function fsRead(name) {
    const result = unwrap(await post('/girlfriend/fs/read', { name }), '读取文件');
    if (typeof result.content !== 'string')
        throw new Error('读取文件: 缺少 content');
    return result.content;
}
/** Write one Markdown profile file. */
export async function fsWrite(name, content) {
    unwrap(await post('/girlfriend/fs/write', { name, content }), '写入文件');
}
/** Save a portrait image as a file (payload is a data URL). */
export async function fsSaveAsset(name, dataUrl) {
    unwrap(await post('/girlfriend/fs/asset', { name, dataUrl }), '保存图片');
}
/** Delete one stored file (character profile or portrait asset). Missing files are not an error. */
export async function fsDelete(name) {
    unwrap(await post('/girlfriend/fs/delete', { name }), '删除文件');
}
/** Absolute URL of a stored asset (portrait etc.). */
export function assetUrl(relative) {
    return `/girlfriend/assets/${relative}`;
}
//# sourceMappingURL=host-api.js.map