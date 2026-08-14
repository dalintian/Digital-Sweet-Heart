window.__ModuleLoader__.load({
	id: "dsh-client-ui-girlfriend",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/host-api.ts
		async function post(path, body) {
			const response = await fetch(path, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(body)
			});
			const text = await response.text();
			let data;
			try {
				data = JSON.parse(text);
			} catch {
				throw new Error(`接口响应异常: HTTP ${response.status}`);
			}
			return data;
		}
		function unwrap(result, what) {
			if (result === null || typeof result !== "object") throw new Error(`${what}: 响应格式错误`);
			const record = result;
			if (record.ok !== true) throw new Error(typeof record.message === "string" ? record.message : `${what} 失败`);
			return record;
		}
		/** Call the configured chat model (also the vision-language model with image parts). */
		async function chatCall(params) {
			const result = unwrap(await post("/girlfriend/api/chat", params), "对话接口");
			if (typeof result.content !== "string") throw new Error("对话接口: 缺少 content");
			return result.content;
		}
		/** Call the configured image model; returns a data URL. */
		async function imageCall(baseUrl, apiKey, model, prompt, size) {
			const result = unwrap(await post("/girlfriend/api/image", {
				baseUrl,
				apiKey,
				model,
				prompt,
				size
			}), "文生图接口");
			if (typeof result.dataUrl !== "string") throw new Error("文生图接口: 缺少 dataUrl");
			return result.dataUrl;
		}
		/** Call the configured video model; returns a playable URL. */
		async function videoCall(profile, prompt) {
			const result = unwrap(await post("/girlfriend/api/video", {
				...profile,
				prompt
			}), "文生视频接口");
			if (typeof result.url !== "string") throw new Error("文生视频接口: 缺少 url");
			return result.url;
		}
		/** List the Markdown profile files in the data directory. */
		async function fsList() {
			const result = unwrap(await post("/girlfriend/fs/list", {}), "文件列表");
			if (!Array.isArray(result.names)) return [];
			return result.names;
		}
		/** Read one Markdown profile file. */
		async function fsRead(name) {
			const result = unwrap(await post("/girlfriend/fs/read", { name }), "读取文件");
			if (typeof result.content !== "string") throw new Error("读取文件: 缺少 content");
			return result.content;
		}
		/** Write one Markdown profile file. */
		async function fsWrite(name, content) {
			unwrap(await post("/girlfriend/fs/write", {
				name,
				content
			}), "写入文件");
		}
		/** Save a portrait image as a file (payload is a data URL). */
		async function fsSaveAsset(name, dataUrl) {
			unwrap(await post("/girlfriend/fs/asset", {
				name,
				dataUrl
			}), "保存图片");
		}
		/** Delete one stored file (character profile or portrait asset). Missing files are not an error. */
		async function fsDelete(name) {
			unwrap(await post("/girlfriend/fs/delete", { name }), "删除文件");
		}
		/** Absolute URL of a stored asset (portrait etc.). */
		function assetUrl(relative) {
			return `/girlfriend/assets/${relative}`;
		}
		//#endregion
		//#region src/client/types.ts
		const EMPTY_PROFILE = {
			baseUrl: "",
			apiKey: "",
			model: ""
		};
		function emptySettings() {
			return {
				chat: { ...EMPTY_PROFILE },
				vlm: { ...EMPTY_PROFILE },
				image: { ...EMPTY_PROFILE },
				video: {
					...EMPTY_PROFILE,
					pollPath: "videos/generations"
				}
			};
		}
		function profileConfigured(profile) {
			return profile.baseUrl.trim() !== "" && profile.apiKey.trim() !== "" && profile.model.trim() !== "";
		}
		function newMessage(role, kind, content) {
			return {
				id: crypto.randomUUID(),
				role,
				kind,
				content,
				time: Date.now()
			};
		}
		/** Format a timestamp for the friend list (HH:mm today, MM/DD otherwise). */
		function formatTime(time) {
			if (time === void 0) return "";
			const d = new Date(time);
			const now = /* @__PURE__ */ new Date();
			const sameDay = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
			const pad = (n) => String(n).padStart(2, "0");
			if (sameDay) return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
			return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
		}
		/** Build the persona system prompt for one character. */
		function buildPersonaPrompt(character) {
			const lines = [`你是「${character.name}」，一个真实存在的、对我很重要的人。`, `以下是你的完整人物设定，你必须始终严格遵循，用符合设定的人格、语气和情感与我对话：`];
			const sections = [
				["外形", character.appearance],
				["性格", character.personality],
				["爱好", character.hobbies],
				["对话语气", character.tone],
				["角色背景", character.background]
			];
			for (const [label, value] of sections) if (value.trim() !== "") lines.push(`- ${label}：${value.trim()}`);
			if (character.note.trim() !== "") lines.push(`- 补充说明：${character.note.trim()}`);
			lines.push("");
			lines.push("请用中文回复，自然、亲密、符合人设，不要提及“我是AI/模型/助手”之类的话，不要使用 Markdown 符号。");
			lines.push("聊天中我会偶尔发来照片、图片或视频：那是我分享给你的内容，请像恋人一样自然回应。");
			return lines.join("\n");
		}
		//#endregion
		//#region \0dsh-css:E:\projects\deepseek-harness\packages\client\ui-girlfriend\src\client\ChatPanel.module.css.mjs
		const css$1 = "._1wUZXa_root{color-scheme:light;color:#1f1f1f;background:#f0f0f0;flex-direction:column;flex:1;min-height:0;font-family:system-ui,-apple-system,Segoe UI,PingFang SC,Microsoft YaHei,sans-serif;display:flex;position:relative}._1wUZXa_toasts{z-index:60;pointer-events:none;flex-direction:column;align-items:center;gap:8px;max-width:min(560px,80vw);display:flex;position:fixed;top:18px;left:50%;transform:translate(-50%)}._1wUZXa_toast{pointer-events:auto;color:#fff;cursor:pointer;text-align:left;border:none;border-radius:10px;padding:10px 18px;font-size:13px;line-height:1.45;box-shadow:0 6px 20px #00000038}._1wUZXa_toast[data-kind=warn]{background:#e6a23c}._1wUZXa_toast[data-kind=error]{background:#f56c6c}._1wUZXa_toast[data-kind=info]{background:#07c160}._1wUZXa_chatView{flex-direction:column;flex:1;min-height:0;display:flex}._1wUZXa_chatHeader{background:#f7f7f7;border-bottom:1px solid #e2e2e2;flex-shrink:0;align-items:center;gap:10px;padding:10px 16px;display:flex}._1wUZXa_chatHeaderAvatar{color:#fff;background:#ddd;border-radius:6px;flex-shrink:0;justify-content:center;align-items:center;width:38px;height:38px;font-size:16px;font-weight:600;display:flex;overflow:hidden}._1wUZXa_chatHeaderAvatar img{object-fit:cover;width:100%;height:100%}._1wUZXa_chatHeaderBody{flex-direction:column;flex:1;gap:2px;min-width:0;display:flex}._1wUZXa_chatHeaderName{white-space:nowrap;text-overflow:ellipsis;font-size:16px;font-weight:600;overflow:hidden}._1wUZXa_chatHeaderStatus{color:#9a9a9a;font-size:11px}._1wUZXa_headerEdit{color:#576b95;cursor:pointer;background:0 0;border:none;border-radius:8px;padding:6px 10px;font-size:13px}._1wUZXa_headerEdit:hover{background:#ececec}._1wUZXa_messages{background-image:radial-gradient(#dfdfdf 1px,#0000 1px);background-size:22px 22px;flex-direction:column;flex:1;gap:4px;min-height:0;padding:14px 16px;display:flex;overflow-y:auto}._1wUZXa_chatEmpty{color:#9a9a9a;flex-direction:column;align-items:center;gap:8px;margin:auto;font-size:13px;display:flex}._1wUZXa_chatEmptyEmoji{font-size:40px}._1wUZXa_bubbleRow{align-items:flex-start;gap:8px;max-width:78%;display:flex}._1wUZXa_bubbleRow[data-side=right]{flex-direction:row-reverse;align-self:flex-end}._1wUZXa_bubbleAvatar{color:#fff;background:#ddd;border-radius:5px;flex-shrink:0;justify-content:center;align-items:center;width:36px;height:36px;font-size:15px;font-weight:600;display:flex;overflow:hidden}._1wUZXa_bubbleAvatar img{object-fit:cover;width:100%;height:100%}._1wUZXa_bubbleColumn{flex-direction:column;gap:3px;min-width:0;display:flex}._1wUZXa_bubbleRow[data-side=right] ._1wUZXa_bubbleColumn{align-items:flex-end}._1wUZXa_textBubble{white-space:pre-wrap;word-break:break-word;background:#fff;border-radius:4px 12px 12px;padding:9px 12px;font-size:14px;line-height:1.55;box-shadow:0 1px 2px #0000000f}._1wUZXa_bubbleRow[data-side=right] ._1wUZXa_textBubble{background:#95ec69;border-radius:12px 4px 12px 12px}._1wUZXa_mediaBubble{background:#fff;border-radius:8px;flex-direction:column;gap:4px;max-width:260px;padding:6px;display:flex;box-shadow:0 1px 2px #0000000f}._1wUZXa_mediaImg{object-fit:contain;border-radius:6px;max-width:248px;max-height:320px;display:block}._1wUZXa_mediaVideo{border-radius:6px;width:260px;max-width:260px;display:block}._1wUZXa_mediaCaption{color:#666;word-break:break-word;padding:2px 4px;font-size:12px}._1wUZXa_photoAnalysis{color:#576b95;word-break:break-word;background:#f0f6ff;border-radius:6px;max-height:160px;padding:8px 10px;font-size:12px;line-height:1.5;overflow-y:auto}._1wUZXa_bubbleTime{color:#b0b0b0;padding:0 4px;font-size:10px}._1wUZXa_composer{background:#f7f7f7;border-top:1px solid #e2e2e2;flex-direction:column;flex-shrink:0;gap:8px;padding:8px 12px 10px;display:flex}._1wUZXa_composerInputRow{align-items:flex-end;gap:8px;display:flex}._1wUZXa_composerInput{resize:none;color:#1f1f1f;caret-color:#1f1f1f;box-sizing:border-box;background:#fff;border:none;border-radius:8px;outline:none;flex:1;min-height:38px;max-height:120px;padding:9px 12px;font-family:inherit;font-size:14px;line-height:1.5}._1wUZXa_sendButton{color:#fff;cursor:pointer;background:#07c160;border:none;border-radius:50%;flex-shrink:0;justify-content:center;align-items:center;width:42px;height:42px;font-size:17px;display:flex}._1wUZXa_sendButton:hover{background:#06ad56}._1wUZXa_sendButton:disabled{opacity:.45;cursor:default}._1wUZXa_composerTools{flex-wrap:wrap;gap:8px;display:flex}._1wUZXa_toolButton{color:#444;cursor:pointer;background:#fff;border:1px solid #dcdcdc;border-radius:999px;padding:5px 12px;font-family:inherit;font-size:12px}._1wUZXa_toolButton:hover{background:#f0f6ff;border-color:#b8d4f0}._1wUZXa_toolButton:disabled{opacity:.5;cursor:default}._1wUZXa_settingsView{background:#f7f7f7;flex-direction:column;flex:1;min-height:0;display:flex}._1wUZXa_settingsHeader{background:#fff;border-bottom:1px solid #e6e6e6;flex-shrink:0;align-items:center;gap:12px;padding:12px 16px;display:flex}._1wUZXa_settingsTitle{text-align:center;flex:1;font-size:16px;font-weight:600}._1wUZXa_backButton{color:#576b95;cursor:pointer;background:0 0;border:none;border-radius:8px;width:64px;padding:6px 10px;font-size:14px}._1wUZXa_backButton:hover{background:#f0f0f0}._1wUZXa_settingsIntro{color:#8a6d3b;background:#fff7e6;border-bottom:1px solid #ffe8b3;flex-shrink:0;padding:10px 16px;font-size:12px;line-height:1.6}._1wUZXa_settingsIntro code{background:#f3e4c2;border-radius:4px;padding:1px 5px;font-size:11px}._1wUZXa_settingsBody{flex-direction:column;flex:1;gap:12px;min-height:0;padding:14px 16px;display:flex;overflow-y:auto}._1wUZXa_profileCard{background:#fff;border:1px solid #e6e6e6;border-radius:10px;flex-direction:column;gap:8px;padding:12px 14px;display:flex}._1wUZXa_profileCard[data-configured]{border-color:#b7e6c9}._1wUZXa_profileHeader{align-items:center;gap:8px;display:flex}._1wUZXa_profileEmoji{font-size:17px}._1wUZXa_profileTitle{flex:1;font-size:14px;font-weight:600}._1wUZXa_profileStatus{color:#9a9a9a;background:#f2f2f2;border-radius:999px;padding:2px 8px;font-size:11px}._1wUZXa_profileCard[data-configured] ._1wUZXa_profileStatus{color:#07c160;background:#e6f7ec}._1wUZXa_field{flex-direction:column;gap:3px;display:flex}._1wUZXa_fieldLabel{color:#9a9a9a;font-size:11px}._1wUZXa_fieldInput{color:#1f1f1f;caret-color:#1f1f1f;box-sizing:border-box;background:#fafafa;border:1px solid #e0e0e0;border-radius:7px;outline:none;width:100%;padding:7px 10px;font-family:inherit;font-size:13px}._1wUZXa_fieldInput:focus{background:#fff;border-color:#07c160}._1wUZXa_settingsFooter{background:#fff;border-top:1px solid #e6e6e6;flex-shrink:0;justify-content:center;padding:12px 16px;display:flex}._1wUZXa_primaryButton{color:#fff;cursor:pointer;background:#07c160;border:none;border-radius:999px;padding:10px 26px;font-size:14px}._1wUZXa_primaryButton:hover{background:#06ad56}._1wUZXa_primaryButton:disabled{opacity:.45;cursor:default}._1wUZXa_ghostButton{color:#666;cursor:pointer;background:#fff;border:1px solid #bfbfbf;border-radius:999px;padding:9px 22px;font-size:13px}._1wUZXa_ghostButton:hover{background:#f2f2f2}._1wUZXa_formView{background:#f7f7f7;flex-direction:column;flex:1;min-height:0;display:flex}._1wUZXa_formBody{flex:1;align-items:flex-start;gap:18px;min-height:0;padding:16px;display:flex;overflow-y:auto}._1wUZXa_portraitPane{flex-direction:column;flex-shrink:0;gap:12px;width:260px;display:flex}._1wUZXa_portraitBox{aspect-ratio:3/4;color:#b0b0b0;background:#fff;border:1px dashed #cfcfcf;border-radius:12px;justify-content:center;align-items:center;display:flex;overflow:hidden}._1wUZXa_portraitImg{object-fit:cover;width:100%;height:100%}._1wUZXa_portraitPlaceholder{flex-direction:column;align-items:center;gap:6px;font-size:14px;display:flex}._1wUZXa_portraitActions{flex-direction:column;align-items:center;gap:8px;display:flex}._1wUZXa_portraitHint{color:#9a9a9a;text-align:center;font-size:11px;line-height:1.5}._1wUZXa_formFields{flex-direction:column;flex:1;gap:12px;min-width:0;display:flex}._1wUZXa_formField{flex-direction:column;gap:4px;display:flex}._1wUZXa_formLabel{color:#576b95;font-size:12px;font-weight:600}._1wUZXa_formInput,._1wUZXa_formTextarea{color:#1f1f1f;caret-color:#1f1f1f;resize:vertical;box-sizing:border-box;background:#fff;border:1px solid #e0e0e0;border-radius:8px;outline:none;width:100%;padding:8px 11px;font-family:inherit;font-size:13px;line-height:1.55}._1wUZXa_formInput:focus,._1wUZXa_formTextarea:focus{border-color:#07c160}._1wUZXa_formFooter{background:#fff;border-top:1px solid #e6e6e6;flex-shrink:0;justify-content:flex-end;align-items:center;gap:12px;padding:12px 16px;display:flex}._1wUZXa_hero{text-align:center;background-image:radial-gradient(#dfdfdf 1px,#0000 1px);background-size:22px 22px;flex-direction:column;flex:1;justify-content:center;align-items:center;gap:12px;min-height:0;padding:40px;display:flex}._1wUZXa_heroEmoji{font-size:56px}._1wUZXa_heroTitle{font-size:20px;font-weight:600}._1wUZXa_heroHint{color:#8f8f8f;max-width:420px;font-size:13px;line-height:1.7}";
		const tagId$1 = "dsh-client-ui-girlfriend/ChatPanel.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-client-ui-girlfriend";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var ChatPanel_module_css_default = {
			"textBubble": "_1wUZXa_textBubble",
			"sendButton": "_1wUZXa_sendButton",
			"fieldLabel": "_1wUZXa_fieldLabel",
			"chatHeaderBody": "_1wUZXa_chatHeaderBody",
			"composer": "_1wUZXa_composer",
			"root": "_1wUZXa_root",
			"toast": "_1wUZXa_toast",
			"chatEmpty": "_1wUZXa_chatEmpty",
			"profileTitle": "_1wUZXa_profileTitle",
			"portraitPane": "_1wUZXa_portraitPane",
			"portraitActions": "_1wUZXa_portraitActions",
			"chatHeaderStatus": "_1wUZXa_chatHeaderStatus",
			"heroEmoji": "_1wUZXa_heroEmoji",
			"heroHint": "_1wUZXa_heroHint",
			"formBody": "_1wUZXa_formBody",
			"composerTools": "_1wUZXa_composerTools",
			"mediaBubble": "_1wUZXa_mediaBubble",
			"portraitHint": "_1wUZXa_portraitHint",
			"formField": "_1wUZXa_formField",
			"mediaCaption": "_1wUZXa_mediaCaption",
			"composerInputRow": "_1wUZXa_composerInputRow",
			"profileHeader": "_1wUZXa_profileHeader",
			"chatView": "_1wUZXa_chatView",
			"formLabel": "_1wUZXa_formLabel",
			"formFields": "_1wUZXa_formFields",
			"profileStatus": "_1wUZXa_profileStatus",
			"settingsTitle": "_1wUZXa_settingsTitle",
			"fieldInput": "_1wUZXa_fieldInput",
			"heroTitle": "_1wUZXa_heroTitle",
			"mediaVideo": "_1wUZXa_mediaVideo",
			"formInput": "_1wUZXa_formInput",
			"settingsView": "_1wUZXa_settingsView",
			"mediaImg": "_1wUZXa_mediaImg",
			"ghostButton": "_1wUZXa_ghostButton",
			"portraitImg": "_1wUZXa_portraitImg",
			"bubbleColumn": "_1wUZXa_bubbleColumn",
			"chatHeaderAvatar": "_1wUZXa_chatHeaderAvatar",
			"messages": "_1wUZXa_messages",
			"bubbleAvatar": "_1wUZXa_bubbleAvatar",
			"field": "_1wUZXa_field",
			"portraitPlaceholder": "_1wUZXa_portraitPlaceholder",
			"formTextarea": "_1wUZXa_formTextarea",
			"headerEdit": "_1wUZXa_headerEdit",
			"settingsIntro": "_1wUZXa_settingsIntro",
			"hero": "_1wUZXa_hero",
			"chatHeader": "_1wUZXa_chatHeader",
			"chatEmptyEmoji": "_1wUZXa_chatEmptyEmoji",
			"settingsBody": "_1wUZXa_settingsBody",
			"bubbleRow": "_1wUZXa_bubbleRow",
			"portraitBox": "_1wUZXa_portraitBox",
			"chatHeaderName": "_1wUZXa_chatHeaderName",
			"profileCard": "_1wUZXa_profileCard",
			"settingsHeader": "_1wUZXa_settingsHeader",
			"backButton": "_1wUZXa_backButton",
			"bubbleTime": "_1wUZXa_bubbleTime",
			"profileEmoji": "_1wUZXa_profileEmoji",
			"formFooter": "_1wUZXa_formFooter",
			"composerInput": "_1wUZXa_composerInput",
			"formView": "_1wUZXa_formView",
			"settingsFooter": "_1wUZXa_settingsFooter",
			"primaryButton": "_1wUZXa_primaryButton",
			"toasts": "_1wUZXa_toasts",
			"photoAnalysis": "_1wUZXa_photoAnalysis",
			"toolButton": "_1wUZXa_toolButton"
		};
		//#endregion
		//#region src/client/ChatPanel.tsx
		/**
		* The right-hand companion surface, occupying the layout's `'conversation'`
		* slot: the WeChat-like chat dialog, the four-API settings view, and the
		* character create/edit form with portrait generation. All business data and
		* actions come from the shared model through `useModel`/`actions`; local
		* state is limited to ephemeral form/input content.
		*/
		function ToastStack(props) {
			const { useModel, actions } = props;
			const toasts = useModel((s) => s.toasts);
			(0, react.useEffect)(() => {
				const timers = toasts.map((toast) => window.setTimeout(() => actions.dismissToast(toast.id), 4200));
				return () => {
					for (const timer of timers) window.clearTimeout(timer);
				};
			}, [toasts, actions]);
			if (toasts.length === 0) return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: ChatPanel_module_css_default.toasts,
				children: toasts.map((toast) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: ChatPanel_module_css_default.toast,
					"data-kind": toast.kind,
					onClick: () => actions.dismissToast(toast.id),
					children: toast.text
				}, toast.id))
			});
		}
		function ChatView(props) {
			const { useModel, actions, character } = props;
			const messages = useModel((s) => s.messages[character.id] ?? []);
			const busy = useModel((s) => s.busy);
			const [draft, setDraft] = (0, react.useState)("");
			const fileRef = (0, react.useRef)(null);
			const scrollRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				const el = scrollRef.current;
				if (el !== null) el.scrollTop = el.scrollHeight;
			}, [
				(0, react.useMemo)(() => messages.length, [messages]),
				busy.chat,
				busy.image,
				busy.video,
				busy.photo
			]);
			const send = () => {
				if (draft.trim() === "" || busy.chat === true) return;
				actions.sendChat(character.id, draft);
				setDraft("");
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: ChatPanel_module_css_default.chatView,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: ChatPanel_module_css_default.chatHeader,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: ChatPanel_module_css_default.chatHeaderAvatar,
								children: character.avatarPath !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
									src: assetUrl(character.avatarPath),
									alt: character.name
								}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: character.name.slice(0, 1) })
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: ChatPanel_module_css_default.chatHeaderBody,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: ChatPanel_module_css_default.chatHeaderName,
									children: character.name
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: ChatPanel_module_css_default.chatHeaderStatus,
									children: busy.chat === true ? "正在输入…" : "在线"
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: ChatPanel_module_css_default.headerEdit,
								onClick: () => actions.openEdit(character.id),
								children: "设定"
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: ChatPanel_module_css_default.messages,
						ref: scrollRef,
						children: [messages.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: ChatPanel_module_css_default.chatEmpty,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: ChatPanel_module_css_default.chatEmptyEmoji,
								children: "💬"
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
								"和「",
								character.name,
								"」打个招呼吧～"
							] })]
						}), messages.map((message) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MessageBubble, {
							message,
							character
						}, message.id))]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: ChatPanel_module_css_default.composer,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: ChatPanel_module_css_default.composerInputRow,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
								className: ChatPanel_module_css_default.composerInput,
								value: draft,
								placeholder: `对「${character.name}」说点什么…（Enter 发送，Shift+Enter 换行）`,
								rows: 1,
								onChange: (event) => setDraft(event.target.value),
								onKeyDown: (event) => {
									if (event.key === "Enter" && !event.shiftKey) {
										event.preventDefault();
										send();
									}
								}
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: ChatPanel_module_css_default.sendButton,
								disabled: draft.trim() === "" || busy.chat === true,
								onClick: send,
								title: "发送",
								children: busy.chat === true ? "…" : "➤"
							})]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: ChatPanel_module_css_default.composerTools,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: ChatPanel_module_css_default.toolButton,
									disabled: busy.image === true,
									onClick: () => void actions.generateImageMessage(character.id),
									children: ["📷 ", busy.image === true ? "正在生成照片…" : "发张照片"]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: ChatPanel_module_css_default.toolButton,
									disabled: busy.video === true,
									onClick: () => void actions.generateVideoMessage(character.id),
									children: ["🎬 ", busy.video === true ? "正在生成视频…" : "发个视频"]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: ChatPanel_module_css_default.toolButton,
									disabled: busy.photo === true,
									onClick: () => fileRef.current?.click(),
									children: ["⬆️ ", busy.photo === true ? "正在分析照片…" : "上传照片"]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									ref: fileRef,
									type: "file",
									accept: "image/*",
									hidden: true,
									onChange: (event) => {
										const file = event.target.files?.[0];
										if (file !== void 0) actions.uploadPhoto(character.id, file);
										event.target.value = "";
									}
								})
							]
						})]
					})
				]
			});
		}
		function MessageBubble(props) {
			const { message, character } = props;
			const mine = message.role === "girlfriend";
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: ChatPanel_module_css_default.bubbleRow,
				"data-side": mine ? "left" : "right",
				children: [mine && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: ChatPanel_module_css_default.bubbleAvatar,
					children: character.avatarPath !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
						src: assetUrl(character.avatarPath),
						alt: character.name
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: character.name.slice(0, 1) })
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: ChatPanel_module_css_default.bubbleColumn,
					children: [
						message.kind === "image" && message.mediaUrl !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: ChatPanel_module_css_default.mediaBubble,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
								className: ChatPanel_module_css_default.mediaImg,
								src: message.mediaUrl,
								alt: message.content
							}), message.content !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: ChatPanel_module_css_default.mediaCaption,
								children: message.content
							})]
						}),
						message.kind === "video" && message.mediaUrl !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: ChatPanel_module_css_default.mediaBubble,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("video", {
								className: ChatPanel_module_css_default.mediaVideo,
								src: message.mediaUrl,
								controls: true,
								preload: "metadata"
							}), message.content !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: ChatPanel_module_css_default.mediaCaption,
								children: message.content
							})]
						}),
						message.kind === "photo" && message.mediaUrl !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: ChatPanel_module_css_default.mediaBubble,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
								className: ChatPanel_module_css_default.mediaImg,
								src: message.mediaUrl,
								alt: "照片"
							}), message.analysis !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: ChatPanel_module_css_default.photoAnalysis,
								children: ["🔍 我看到了：", message.analysis]
							})]
						}),
						message.kind === "text" && message.content !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: ChatPanel_module_css_default.textBubble,
							children: message.content
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: ChatPanel_module_css_default.bubbleTime,
							children: formatTime(message.time)
						})
					]
				})]
			});
		}
		function ProfileEditor(props) {
			const { title, emoji, profile, configured, pollPath, onChange, onPollPathChange } = props;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: ChatPanel_module_css_default.profileCard,
				"data-configured": configured || void 0,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: ChatPanel_module_css_default.profileHeader,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: ChatPanel_module_css_default.profileEmoji,
								children: emoji
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: ChatPanel_module_css_default.profileTitle,
								children: title
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: ChatPanel_module_css_default.profileStatus,
								children: configured ? "已配置" : "未配置"
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
						className: ChatPanel_module_css_default.field,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: ChatPanel_module_css_default.fieldLabel,
							children: "模型名"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							className: ChatPanel_module_css_default.fieldInput,
							value: profile.model,
							placeholder: "如 glm-4v-flash / gpt-4o / dall-e-3",
							onChange: (event) => onChange({
								...profile,
								model: event.target.value
							})
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
						className: ChatPanel_module_css_default.field,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: ChatPanel_module_css_default.fieldLabel,
							children: "API 地址"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							className: ChatPanel_module_css_default.fieldInput,
							value: profile.baseUrl,
							placeholder: "https://api.example.com/v1",
							onChange: (event) => onChange({
								...profile,
								baseUrl: event.target.value
							})
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
						className: ChatPanel_module_css_default.field,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: ChatPanel_module_css_default.fieldLabel,
							children: "API Key"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							className: ChatPanel_module_css_default.fieldInput,
							type: "password",
							value: profile.apiKey,
							placeholder: "sk-…",
							onChange: (event) => onChange({
								...profile,
								apiKey: event.target.value
							})
						})]
					}),
					pollPath !== void 0 && onPollPathChange !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
						className: ChatPanel_module_css_default.field,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: ChatPanel_module_css_default.fieldLabel,
							children: "任务轮询路径(可选)"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							className: ChatPanel_module_css_default.fieldInput,
							value: pollPath,
							placeholder: "videos/generations",
							onChange: (event) => onPollPathChange(event.target.value)
						})]
					})
				]
			});
		}
		function SettingsView(props) {
			const { useModel, actions } = props;
			const saved = useModel((s) => s.settings);
			const [form, setForm] = (0, react.useState)(() => ({
				chat: { ...saved.chat },
				vlm: { ...saved.vlm },
				image: { ...saved.image },
				video: { ...saved.video }
			}));
			const setChat = (next) => {
				setForm((prev) => ({
					...prev,
					chat: {
						baseUrl: next.baseUrl,
						apiKey: next.apiKey,
						model: next.model
					}
				}));
			};
			const setVlm = (next) => {
				setForm((prev) => ({
					...prev,
					vlm: {
						baseUrl: next.baseUrl,
						apiKey: next.apiKey,
						model: next.model
					}
				}));
			};
			const setImage = (next) => {
				setForm((prev) => ({
					...prev,
					image: {
						baseUrl: next.baseUrl,
						apiKey: next.apiKey,
						model: next.model
					}
				}));
			};
			const setVideo = (next) => {
				setForm((prev) => ({
					...prev,
					video: {
						...next,
						pollPath: next.pollPath ?? "videos/generations"
					}
				}));
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: ChatPanel_module_css_default.settingsView,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: ChatPanel_module_css_default.settingsHeader,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: ChatPanel_module_css_default.backButton,
								onClick: () => actions.goBack(),
								children: "‹ 返回"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: ChatPanel_module_css_default.settingsTitle,
								children: "设置"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: ChatPanel_module_css_default.settingsIntro,
						children: [
							"以下四组 API 分别用于聊天、照片分析、生成照片/肖像、生成视频。接口需兼容 OpenAI 格式 （对话与视觉走 ",
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: "/chat/completions" }),
							"，生图走 ",
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: "/images/generations" }),
							"）。 API Key 仅保存在浏览器本地。"
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: ChatPanel_module_css_default.settingsBody,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProfileEditor, {
								title: "对话模型",
								emoji: "💬",
								profile: form.chat,
								configured: profileConfigured(form.chat),
								onChange: setChat
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProfileEditor, {
								title: "视觉语言模型",
								emoji: "👁️",
								profile: form.vlm,
								configured: profileConfigured(form.vlm),
								onChange: setVlm
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProfileEditor, {
								title: "文生图模型",
								emoji: "🎨",
								profile: form.image,
								configured: profileConfigured(form.image),
								onChange: setImage
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProfileEditor, {
								title: "文生视频模型",
								emoji: "🎬",
								profile: form.video,
								configured: profileConfigured(form.video),
								pollPath: form.video.pollPath,
								onPollPathChange: (pollPath) => setForm((prev) => ({
									...prev,
									video: {
										...prev.video,
										pollPath
									}
								})),
								onChange: setVideo
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: ChatPanel_module_css_default.settingsFooter,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: ChatPanel_module_css_default.primaryButton,
							onClick: () => actions.saveSettings(form),
							children: "保存设置"
						})
					})
				]
			});
		}
		const EMPTY_FORM = {
			name: "",
			appearance: "",
			personality: "",
			hobbies: "",
			tone: "",
			background: "",
			note: ""
		};
		function Field(props) {
			const { label, value, placeholder, rows, onChange } = props;
			const id = (0, react.useMemo)(() => `gf-${label}`, [label]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: ChatPanel_module_css_default.formField,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
					className: ChatPanel_module_css_default.formLabel,
					htmlFor: id,
					children: label
				}), rows === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
					id,
					className: ChatPanel_module_css_default.formInput,
					value,
					placeholder,
					onChange: (event) => onChange(event.target.value)
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
					id,
					className: ChatPanel_module_css_default.formTextarea,
					value,
					placeholder,
					rows,
					onChange: (event) => onChange(event.target.value)
				})]
			});
		}
		function CharacterFormView(props) {
			const { useModel, actions, mode } = props;
			const busy = useModel((s) => s.busy);
			const character = mode === "edit" ? props.character : void 0;
			const [values, setValues] = (0, react.useState)(() => character === void 0 ? { ...EMPTY_FORM } : {
				name: character.name,
				appearance: character.appearance,
				personality: character.personality,
				hobbies: character.hobbies,
				tone: character.tone,
				background: character.background,
				note: character.note
			});
			const [portrait, setPortrait] = (0, react.useState)(character?.avatarPath !== void 0 ? assetUrl(character.avatarPath) : "");
			const setValue = (key) => (value) => {
				setValues((prev) => ({
					...prev,
					[key]: value
				}));
			};
			const generate = async () => {
				const dataUrl = await actions.generatePortrait(values);
				if (dataUrl !== "") setPortrait(dataUrl);
			};
			const canSave = values.name.trim() !== "";
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: ChatPanel_module_css_default.formView,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: ChatPanel_module_css_default.settingsHeader,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: ChatPanel_module_css_default.backButton,
								onClick: () => actions.goBack(),
								children: "‹ 返回"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: ChatPanel_module_css_default.settingsTitle,
								children: mode === "create" ? "添加好友 · 人物设定" : `编辑设定 · ${character?.name ?? ""}`
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: ChatPanel_module_css_default.formBody,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: ChatPanel_module_css_default.portraitPane,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: ChatPanel_module_css_default.portraitBox,
								children: portrait !== "" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
									className: ChatPanel_module_css_default.portraitImg,
									src: portrait,
									alt: "肖像预览"
								}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: ChatPanel_module_css_default.portraitPlaceholder,
									children: "👩 生成肖像预览"
								})
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: ChatPanel_module_css_default.portraitActions,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: ChatPanel_module_css_default.primaryButton,
									disabled: busy.portrait === true,
									onClick: () => void generate(),
									children: busy.portrait === true ? "生成中…" : portrait !== "" ? "不满意，重新生成" : "生成预览图"
								}), portrait !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: ChatPanel_module_css_default.portraitHint,
									children: [
										"满意的话点右下角「",
										mode === "create" ? "保存并添加为好友" : "保存修改",
										"」，肖像会保存为角色相片。"
									]
								})]
							})]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: ChatPanel_module_css_default.formFields,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
									label: "名字",
									value: values.name,
									placeholder: "例如：小雅",
									onChange: setValue("name")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
									label: "外形参数",
									value: values.appearance,
									placeholder: "例如：黑色长发，身高165cm，笑起来有酒窝，喜欢穿浅色连衣裙…",
									rows: 2,
									onChange: setValue("appearance")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
									label: "性格",
									value: values.personality,
									placeholder: "例如：温柔体贴、偶尔调皮、粘人但很会照顾人…",
									rows: 2,
									onChange: setValue("personality")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
									label: "爱好",
									value: values.hobbies,
									placeholder: "例如：画画、听民谣、做甜点、晚上散步…",
									rows: 2,
									onChange: setValue("hobbies")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
									label: "对话语气",
									value: values.tone,
									placeholder: "例如：爱撒娇、称呼我为「亲爱的」，句尾喜欢加「呀」「啦」…",
									rows: 2,
									onChange: setValue("tone")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
									label: "角色背景",
									value: values.background,
									placeholder: "例如：我们是大学同学，她毕业后做了插画师，我们刚在一起三个月…",
									rows: 3,
									onChange: setValue("background")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
									label: "补充说明",
									value: values.note,
									placeholder: "其它想补充的设定（可选）",
									rows: 2,
									onChange: setValue("note")
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: ChatPanel_module_css_default.formFooter,
						children: mode === "create" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: ChatPanel_module_css_default.ghostButton,
							onClick: () => void actions.addCharacter(values),
							children: "跳过肖像图，直接添加"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: ChatPanel_module_css_default.primaryButton,
							disabled: !canSave,
							onClick: () => void actions.addCharacter(values, portrait === "" ? void 0 : portrait),
							children: "满意，保存并添加为好友"
						})] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: ChatPanel_module_css_default.primaryButton,
							disabled: !canSave,
							onClick: () => void actions.updateCharacter(character.id, values, portrait === "" ? void 0 : portrait),
							children: "保存修改"
						}), portrait !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: ChatPanel_module_css_default.portraitHint,
							children: "保存修改时会同时更新设定文件并保存当前肖像。"
						})] })
					})
				]
			});
		}
		function ChatPanel(props) {
			const { useModel } = props;
			const view = useModel((s) => s.view);
			const characters = useModel((s) => s.characters);
			let body;
			if (view.kind === "settings") body = /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SettingsView, { ...props });
			else if (view.kind === "create") body = /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CharacterFormView, {
				...props,
				mode: "create"
			});
			else if (view.kind === "edit") {
				const character = characters.find((c) => c.id === view.characterId);
				body = character === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SettingsView, { ...props }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CharacterFormView, {
					...props,
					mode: "edit",
					character
				});
			} else {
				const character = characters.find((c) => c.id === view.characterId);
				body = character === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: ChatPanel_module_css_default.hero,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: ChatPanel_module_css_default.heroEmoji,
							children: "💘"
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: ChatPanel_module_css_default.heroTitle,
							children: "欢迎来到 AI 女友助手"
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: ChatPanel_module_css_default.heroHint,
							children: "在左侧点击「＋」添加好友，填写你心中的 TA 的外形、性格与故事， 生成一张满意的肖像，然后就可以开始聊天了。"
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: ChatPanel_module_css_default.primaryButton,
							onClick: () => props.actions.openCreate(),
							children: "添加好友"
						})
					]
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ChatView, {
					...props,
					character
				});
			}
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: ChatPanel_module_css_default.root,
				children: [body, /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ToastStack, { ...props })]
			});
		}
		//#endregion
		//#region \0dsh-css:E:\projects\deepseek-harness\packages\client\ui-girlfriend\src\client\FriendList.module.css.mjs
		const css = ".-fImJG_root{color:#1f1f1f;user-select:none;background:#f7f7f7;flex-direction:column;min-width:0;height:100%;font-size:14px;display:flex}.-fImJG_header{border-bottom:1px solid #e6e6e6;justify-content:space-between;align-items:center;padding:18px 14px 12px;display:flex}.-fImJG_title{letter-spacing:1px;font-size:18px;font-weight:600}.-fImJG_addButton{color:#fff;cursor:pointer;background:#07c160;border:none;border-radius:8px;justify-content:center;align-items:center;width:30px;height:30px;font-size:18px;line-height:1;display:flex}.-fImJG_addButton:hover{background:#06ad56}.-fImJG_empty{text-align:center;flex-direction:column;flex:1;justify-content:center;align-items:center;gap:10px;padding:24px;display:flex}.-fImJG_emptyEmoji{font-size:44px}.-fImJG_emptyText{color:#8a8a8a}.-fImJG_emptyAction{color:#fff;cursor:pointer;background:#07c160;border:none;border-radius:999px;margin-top:6px;padding:9px 18px;font-size:13px}.-fImJG_emptyAction:hover{background:#06ad56}.-fImJG_list{flex:1;margin:0;padding:6px 0;list-style:none;overflow-y:auto}.-fImJG_item{cursor:pointer;text-align:left;background:0 0;border:none;align-items:center;gap:10px;width:100%;padding:10px 12px;font-family:inherit;display:flex}.-fImJG_item:hover{background:#eaeaea}.-fImJG_item[data-active]{background:#dedede}.-fImJG_avatarImg,.-fImJG_avatarFallback{object-fit:cover;color:#fff;background:#d8d8d8;border-radius:6px;flex-shrink:0;justify-content:center;align-items:center;display:flex}.-fImJG_itemBody{flex-direction:column;flex:1;gap:3px;min-width:0;display:flex}.-fImJG_itemRow{justify-content:space-between;align-items:baseline;gap:8px;display:flex}.-fImJG_name{white-space:nowrap;text-overflow:ellipsis;font-size:15px;font-weight:500;overflow:hidden}.-fImJG_time{color:#9a9a9a;flex-shrink:0;font-size:11px}.-fImJG_preview{color:#8f8f8f;white-space:nowrap;text-overflow:ellipsis;font-size:12px;overflow:hidden}.-fImJG_footer{background:#f0f0f0;border-top:1px solid #e0e0e0;align-items:center;padding:10px 12px;display:flex}.-fImJG_gear{color:#000;cursor:pointer;background:#e4e4e4;border:none;border-radius:8px;flex:1;justify-content:center;align-items:center;gap:6px;padding:9px 0;font-family:inherit;font-size:14px;font-weight:600;display:inline-flex}.-fImJG_gear:hover{background:#d5d5d5}.-fImJG_gearIcon{color:#333;font-size:16px}.-fImJG_gearLabel{letter-spacing:1px}.-fImJG_menu{z-index:50;background:#fff;border:1px solid #e0e0e0;border-radius:8px;min-width:150px;padding:4px 0;position:fixed;box-shadow:0 6px 18px #00000024}.-fImJG_menuItem{text-align:left;cursor:pointer;color:#1f1f1f;background:0 0;border:none;width:100%;padding:10px 16px;font-family:inherit;font-size:13px}.-fImJG_menuItem:hover{color:#07c160;background:#f0f6ff}.-fImJG_menuDanger{color:#d9534f;border-top:1px solid #f0f0f0;margin-top:4px}.-fImJG_menuDanger:hover{color:#c9302c;background:#fdecea}.-fImJG_rail{box-sizing:border-box;flex-direction:column;align-items:center;gap:10px;height:100%;padding:16px 0;display:flex}.-fImJG_railButton{color:#333;cursor:pointer;background:#ececec;border:none;border-radius:10px;justify-content:center;align-items:center;width:38px;height:38px;font-size:17px;display:flex}.-fImJG_railButton:hover{background:#ddd}";
		const tagId = "dsh-client-ui-girlfriend/FriendList.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-client-ui-girlfriend";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var FriendList_module_css_default = {
			"header": "-fImJG_header",
			"root": "-fImJG_root",
			"emptyAction": "-fImJG_emptyAction",
			"addButton": "-fImJG_addButton",
			"preview": "-fImJG_preview",
			"emptyText": "-fImJG_emptyText",
			"gear": "-fImJG_gear",
			"gearIcon": "-fImJG_gearIcon",
			"list": "-fImJG_list",
			"item": "-fImJG_item",
			"avatarImg": "-fImJG_avatarImg",
			"itemBody": "-fImJG_itemBody",
			"time": "-fImJG_time",
			"menu": "-fImJG_menu",
			"menuItem": "-fImJG_menuItem",
			"menuDanger": "-fImJG_menuDanger",
			"rail": "-fImJG_rail",
			"avatarFallback": "-fImJG_avatarFallback",
			"name": "-fImJG_name",
			"empty": "-fImJG_empty",
			"railButton": "-fImJG_railButton",
			"emptyEmoji": "-fImJG_emptyEmoji",
			"itemRow": "-fImJG_itemRow",
			"gearLabel": "-fImJG_gearLabel",
			"footer": "-fImJG_footer",
			"title": "-fImJG_title"
		};
		//#endregion
		//#region src/client/FriendList.tsx
		/**
		* The WeChat-like friend list, occupying the layout's `'sidebar'` slot. Shows
		* every girlfriend character with portrait + last message + time; left click
		* opens the chat, right click opens a small character-settings menu. The
		* bottom row carries the settings gear (左下角设置) and the top row the
		* add-friend button. Everything arrives through the shared `useModel` hook.
		*/
		function Avatar(props) {
			const { character } = props;
			const size = props.size ?? 44;
			if (character.avatarPath !== void 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
				className: FriendList_module_css_default.avatarImg,
				style: {
					width: size,
					height: size
				},
				src: assetUrl(character.avatarPath),
				alt: character.name,
				draggable: false
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: FriendList_module_css_default.avatarFallback,
				style: {
					width: size,
					height: size,
					fontSize: size * .42
				},
				children: character.name.slice(0, 1)
			});
		}
		function FriendList(props) {
			const { useModel, actions, collapsed } = props;
			const characters = useModel((s) => s.characters);
			const view = useModel((s) => s.view);
			const [menu, setMenu] = (0, react.useState)(null);
			const [confirmingDelete, setConfirmingDelete] = (0, react.useState)(false);
			const menuRef = (0, react.useRef)(null);
			const closeMenu = (0, react.useCallback)(() => {
				setMenu(null);
				setConfirmingDelete(false);
			}, []);
			(0, react.useEffect)(() => {
				if (menu === null) return;
				const onDown = (event) => {
					if (menuRef.current === null || !menuRef.current.contains(event.target)) closeMenu();
				};
				window.addEventListener("mousedown", onDown);
				return () => window.removeEventListener("mousedown", onDown);
			}, [menu, closeMenu]);
			const onContextMenu = (0, react.useCallback)((event, character) => {
				event.preventDefault();
				setConfirmingDelete(false);
				setMenu({
					x: event.clientX,
					y: event.clientY,
					character
				});
			}, []);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: FriendList_module_css_default.root,
				"data-collapsed": collapsed || void 0,
				children: [collapsed ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: FriendList_module_css_default.rail,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: FriendList_module_css_default.railButton,
						title: "添加好友",
						onClick: () => actions.openCreate(),
						children: "＋"
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: FriendList_module_css_default.railButton,
						title: "设置（对话 / 视觉 / 文生图 / 文生视频 API）",
						onClick: () => actions.openSettings(),
						children: "⚙"
					})]
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: FriendList_module_css_default.header,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: FriendList_module_css_default.title,
							children: "我的女友"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							className: FriendList_module_css_default.addButton,
							type: "button",
							title: "添加好友",
							onClick: () => actions.openCreate(),
							children: "＋"
						})]
					}),
					characters.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: FriendList_module_css_default.empty,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: FriendList_module_css_default.emptyEmoji,
								children: "💖"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: FriendList_module_css_default.emptyText,
								children: "还没有好友"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: FriendList_module_css_default.emptyAction,
								type: "button",
								onClick: () => actions.openCreate(),
								children: "点这里添加你的第一位女友"
							})
						]
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
						className: FriendList_module_css_default.list,
						children: characters.map((character) => {
							const active = view.kind === "chat" && view.characterId === character.id;
							return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: FriendList_module_css_default.item,
								"data-active": active || void 0,
								onClick: () => actions.openChat(character.id),
								onContextMenu: (event) => onContextMenu(event, character),
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Avatar, { character }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: FriendList_module_css_default.itemBody,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: FriendList_module_css_default.itemRow,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: FriendList_module_css_default.name,
											children: character.name
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: FriendList_module_css_default.time,
											children: formatTime(character.lastTime)
										})]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: FriendList_module_css_default.preview,
										children: character.lastMessage
									})]
								})]
							}) }, character.id);
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: FriendList_module_css_default.footer,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: FriendList_module_css_default.gear,
							title: "系统设置（对话 / 视觉 / 文生图 / 文生视频 API）",
							onClick: () => actions.openSettings(),
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: FriendList_module_css_default.gearIcon,
								"aria-hidden": true,
								children: "⚙"
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: FriendList_module_css_default.gearLabel,
								children: "系统设置"
							})]
						})
					})
				] }), menu !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					ref: menuRef,
					className: FriendList_module_css_default.menu,
					style: {
						left: menu.x,
						top: menu.y
					},
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: FriendList_module_css_default.menuItem,
						onClick: () => {
							actions.openEdit(menu.character.id);
							closeMenu();
						},
						children: "编辑人物设定"
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: `${FriendList_module_css_default.menuItem} ${FriendList_module_css_default.menuDanger}`,
						onClick: () => {
							if (!confirmingDelete) {
								setConfirmingDelete(true);
								return;
							}
							actions.deleteCharacter(menu.character.id);
							closeMenu();
						},
						children: confirmingDelete ? "确认删除？再次点击确认" : "删除好友"
					})]
				})]
			});
		}
		//#endregion
		//#region src/client/markdown.ts
		const AVATAR_DIR = "images";
		function avatarRelPath(id) {
			return `${AVATAR_DIR}/${id}.png`;
		}
		/** Split the `## ` sections of a profile into a heading → body map. */
		function sections(markdown) {
			const map = /* @__PURE__ */ new Map();
			let current = null;
			let buffer = [];
			const flush = () => {
				if (current !== null) map.set(current, buffer.join("\n").trim());
			};
			for (const line of markdown.split("\n")) {
				const match = line.match(/^##\s+(.+?)\s*$/);
				if (match !== null) {
					flush();
					current = match[1]?.trim() ?? null;
					buffer = [];
				} else if (current !== null) buffer.push(line);
			}
			flush();
			return map;
		}
		function section(markdown, heading) {
			return sections(markdown).get(heading) ?? "";
		}
		function keyValue(markdown, key) {
			const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			return markdown.match(new RegExp(`^[-*]\\s*${escaped}:\\s*(.*)$`, "m"))?.[1]?.trim() ?? "";
		}
		/**
		* Serialize a character into its Markdown profile.
		* @param character - the character to record.
		* @returns Markdown text.
		*/
		function serializeCharacter(character) {
			const lines = [];
			lines.push(`# ${character.name}`);
			lines.push("");
			lines.push(`> 由 DSH AI 女友助手维护 · 角色ID：${character.id} · 更新于 ${new Date(character.updatedAt).toLocaleString("zh-CN")}`);
			lines.push("");
			lines.push("## 基础信息");
			lines.push(`- 名字: ${character.name}`);
			lines.push(`- 角色ID: ${character.id}`);
			lines.push("");
			lines.push("## 外形参数");
			lines.push(character.appearance.trim() || "（无）");
			lines.push("");
			lines.push("## 性格");
			lines.push(character.personality.trim() || "（无）");
			lines.push("");
			lines.push("## 爱好");
			lines.push(character.hobbies.trim() || "（无）");
			lines.push("");
			lines.push("## 对话语气");
			lines.push(character.tone.trim() || "（无）");
			lines.push("");
			lines.push("## 角色背景");
			lines.push(character.background.trim() || "（无）");
			if (character.note.trim() !== "") {
				lines.push("");
				lines.push("## 补充说明");
				lines.push(character.note.trim());
			}
			lines.push("");
			lines.push("## 肖像图");
			lines.push(character.avatarPath !== void 0 ? character.avatarPath : "（未生成）");
			lines.push("");
			return lines.join("\n");
		}
		/**
		* Parse a Markdown profile back into character form values plus the portrait
		* path. Ordering of the `##` sections is free; missing sections are empty.
		* @param markdown - profile text.
		* @returns parsed values (name may be empty when the file is malformed).
		*/
		function parseCharacter(markdown) {
			const title = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "";
			const avatar = section(markdown, "肖像图");
			return {
				name: keyValue(markdown, "名字") || title,
				appearance: section(markdown, "外形参数"),
				personality: section(markdown, "性格"),
				hobbies: section(markdown, "爱好"),
				tone: section(markdown, "对话语气"),
				background: section(markdown, "角色背景"),
				note: section(markdown, "补充说明"),
				...avatar !== "" && avatar !== "（未生成）" ? { avatarPath: avatar } : {}
			};
		}
		/** Extract the character id embedded in a profile file. */
		function parseCharacterId(markdown) {
			const raw = keyValue(markdown, "角色ID");
			return raw !== "" ? raw : void 0;
		}
		//#endregion
		//#region src/client/model.ts
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
		const LS_SETTINGS = "dsh.girlfriend.settings.v1";
		const LS_CHARACTERS = "dsh.girlfriend.characters.v1";
		const LS_MESSAGES = "dsh.girlfriend.messages.v1";
		function readJson(key, fallback) {
			try {
				const raw = localStorage.getItem(key);
				return raw === null ? fallback : JSON.parse(raw);
			} catch {
				return fallback;
			}
		}
		function writeJson(key, value) {
			try {
				localStorage.setItem(key, JSON.stringify(value));
			} catch {}
		}
		/** Tail of recent messages as chat-completion payloads (text only). */
		function recentTextMessages(messages, limit) {
			const picked = [];
			for (let i = messages.length - 1; i >= 0 && picked.length < limit; i -= 1) {
				const message = messages[i];
				if (message === void 0) continue;
				if (message.kind === "image") picked.push({
					role: "assistant",
					content: `[图片] ${message.content}`
				});
				else if (message.kind === "video") picked.push({
					role: "assistant",
					content: `[视频] ${message.content}`
				});
				else if (message.kind === "photo") picked.push({
					role: "user",
					content: `[我发来一张照片] ${message.content}${message.analysis !== void 0 ? ` 照片内容：${message.analysis}` : ""}`
				});
				else picked.push({
					role: message.role === "user" ? "user" : "assistant",
					content: message.content
				});
			}
			return picked.reverse();
		}
		/** Build an image/video prompt for the selected character from recent context. */
		async function deriveMediaPrompt(character, messages, kind, settings, callChat) {
			const context = recentTextMessages(messages, 4);
			const lastUser = [...context].reverse().find((m) => m.role === "user")?.content ?? "";
			const fallback = kind === "image" ? `给「${character.name}」拍一张生活照。人物设定：${character.appearance}，${character.personality}。画面氛围围绕：${lastUser.slice(0, 120) || character.background.slice(0, 120) || "温馨日常"}。写实摄影风格，自然光线，高质量。` : `为「${character.name}」生成一段 5 秒生活短视频。人物设定：${character.appearance}，${character.personality}。画面内容围绕：${lastUser.slice(0, 120) || character.background.slice(0, 120) || "温馨日常"}。真实人物动作，自然运镜，高清。`;
			if (!profileConfigured(settings.chat)) return fallback;
			const system = kind === "image" ? "你是短视频/照片画面的提示词专家。根据对话上下文，用中文写一段用于生成一张照片的提示词(50 字以内，描写画面内容与氛围)，只输出提示词本身。" : "你是短视频/照片画面的提示词专家。根据对话上下文，用中文写一段用于生成一段短视频的提示词(80 字以内，描写人物动作与运镜)，只输出提示词本身。";
			try {
				const trimmed = (await callChat({
					baseUrl: settings.chat.baseUrl,
					apiKey: settings.chat.apiKey,
					model: settings.chat.model,
					messages: [{
						role: "system",
						content: system
					}, ...context.slice(-4).map((m) => ({
						role: m.role,
						content: m.content
					}))],
					temperature: .7
				})).trim();
				return trimmed.length > 0 ? trimmed : fallback;
			} catch {
				return fallback;
			}
		}
		function mediaPreview(message) {
			if (message.kind === "image") return "[图片] 刚刚生成了一张照片";
			if (message.kind === "video") return "[视频] 刚刚生成了一段视频";
			if (message.kind === "photo") return "[照片] 我发来一张照片";
			return message.content;
		}
		/** The observable app model (HostObservable<AppState> + actions). */
		var GirlfriendModel = class {
			state;
			snapshot;
			listeners = /* @__PURE__ */ new Set();
			constructor() {
				const settings = readJson(LS_SETTINGS, emptySettings());
				const cached = readJson(LS_CHARACTERS, []);
				const messages = readJson(LS_MESSAGES, {});
				const characters = cached.map((c) => ({ ...c }));
				this.state = {
					settings,
					characters,
					messages,
					view: {
						kind: "chat",
						characterId: ""
					},
					toasts: [],
					busy: {}
				};
				this.snapshot = this.state;
				this.hydrateFromFiles();
			}
			getSnapshot() {
				return this.snapshot;
			}
			subscribe(fn) {
				this.listeners.add(fn);
				return () => {
					this.listeners.delete(fn);
				};
			}
			/** Publish a state change to subscribers. Durability is explicit: callers
			* that change persona/messages/settings follow up with {@link persist}. */
			commit(patch) {
				this.state = {
					...this.state,
					...patch
				};
				this.snapshot = this.state;
				for (const listener of this.listeners) listener();
			}
			persist() {
				writeJson(LS_SETTINGS, this.state.settings);
				writeJson(LS_CHARACTERS, this.state.characters.map((c) => ({
					id: c.id,
					name: c.name,
					appearance: c.appearance,
					personality: c.personality,
					hobbies: c.hobbies,
					tone: c.tone,
					background: c.background,
					note: c.note,
					createdAt: c.createdAt,
					updatedAt: c.updatedAt,
					lastMessage: c.lastMessage,
					...c.avatarPath !== void 0 ? { avatarPath: c.avatarPath } : {},
					...c.lastTime !== void 0 ? { lastTime: c.lastTime } : {}
				})));
				writeJson(LS_MESSAGES, this.state.messages);
			}
			toast(text, kind = "warn") {
				const item = {
					id: crypto.randomUUID(),
					text,
					kind
				};
				this.commit({ toasts: [...this.state.toasts, item] });
			}
			appendMessage(characterId, message) {
				const next = [...this.state.messages[characterId] ?? [], message].slice(-200);
				const messages = {
					...this.state.messages,
					[characterId]: next
				};
				this.commit({
					messages,
					characters: this.state.characters.map((c) => c.id === characterId ? {
						...c,
						lastMessage: mediaPreview(message),
						lastTime: message.time
					} : c)
				});
				this.persist();
			}
			chatSettingsPresent() {
				return profileConfigured(this.state.settings.chat);
			}
			chooseRecentForPrompt(characterId) {
				return (this.state.messages[characterId] ?? []).slice(-6);
			}
			openChat(characterId) {
				if (this.state.characters.some((c) => c.id === characterId)) this.commit({ view: {
					kind: "chat",
					characterId
				} });
			}
			openSettings() {
				this.commit({ view: { kind: "settings" } });
			}
			openCreate() {
				this.commit({ view: { kind: "create" } });
			}
			openEdit(characterId) {
				if (this.state.characters.some((c) => c.id === characterId)) this.commit({ view: {
					kind: "edit",
					characterId
				} });
			}
			/** Return to the most recently opened chat, or the empty hero. */
			goBack() {
				this.commit({ view: {
					kind: "chat",
					characterId: this.state.characters[0]?.id ?? ""
				} });
			}
			saveSettings(settings) {
				this.commit({ settings });
				this.persist();
				this.toast("设置已保存", "info");
			}
			dismissToast(id) {
				this.commit({ toasts: this.state.toasts.filter((t) => t.id !== id) });
			}
			async sendChat(characterId, text) {
				const character = this.state.characters.find((c) => c.id === characterId);
				const trimmed = text.trim();
				if (character === void 0 || trimmed === "") return;
				if (this.state.busy.chat === true) return;
				if (!this.chatSettingsPresent()) {
					this.toast("对话模型 API 未配置，请先点击左下角「设置」配置后再聊天");
					return;
				}
				this.appendMessage(characterId, newMessage("user", "text", trimmed));
				this.commit({ busy: {
					...this.state.busy,
					chat: true
				} });
				try {
					const history = this.chooseRecentForPrompt(characterId);
					const reply = await chatCall({
						baseUrl: this.state.settings.chat.baseUrl,
						apiKey: this.state.settings.chat.apiKey,
						model: this.state.settings.chat.model,
						messages: [{
							role: "system",
							content: buildPersonaPrompt(this.state.characters.find((c) => c.id === characterId) ?? character)
						}, ...recentTextMessages(history, 12).map((m) => ({
							role: m.role,
							content: m.content
						}))],
						temperature: .8
					});
					this.appendMessage(characterId, newMessage("girlfriend", "text", reply.trim()));
				} catch (error) {
					this.toast(`对话失败: ${error instanceof Error ? error.message : String(error)}`, "error");
				} finally {
					this.commit({ busy: {
						...this.state.busy,
						chat: false
					} });
				}
			}
			/** 发张照片：按最近上下文生成一张照片并以消息发出。 */
			async generateImageMessage(characterId) {
				const character = this.state.characters.find((c) => c.id === characterId);
				if (character === void 0) return;
				if (this.state.busy.image === true) return;
				if (!profileConfigured(this.state.settings.image)) {
					this.toast("文生图 API 未配置，请先点击左下角「设置」配置");
					return;
				}
				this.commit({ busy: {
					...this.state.busy,
					image: true
				} });
				try {
					const prompt = await deriveMediaPrompt(character, this.chooseRecentForPrompt(characterId), "image", this.state.settings, chatCall);
					const dataUrl = await imageCall(this.state.settings.image.baseUrl, this.state.settings.image.apiKey, this.state.settings.image.model, prompt, "1024x1024");
					this.appendMessage(characterId, {
						...newMessage("girlfriend", "image", prompt),
						mediaUrl: dataUrl
					});
				} catch (error) {
					this.toast(`生成照片失败: ${error instanceof Error ? error.message : String(error)}`, "error");
				} finally {
					this.commit({ busy: {
						...this.state.busy,
						image: false
					} });
				}
			}
			/** 发个视频：按最近上下文生成一段视频并以消息发出。 */
			async generateVideoMessage(characterId) {
				const character = this.state.characters.find((c) => c.id === characterId);
				if (character === void 0) return;
				if (this.state.busy.video === true) return;
				if (!profileConfigured(this.state.settings.video)) {
					this.toast("文生视频 API 未配置，请先点击左下角「设置」配置");
					return;
				}
				this.commit({ busy: {
					...this.state.busy,
					video: true
				} });
				try {
					const prompt = await deriveMediaPrompt(character, this.chooseRecentForPrompt(characterId), "video", this.state.settings, chatCall);
					const url = await videoCall(this.state.settings.video, prompt);
					this.appendMessage(characterId, {
						...newMessage("girlfriend", "video", prompt),
						mediaUrl: url
					});
				} catch (error) {
					this.toast(`生成视频失败: ${error instanceof Error ? error.message : String(error)}`, "error");
				} finally {
					this.commit({ busy: {
						...this.state.busy,
						video: false
					} });
				}
			}
			/** 上传照片：视觉语言模型分析 → 角色结合上下文回复。 */
			async uploadPhoto(characterId, file) {
				const character = this.state.characters.find((c) => c.id === characterId);
				if (character === void 0 || this.state.busy.photo === true) return;
				if (!profileConfigured(this.state.settings.vlm)) {
					this.toast("视觉语言模型 API 未配置，无法分析照片，请先配置");
					return;
				}
				let dataUrl;
				try {
					dataUrl = await new Promise((resolve, reject) => {
						const reader = new FileReader();
						reader.onload = () => resolve(String(reader.result));
						reader.onerror = () => reject(/* @__PURE__ */ new Error("读取文件失败"));
						reader.readAsDataURL(file);
					});
				} catch (error) {
					this.toast(`读取照片失败: ${error instanceof Error ? error.message : String(error)}`, "error");
					return;
				}
				this.commit({ busy: {
					...this.state.busy,
					photo: true
				} });
				try {
					const analysis = await chatCall({
						baseUrl: this.state.settings.vlm.baseUrl,
						apiKey: this.state.settings.vlm.apiKey,
						model: this.state.settings.vlm.model,
						messages: [{
							role: "user",
							content: [{
								type: "text",
								text: "请仔细观察这张照片，用中文描述照片里的内容：人物、场景、动作、物品和氛围。不要评价照片本身，只描述内容。"
							}, {
								type: "image_url",
								image_url: { url: dataUrl }
							}]
						}],
						temperature: .3
					});
					this.appendMessage(characterId, {
						...newMessage("user", "photo", "（我发来一张照片）"),
						mediaUrl: dataUrl,
						analysis: analysis.trim()
					});
					if (!this.chatSettingsPresent()) {
						this.toast("照片已分析，但对话模型 API 未配置，无法让角色回应");
						return;
					}
					const recent = this.chooseRecentForPrompt(characterId);
					const reply = await chatCall({
						baseUrl: this.state.settings.chat.baseUrl,
						apiKey: this.state.settings.chat.apiKey,
						model: this.state.settings.chat.model,
						messages: [
							{
								role: "system",
								content: buildPersonaPrompt(this.state.characters.find((c) => c.id === characterId) ?? character)
							},
							...recentTextMessages(recent, 10).map((m) => ({
								role: m.role,
								content: m.content
							})),
							{
								role: "user",
								content: `（我刚刚给你发来一张照片，照片内容描述如下：${analysis.trim()}）请用你的人设和语气，自然地回应这张照片。`
							}
						],
						temperature: .85
					});
					this.appendMessage(characterId, newMessage("girlfriend", "text", reply.trim()));
				} catch (error) {
					this.toast(`分析照片失败: ${error instanceof Error ? error.message : String(error)}`, "error");
				} finally {
					this.commit({ busy: {
						...this.state.busy,
						photo: false
					} });
				}
			}
			/** 生成一张肖像预览图；返回 data URL，失败返回空字符串（已弹出提醒）。 */
			async generatePortrait(values) {
				if (!profileConfigured(this.state.settings.image)) {
					this.toast("文生图 API 未配置，无法生成肖像图，请先点击左下角「设置」配置");
					return "";
				}
				this.commit({ busy: {
					...this.state.busy,
					portrait: true
				} });
				try {
					const prompt = [
						`为「${values.name.trim() || "一个女孩"}」生成一张半身肖像照（竖版）。`,
						`外形参数：${values.appearance.trim() || "清纯可爱"}。`,
						`性格气质：${values.personality.trim() || "温柔"}。`,
						"真实照片风格，柔和自然光线，面部特写，背景虚化，高清精致。"
					].join("\n");
					return await imageCall(this.state.settings.image.baseUrl, this.state.settings.image.apiKey, this.state.settings.image.model, prompt, "1024x1024");
				} catch (error) {
					this.toast(`生成肖像失败: ${error instanceof Error ? error.message : String(error)}`, "error");
					return "";
				} finally {
					this.commit({ busy: {
						...this.state.busy,
						portrait: false
					} });
				}
			}
			/** Record one character (MD file + portrait asset), then open her chat. */
			async addCharacter(values, portraitDataUrl) {
				if (values.name.trim() === "") {
					this.toast("请先填写名字");
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
					lastMessage: "（你们刚刚认识）"
				};
				if (portraitDataUrl !== void 0 && portraitDataUrl !== "") try {
					await fsSaveAsset(avatarRelPath(id), portraitDataUrl);
					character.avatarPath = avatarRelPath(id);
				} catch (error) {
					this.toast(`保存肖像图失败: ${error instanceof Error ? error.message : String(error)}`, "error");
				}
				try {
					await fsWrite(`${id}.md`, serializeCharacter(character));
				} catch (error) {
					this.toast(`写入角色设定文件失败: ${error instanceof Error ? error.message : String(error)}`, "error");
				}
				this.commit({
					characters: [...this.state.characters, character],
					view: {
						kind: "chat",
						characterId: id
					}
				});
				this.persist();
				this.toast(`已添加好友「${character.name}」`, "info");
			}
			/** Update an existing character (MD file rewritten; optional new portrait). */
			async updateCharacter(id, values, portraitDataUrl) {
				const existing = this.state.characters.find((c) => c.id === id);
				if (existing === void 0) return;
				if (values.name.trim() === "") {
					this.toast("名字不能为空");
					return;
				}
				const character = {
					...existing,
					...values,
					name: values.name.trim(),
					updatedAt: Date.now()
				};
				if (portraitDataUrl !== void 0 && portraitDataUrl !== "") try {
					await fsSaveAsset(avatarRelPath(id), portraitDataUrl);
					character.avatarPath = avatarRelPath(id);
				} catch (error) {
					this.toast(`保存肖像图失败: ${error instanceof Error ? error.message : String(error)}`, "error");
				}
				try {
					await fsWrite(`${id}.md`, serializeCharacter(character));
				} catch (error) {
					this.toast(`写入角色设定文件失败: ${error instanceof Error ? error.message : String(error)}`, "error");
				}
				this.commit({ characters: this.state.characters.map((c) => c.id === id ? character : c) });
				this.persist();
				this.toast(`已保存「${character.name}」的设定`, "info");
			}
			/** Delete a character: chat history and portrait are dropped, the Markdown
			* profile and portrait asset are removed from the host data directory. */
			async deleteCharacter(id) {
				const character = this.state.characters.find((c) => c.id === id);
				if (character === void 0) return;
				try {
					await fsDelete(`${id}.md`);
				} catch {}
				if (character.avatarPath !== void 0) try {
					await fsDelete(character.avatarPath);
				} catch {}
				const messages = { ...this.state.messages };
				delete messages[id];
				const characters = this.state.characters.filter((c) => c.id !== id);
				const view = this.state.view.kind === "chat" && this.state.view.characterId === id ? {
					kind: "chat",
					characterId: characters[0]?.id ?? ""
				} : this.state.view;
				this.commit({
					characters,
					messages,
					view
				});
				this.persist();
				this.toast(`已删除「${character.name}」`, "info");
			}
			/**
			* Boot reconciliation: Markdown profile files are the source of truth for
			* persona fields and portraits; this merges them over the local cache when
			* host file access is available.
			*/
			async hydrateFromFiles() {
				let names;
				try {
					names = await fsList();
				} catch (error) {
					this.toast(`角色数据目录读取失败，将使用本地缓存: ${error instanceof Error ? error.message : String(error)}`, "error");
					return;
				}
				if (names.length === 0) return;
				const merged = new Map(this.state.characters.map((c) => [c.id, c]));
				let loaded = 0;
				for (const file of names.sort((a, b) => a.updatedAt - b.updatedAt)) try {
					const content = await fsRead(file.name);
					const parsed = parseCharacter(content);
					const id = parseCharacterId(content) ?? file.name.replace(/\.md$/, "");
					const existing = merged.get(id);
					const now = Date.now();
					const updated = {
						...existing ?? {
							id,
							createdAt: now,
							lastMessage: "（你们刚刚认识）"
						},
						...parsed,
						id,
						updatedAt: now
					};
					merged.set(id, updated);
					loaded += 1;
				} catch {}
				if (loaded === 0) return;
				const characters = [...merged.values()].sort((a, b) => (b.lastTime ?? b.createdAt) - (a.lastTime ?? a.createdAt));
				this.commit({ characters });
				this.persist();
				this.toast(`已从设定文件恢复 ${String(loaded)} 位好友`, "info");
			}
		};
		/** Create the shared model (one instance per plugin load). */
		function createModel() {
			return new GirlfriendModel();
		}
		//#endregion
		//#region src/client/index.ts
		/** Services required by the client half. */
		const inject = ["slots"];
		/**
		* Client plugin body: mount the two companion entries.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			const model = createModel();
			ctx.effect(() => {
				const disposeFriends = ctx.slots.register({
					name: "sidebar",
					priority: -1,
					inject: () => ({
						hooks: { model },
						actions: model
					}),
					registrant: "ui-girlfriend"
				}, FriendList);
				const disposeDialog = ctx.slots.register({
					name: "conversation",
					priority: -1,
					inject: () => ({
						hooks: { model },
						actions: model
					}),
					registrant: "ui-girlfriend"
				}, ChatPanel);
				return () => {
					disposeFriends();
					disposeDialog();
				};
			}, "ui-girlfriend: companion entries");
		}
		//#endregion
		exports.GirlfriendModel = GirlfriendModel;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map