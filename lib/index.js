import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, extname, join, resolve } from "node:path";
//#region lib/types/index.js
/**
* Host half of the AI girlfriend companion plugin (`dsh.client` dual-face
* package): the node side registers `/girlfriend/*` HTTP routes on the shared
* webServer. Two jobs, both browser-impossible by default — CORS-free model
* API proxying (chat / vision / image / video) and character-data file I/O
* (Markdown profiles plus portrait images under the DSH storage root).
*
* The browser half never talks to external providers directly; it posts
* provider credentials + payloads here, same-origin, and this half forwards
* to the configured OpenAI-compatible endpoints. Routes are intentionally
* unauthenticated like the rest of the localhost GUI: this is a local
* single-user tool.
*
* @module dsh-client-ui-girlfriend
*/
/** Cordis plugin name. */
const name = "client-ui-girlfriend-host";
/** Required services: the route registry. */
const inject = ["webServer"];
/** The base path every route of this plugin lives under. */
const ROUTE_PREFIX = "/girlfriend";
/**
* Character data directory: `<dshHome>/storages/girlfriend` — the same root
* the storage-json backend uses, so user data stays inside the harness home.
*/
function dataDir() {
	return join(process.env.DSH_HOME ?? join(homedir(), ".dsh"), "storages", "girlfriend");
}
/** JSON response helper. */
function json(res, status, body) {
	const payload = JSON.stringify(body);
	res.writeHead(status, {
		"content-type": "application/json; charset=utf-8",
		"cache-control": "no-store"
	});
	res.end(payload);
}
/** Read the request body as UTF-8 text (small local payloads). */
async function readBody(req) {
	const chunks = [];
	for await (const chunk of req) {
		chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
		if (chunks.reduce((n, c) => n + c.length, 0) > 8 * 1024 * 1024) break;
	}
	return Buffer.concat(chunks).toString("utf8");
}
async function readJson(req) {
	const text = await readBody(req);
	if (text.trim() === "") return {};
	const parsed = JSON.parse(text);
	if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("request body must be a JSON object");
	return parsed;
}
function str(value, fallback = "") {
	return typeof value === "string" && value.length > 0 ? value : fallback;
}
function num(value, fallback) {
	return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function apiUrl(base, path) {
	return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}
function authHeaders(apiKey) {
	return {
		authorization: `Bearer ${apiKey}`,
		"content-type": "application/json"
	};
}
/** Fold any thrown value into {ok:false,message}. */
function failure(error) {
	return {
		ok: false,
		message: error instanceof Error ? error.message : String(error)
	};
}
async function requireString(body, key) {
	const value = str(body[key]);
	if (value === "") throw new Error(`missing required field "${key}"`);
	return value;
}
/**
* Forward an OpenAI-compatible chat completion request (used for both the
* dialogue model and the vision-language model — the browser formats the
* message list, images included as data URLs).
*/
async function handleChat(body) {
	const baseUrl = await requireString(body, "baseUrl");
	const apiKey = await requireString(body, "apiKey");
	const model = await requireString(body, "model");
	const messages = body.messages;
	if (!Array.isArray(messages)) throw new Error("missing required field \"messages\"");
	const response = await fetch(apiUrl(baseUrl, "chat/completions"), {
		method: "POST",
		headers: authHeaders(apiKey),
		body: JSON.stringify({
			model,
			messages,
			temperature: num(body.temperature, .8),
			max_tokens: body.maxTokens === void 0 ? void 0 : num(body.maxTokens, 2048),
			stream: false
		})
	});
	const text = await response.text();
	if (!response.ok) throw new Error(`模型接口返回 HTTP ${response.status}: ${text.slice(0, 500)}`);
	let data;
	try {
		data = JSON.parse(text);
	} catch {
		throw new Error("模型接口返回的不是有效 JSON");
	}
	const content = data?.choices?.[0]?.message?.content;
	if (typeof content !== "string") throw new Error("模型接口响应缺少 choices[0].message.content");
	return {
		ok: true,
		content
	};
}
/** Convert a fetched remote object to a base64 data URL. */
async function remoteToDataUrl(url) {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`下载图片失败: HTTP ${response.status}`);
	const buffer = Buffer.from(await response.arrayBuffer());
	return `data:${response.headers.get("content-type")?.split(";")[0]?.trim() ?? "image/png"};base64,${buffer.toString("base64")}`;
}
/** Forward an OpenAI-compatible image generation call; always returns a data URL. */
async function handleImage(body) {
	const baseUrl = await requireString(body, "baseUrl");
	const apiKey = await requireString(body, "apiKey");
	const model = await requireString(body, "model");
	const prompt = await requireString(body, "prompt");
	const response = await fetch(apiUrl(baseUrl, "images/generations"), {
		method: "POST",
		headers: authHeaders(apiKey),
		body: JSON.stringify({
			model,
			prompt,
			n: 1,
			...str(body.size) !== "" ? { size: body.size } : {}
		})
	});
	const text = await response.text();
	if (!response.ok) throw new Error(`生图接口返回 HTTP ${response.status}: ${text.slice(0, 500)}`);
	let data;
	try {
		data = JSON.parse(text);
	} catch {
		throw new Error("生图接口返回的不是有效 JSON");
	}
	const first = data?.data?.[0];
	if (first === void 0) throw new Error("生图接口响应缺少 data[0]");
	if (typeof first.b64_json === "string") return {
		ok: true,
		dataUrl: `data:image/png;base64,${first.b64_json}`
	};
	if (typeof first.url === "string") return {
		ok: true,
		dataUrl: await remoteToDataUrl(first.url)
	};
	throw new Error("生图接口响应既没有 b64_json 也没有 url");
}
/** Deep-scan a parsed video response for a media url. */
function findVideoUrl(value) {
	if (typeof value === "string") return value.length > 0 ? value : void 0;
	if (value === null || typeof value !== "object") return void 0;
	if (Array.isArray(value)) {
		for (const item of value) {
			const hit = findVideoUrl(item);
			if (hit !== void 0) return hit;
		}
		return;
	}
	const record = value;
	for (const key of [
		"url",
		"video_url",
		"media_url",
		"result"
	]) {
		const hit = findVideoUrl(record[key]);
		if (hit !== void 0) return hit;
	}
}
/** Deep-scan a parsed video response for a task id. */
function findTaskId(value) {
	if (value === null || typeof value !== "object" || Array.isArray(value)) return void 0;
	const record = value;
	for (const key of [
		"id",
		"taskId",
		"task_id",
		"requestId",
		"request_id"
	]) {
		const candidate = record[key];
		if (typeof candidate === "string" && candidate.length > 0) return candidate;
	}
}
/**
* Forward a video generation call. Video endpoints vary wildly across
* providers (no shared standard), so this tries direct results first, then
* polls a task id. The `pollPath` field lets the user point at an
* async-task provider's status route.
*/
async function handleVideo(body) {
	const baseUrl = await requireString(body, "baseUrl");
	const apiKey = await requireString(body, "apiKey");
	const model = await requireString(body, "model");
	const prompt = await requireString(body, "prompt");
	const pollPath = str(body.pollPath, "videos/generations");
	const pollIntervalMs = num(body.pollIntervalMs, 3e3);
	const maxWaitMs = num(body.maxWaitMs, 3e5);
	const submit = async () => {
		const response = await fetch(apiUrl(baseUrl, "videos/generations"), {
			method: "POST",
			headers: authHeaders(apiKey),
			body: JSON.stringify({
				model,
				prompt
			})
		});
		const text = await response.text();
		if (!response.ok) throw new Error(`文生视频接口返回 HTTP ${response.status}: ${text.slice(0, 500)}`);
		try {
			return JSON.parse(text);
		} catch {
			throw new Error("文生视频接口返回的不是有效 JSON");
		}
	};
	const data = await submit();
	const direct = findVideoUrl(data);
	if (direct !== void 0) return {
		ok: true,
		url: direct
	};
	const taskId = findTaskId(data);
	if (taskId === void 0) throw new Error("文生视频接口响应中没有可直接播放的 url，也没有任务 id");
	const deadline = Date.now() + maxWaitMs;
	for (;;) {
		await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
		const response = await fetch(apiUrl(baseUrl, `${pollPath}/${encodeURIComponent(taskId)}`), { headers: authHeaders(apiKey) });
		if (!response.ok) throw new Error(`任务查询失败: HTTP ${response.status} ${(await response.text()).slice(0, 300)}`);
		let polled;
		try {
			polled = JSON.parse(await response.text());
		} catch {
			throw new Error("任务查询返回的不是有效 JSON");
		}
		const status = typeof polled?.status === "string" ? String(polled.status).toLowerCase() : "";
		if (status === "success" || status === "completed" || status === "succeeded" || status === "done") {
			const url = findVideoUrl(polled);
			if (url === void 0) throw new Error("任务已完成，但响应中没有视频 url");
			return {
				ok: true,
				url
			};
		}
		if (status === "failed" || status === "failure" || status === "error" || status === "canceled") throw new Error(`视频生成任务失败: 状态 ${status}`);
		if (Date.now() > deadline) throw new Error("等待视频生成超时(默认 5 分钟)，可稍后在视频设置中调整轮询参数");
	}
}
/** Reject any relative path escaping the data directory. */
function safeName(name) {
	if (name.length === 0 || name.length > 400) throw new Error("invalid file name");
	const normalized = name.split("\\").join("/");
	if (normalized.startsWith("/") || normalized.includes("..")) throw new Error("invalid file name");
	return normalized;
}
function safePath(name) {
	return resolve(join(dataDir(), safeName(name)));
}
async function ensureDataDir() {
	await mkdir(dataDir(), { recursive: true });
}
/** Serve one portrait/asset file (GET). */
async function serveAsset(res, name) {
	try {
		const path = safePath(name);
		if (!(await stat(path)).isFile()) throw new Error("not a file");
		const body = await readFile(path);
		res.writeHead(200, {
			"content-type": {
				".png": "image/png",
				".jpg": "image/jpeg",
				".jpeg": "image/jpeg",
				".gif": "image/gif",
				".webp": "image/webp",
				".mp4": "video/mp4",
				".md": "text/markdown; charset=utf-8"
			}[extname(path).toLowerCase()] ?? "application/octet-stream",
			"cache-control": "public, max-age=3600"
		});
		res.end(body);
	} catch (error) {
		json(res, 404, failure(error));
	}
}
/** Data URL ({dataUrl}) → file bytes. */
function dataUrlToBuffer(dataUrl) {
	const comma = dataUrl.indexOf(",");
	if (!dataUrl.startsWith("data:") || comma === -1) throw new Error("invalid data URL");
	return Buffer.from(dataUrl.slice(comma + 1), "base64");
}
/**
* Mount the girlfriend routes.
* @param ctx - host plugin context carrying webServer.
*/
function apply(ctx) {
	ctx.effect(() => ctx.webServer.register({
		kind: "prefix",
		path: ROUTE_PREFIX,
		handler: async (req, res) => {
			try {
				const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
				if (req.method === "GET" && pathname.startsWith("/girlfriend/assets/")) {
					await serveAsset(res, decodeURIComponent(pathname.slice(19)));
					return;
				}
				if (req.method !== "POST") {
					json(res, 405, {
						ok: false,
						message: "method not allowed"
					});
					return;
				}
				let result;
				switch (pathname) {
					case "/girlfriend/api/chat":
						result = await handleChat(await readJson(req));
						break;
					case "/girlfriend/api/image":
						result = await handleImage(await readJson(req));
						break;
					case "/girlfriend/api/video":
						result = await handleVideo(await readJson(req));
						break;
					case "/girlfriend/fs/list": {
						await ensureDataDir();
						const entries = await readdir(dataDir(), { withFileTypes: true });
						const names = [];
						for (const entry of entries) {
							if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
							const info = await stat(join(dataDir(), entry.name));
							names.push({
								name: entry.name,
								updatedAt: info.mtimeMs
							});
						}
						result = {
							ok: true,
							names
						};
						break;
					}
					case "/girlfriend/fs/read":
						result = {
							ok: true,
							content: await readFile(safePath(await requireString(await readJson(req), "name")), "utf8")
						};
						break;
					case "/girlfriend/fs/write": {
						const body = await readJson(req);
						await ensureDataDir();
						const path = safePath(await requireString(body, "name"));
						await writeFile(path, typeof body.content === "string" ? body.content : "", "utf8");
						result = {
							ok: true,
							name: basename(path)
						};
						break;
					}
					case "/girlfriend/fs/asset": {
						const body = await readJson(req);
						await ensureDataDir();
						const path = safePath(await requireString(body, "name"));
						const dataUrl = await requireString(body, "dataUrl");
						await mkdir(dirname(path), { recursive: true });
						await writeFile(path, dataUrlToBuffer(dataUrl));
						result = {
							ok: true,
							name: safeName(String(body.name)).split("/").pop()
						};
						break;
					}
					case "/girlfriend/fs/delete":
						await rm(safePath(await requireString(await readJson(req), "name")), { force: true });
						result = { ok: true };
						break;
					default:
						json(res, 404, {
							ok: false,
							message: `unknown route ${pathname}`
						});
						return;
				}
				json(res, 200, result);
			} catch (error) {
				json(res, 200, failure(error));
			}
		}
	}), "ui-girlfriend: routes");
}
//#endregion
export { ROUTE_PREFIX, apply, inject, name };
