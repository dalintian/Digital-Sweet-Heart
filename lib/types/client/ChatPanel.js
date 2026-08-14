import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * The right-hand companion surface, occupying the layout's `'conversation'`
 * slot: the WeChat-like chat dialog, the four-API settings view, and the
 * character create/edit form with portrait generation. All business data and
 * actions come from the shared model through `useModel`/`actions`; local
 * state is limited to ephemeral form/input content.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { assetUrl } from "./host-api.js";
import { formatTime, profileConfigured, } from "./types.js";
import css from './ChatPanel.module.css';
// ---------------------------------------------------------------- toasts --
function ToastStack(props) {
    const { useModel, actions } = props;
    const toasts = useModel(s => s.toasts);
    useEffect(() => {
        const timers = toasts.map(toast => window.setTimeout(() => actions.dismissToast(toast.id), 4200));
        return () => { for (const timer of timers)
            window.clearTimeout(timer); };
    }, [toasts, actions]);
    if (toasts.length === 0)
        return null;
    return (_jsx("div", { className: css.toasts, children: toasts.map(toast => (_jsx("button", { type: "button", className: css.toast, "data-kind": toast.kind, onClick: () => actions.dismissToast(toast.id), children: toast.text }, toast.id))) }));
}
// ------------------------------------------------------------- chat view --
function ChatView(props) {
    const { useModel, actions, character } = props;
    const messages = useModel(s => s.messages[character.id] ?? []);
    const busy = useModel(s => s.busy);
    const [draft, setDraft] = useState('');
    const fileRef = useRef(null);
    const scrollRef = useRef(null);
    const tail = useMemo(() => messages.length, [messages]);
    useEffect(() => {
        const el = scrollRef.current;
        if (el !== null)
            el.scrollTop = el.scrollHeight;
    }, [tail, busy.chat, busy.image, busy.video, busy.photo]);
    const send = () => {
        if (draft.trim() === '' || busy.chat === true)
            return;
        void actions.sendChat(character.id, draft);
        setDraft('');
    };
    return (_jsxs("div", { className: css.chatView, children: [_jsxs("div", { className: css.chatHeader, children: [_jsx("div", { className: css.chatHeaderAvatar, children: character.avatarPath !== undefined
                            ? _jsx("img", { src: assetUrl(character.avatarPath), alt: character.name })
                            : _jsx("span", { children: character.name.slice(0, 1) }) }), _jsxs("div", { className: css.chatHeaderBody, children: [_jsx("div", { className: css.chatHeaderName, children: character.name }), _jsx("div", { className: css.chatHeaderStatus, children: busy.chat === true ? '正在输入…' : '在线' })] }), _jsx("button", { type: "button", className: css.headerEdit, onClick: () => actions.openEdit(character.id), children: "\u8BBE\u5B9A" })] }), _jsxs("div", { className: css.messages, ref: scrollRef, children: [messages.length === 0 && (_jsxs("div", { className: css.chatEmpty, children: [_jsx("div", { className: css.chatEmptyEmoji, children: "\uD83D\uDCAC" }), _jsxs("div", { children: ["\u548C\u300C", character.name, "\u300D\u6253\u4E2A\u62DB\u547C\u5427\uFF5E"] })] })), messages.map(message => (_jsx(MessageBubble, { message: message, character: character }, message.id)))] }), _jsxs("div", { className: css.composer, children: [_jsxs("div", { className: css.composerInputRow, children: [_jsx("textarea", { className: css.composerInput, value: draft, placeholder: `对「${character.name}」说点什么…（Enter 发送，Shift+Enter 换行）`, rows: 1, onChange: event => setDraft(event.target.value), onKeyDown: event => {
                                    if (event.key === 'Enter' && !event.shiftKey) {
                                        event.preventDefault();
                                        send();
                                    }
                                } }), _jsx("button", { type: "button", className: css.sendButton, disabled: draft.trim() === '' || busy.chat === true, onClick: send, title: "\u53D1\u9001", children: busy.chat === true ? '…' : '➤' })] }), _jsxs("div", { className: css.composerTools, children: [_jsxs("button", { type: "button", className: css.toolButton, disabled: busy.image === true, onClick: () => void actions.generateImageMessage(character.id), children: ["\uD83D\uDCF7 ", busy.image === true ? '正在生成照片…' : '发张照片'] }), _jsxs("button", { type: "button", className: css.toolButton, disabled: busy.video === true, onClick: () => void actions.generateVideoMessage(character.id), children: ["\uD83C\uDFAC ", busy.video === true ? '正在生成视频…' : '发个视频'] }), _jsxs("button", { type: "button", className: css.toolButton, disabled: busy.photo === true, onClick: () => fileRef.current?.click(), children: ["\u2B06\uFE0F ", busy.photo === true ? '正在分析照片…' : '上传照片'] }), _jsx("input", { ref: fileRef, type: "file", accept: "image/*", hidden: true, onChange: event => {
                                    const file = event.target.files?.[0];
                                    if (file !== undefined)
                                        void actions.uploadPhoto(character.id, file);
                                    event.target.value = '';
                                } })] })] })] }));
}
function MessageBubble(props) {
    const { message, character } = props;
    const mine = message.role === 'girlfriend';
    return (_jsxs("div", { className: css.bubbleRow, "data-side": mine ? 'left' : 'right', children: [mine && (_jsx("div", { className: css.bubbleAvatar, children: character.avatarPath !== undefined
                    ? _jsx("img", { src: assetUrl(character.avatarPath), alt: character.name })
                    : _jsx("span", { children: character.name.slice(0, 1) }) })), _jsxs("div", { className: css.bubbleColumn, children: [message.kind === 'image' && message.mediaUrl !== undefined && (_jsxs("div", { className: css.mediaBubble, children: [_jsx("img", { className: css.mediaImg, src: message.mediaUrl, alt: message.content }), message.content !== '' && _jsx("div", { className: css.mediaCaption, children: message.content })] })), message.kind === 'video' && message.mediaUrl !== undefined && (_jsxs("div", { className: css.mediaBubble, children: [_jsx("video", { className: css.mediaVideo, src: message.mediaUrl, controls: true, preload: "metadata" }), message.content !== '' && _jsx("div", { className: css.mediaCaption, children: message.content })] })), message.kind === 'photo' && message.mediaUrl !== undefined && (_jsxs("div", { className: css.mediaBubble, children: [_jsx("img", { className: css.mediaImg, src: message.mediaUrl, alt: "\u7167\u7247" }), message.analysis !== undefined && (_jsxs("div", { className: css.photoAnalysis, children: ["\uD83D\uDD0D \u6211\u770B\u5230\u4E86\uFF1A", message.analysis] }))] })), message.kind === 'text' && message.content !== '' && (_jsx("div", { className: css.textBubble, children: message.content })), _jsx("div", { className: css.bubbleTime, children: formatTime(message.time) })] })] }));
}
function ProfileEditor(props) {
    const { title, emoji, profile, configured, pollPath, onChange, onPollPathChange } = props;
    return (_jsxs("div", { className: css.profileCard, "data-configured": configured || undefined, children: [_jsxs("div", { className: css.profileHeader, children: [_jsx("span", { className: css.profileEmoji, children: emoji }), _jsx("span", { className: css.profileTitle, children: title }), _jsx("span", { className: css.profileStatus, children: configured ? '已配置' : '未配置' })] }), _jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: "\u6A21\u578B\u540D" }), _jsx("input", { className: css.fieldInput, value: profile.model, placeholder: "\u5982 glm-4v-flash / gpt-4o / dall-e-3", onChange: event => onChange({ ...profile, model: event.target.value }) })] }), _jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: "API \u5730\u5740" }), _jsx("input", { className: css.fieldInput, value: profile.baseUrl, placeholder: "https://api.example.com/v1", onChange: event => onChange({ ...profile, baseUrl: event.target.value }) })] }), _jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: "API Key" }), _jsx("input", { className: css.fieldInput, type: "password", value: profile.apiKey, placeholder: "sk-\u2026", onChange: event => onChange({ ...profile, apiKey: event.target.value }) })] }), pollPath !== undefined && onPollPathChange !== undefined && (_jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: "\u4EFB\u52A1\u8F6E\u8BE2\u8DEF\u5F84(\u53EF\u9009)" }), _jsx("input", { className: css.fieldInput, value: pollPath, placeholder: "videos/generations", onChange: event => onPollPathChange(event.target.value) })] }))] }));
}
function SettingsView(props) {
    const { useModel, actions } = props;
    const saved = useModel(s => s.settings);
    const [form, setForm] = useState(() => ({
        chat: { ...saved.chat },
        vlm: { ...saved.vlm },
        image: { ...saved.image },
        video: { ...saved.video },
    }));
    const setChat = (next) => {
        setForm(prev => ({ ...prev, chat: { baseUrl: next.baseUrl, apiKey: next.apiKey, model: next.model } }));
    };
    const setVlm = (next) => {
        setForm(prev => ({ ...prev, vlm: { baseUrl: next.baseUrl, apiKey: next.apiKey, model: next.model } }));
    };
    const setImage = (next) => {
        setForm(prev => ({ ...prev, image: { baseUrl: next.baseUrl, apiKey: next.apiKey, model: next.model } }));
    };
    const setVideo = (next) => {
        setForm(prev => ({ ...prev, video: { ...next, pollPath: next.pollPath ?? 'videos/generations' } }));
    };
    return (_jsxs("div", { className: css.settingsView, children: [_jsxs("div", { className: css.settingsHeader, children: [_jsx("button", { type: "button", className: css.backButton, onClick: () => actions.goBack(), children: "\u2039 \u8FD4\u56DE" }), _jsx("span", { className: css.settingsTitle, children: "\u8BBE\u7F6E" }), _jsx("span", {})] }), _jsxs("div", { className: css.settingsIntro, children: ["\u4EE5\u4E0B\u56DB\u7EC4 API \u5206\u522B\u7528\u4E8E\u804A\u5929\u3001\u7167\u7247\u5206\u6790\u3001\u751F\u6210\u7167\u7247/\u8096\u50CF\u3001\u751F\u6210\u89C6\u9891\u3002\u63A5\u53E3\u9700\u517C\u5BB9 OpenAI \u683C\u5F0F \uFF08\u5BF9\u8BDD\u4E0E\u89C6\u89C9\u8D70 ", _jsx("code", { children: "/chat/completions" }), "\uFF0C\u751F\u56FE\u8D70 ", _jsx("code", { children: "/images/generations" }), "\uFF09\u3002 API Key \u4EC5\u4FDD\u5B58\u5728\u6D4F\u89C8\u5668\u672C\u5730\u3002"] }), _jsxs("div", { className: css.settingsBody, children: [_jsx(ProfileEditor, { title: "\u5BF9\u8BDD\u6A21\u578B", emoji: "\uD83D\uDCAC", profile: form.chat, configured: profileConfigured(form.chat), onChange: setChat }), _jsx(ProfileEditor, { title: "\u89C6\u89C9\u8BED\u8A00\u6A21\u578B", emoji: "\uD83D\uDC41\uFE0F", profile: form.vlm, configured: profileConfigured(form.vlm), onChange: setVlm }), _jsx(ProfileEditor, { title: "\u6587\u751F\u56FE\u6A21\u578B", emoji: "\uD83C\uDFA8", profile: form.image, configured: profileConfigured(form.image), onChange: setImage }), _jsx(ProfileEditor, { title: "\u6587\u751F\u89C6\u9891\u6A21\u578B", emoji: "\uD83C\uDFAC", profile: form.video, configured: profileConfigured(form.video), pollPath: form.video.pollPath, onPollPathChange: (pollPath) => setForm(prev => ({ ...prev, video: { ...prev.video, pollPath } })), onChange: setVideo })] }), _jsx("div", { className: css.settingsFooter, children: _jsx("button", { type: "button", className: css.primaryButton, onClick: () => actions.saveSettings(form), children: "\u4FDD\u5B58\u8BBE\u7F6E" }) })] }));
}
// ------------------------------------------------- character form --
const EMPTY_FORM = {
    name: '', appearance: '', personality: '', hobbies: '', tone: '', background: '', note: '',
};
function Field(props) {
    const { label, value, placeholder, rows, onChange } = props;
    const id = useMemo(() => `gf-${label}`, [label]);
    return (_jsxs("div", { className: css.formField, children: [_jsx("label", { className: css.formLabel, htmlFor: id, children: label }), rows === undefined ? (_jsx("input", { id: id, className: css.formInput, value: value, placeholder: placeholder, onChange: event => onChange(event.target.value) })) : (_jsx("textarea", { id: id, className: css.formTextarea, value: value, placeholder: placeholder, rows: rows, onChange: event => onChange(event.target.value) }))] }));
}
function CharacterFormView(props) {
    const { useModel, actions, mode } = props;
    const busy = useModel(s => s.busy);
    const character = mode === 'edit' ? props.character : undefined;
    const [values, setValues] = useState(() => (character === undefined
        ? { ...EMPTY_FORM }
        : {
            name: character.name, appearance: character.appearance, personality: character.personality,
            hobbies: character.hobbies, tone: character.tone, background: character.background,
            note: character.note,
        }));
    const [portrait, setPortrait] = useState(character?.avatarPath !== undefined
        ? assetUrl(character.avatarPath)
        : '');
    const setValue = (key) => (value) => {
        setValues(prev => ({ ...prev, [key]: value }));
    };
    const generate = async () => {
        const dataUrl = await actions.generatePortrait(values);
        if (dataUrl !== '')
            setPortrait(dataUrl);
    };
    const canSave = values.name.trim() !== '';
    return (_jsxs("div", { className: css.formView, children: [_jsxs("div", { className: css.settingsHeader, children: [_jsx("button", { type: "button", className: css.backButton, onClick: () => actions.goBack(), children: "\u2039 \u8FD4\u56DE" }), _jsx("span", { className: css.settingsTitle, children: mode === 'create' ? '添加好友 · 人物设定' : `编辑设定 · ${character?.name ?? ''}` }), _jsx("span", {})] }), _jsxs("div", { className: css.formBody, children: [_jsxs("div", { className: css.portraitPane, children: [_jsx("div", { className: css.portraitBox, children: portrait !== ''
                                    ? _jsx("img", { className: css.portraitImg, src: portrait, alt: "\u8096\u50CF\u9884\u89C8" })
                                    : _jsx("div", { className: css.portraitPlaceholder, children: "\uD83D\uDC69 \u751F\u6210\u8096\u50CF\u9884\u89C8" }) }), _jsxs("div", { className: css.portraitActions, children: [_jsx("button", { type: "button", className: css.primaryButton, disabled: busy.portrait === true, onClick: () => void generate(), children: busy.portrait === true ? '生成中…' : (portrait !== '' ? '不满意，重新生成' : '生成预览图') }), portrait !== '' && (_jsxs("div", { className: css.portraitHint, children: ["\u6EE1\u610F\u7684\u8BDD\u70B9\u53F3\u4E0B\u89D2\u300C", mode === 'create' ? '保存并添加为好友' : '保存修改', "\u300D\uFF0C\u8096\u50CF\u4F1A\u4FDD\u5B58\u4E3A\u89D2\u8272\u76F8\u7247\u3002"] }))] })] }), _jsxs("div", { className: css.formFields, children: [_jsx(Field, { label: "\u540D\u5B57", value: values.name, placeholder: "\u4F8B\u5982\uFF1A\u5C0F\u96C5", onChange: setValue('name') }), _jsx(Field, { label: "\u5916\u5F62\u53C2\u6570", value: values.appearance, placeholder: "\u4F8B\u5982\uFF1A\u9ED1\u8272\u957F\u53D1\uFF0C\u8EAB\u9AD8165cm\uFF0C\u7B11\u8D77\u6765\u6709\u9152\u7A9D\uFF0C\u559C\u6B22\u7A7F\u6D45\u8272\u8FDE\u8863\u88D9\u2026", rows: 2, onChange: setValue('appearance') }), _jsx(Field, { label: "\u6027\u683C", value: values.personality, placeholder: "\u4F8B\u5982\uFF1A\u6E29\u67D4\u4F53\u8D34\u3001\u5076\u5C14\u8C03\u76AE\u3001\u7C98\u4EBA\u4F46\u5F88\u4F1A\u7167\u987E\u4EBA\u2026", rows: 2, onChange: setValue('personality') }), _jsx(Field, { label: "\u7231\u597D", value: values.hobbies, placeholder: "\u4F8B\u5982\uFF1A\u753B\u753B\u3001\u542C\u6C11\u8C23\u3001\u505A\u751C\u70B9\u3001\u665A\u4E0A\u6563\u6B65\u2026", rows: 2, onChange: setValue('hobbies') }), _jsx(Field, { label: "\u5BF9\u8BDD\u8BED\u6C14", value: values.tone, placeholder: "\u4F8B\u5982\uFF1A\u7231\u6492\u5A07\u3001\u79F0\u547C\u6211\u4E3A\u300C\u4EB2\u7231\u7684\u300D\uFF0C\u53E5\u5C3E\u559C\u6B22\u52A0\u300C\u5440\u300D\u300C\u5566\u300D\u2026", rows: 2, onChange: setValue('tone') }), _jsx(Field, { label: "\u89D2\u8272\u80CC\u666F", value: values.background, placeholder: "\u4F8B\u5982\uFF1A\u6211\u4EEC\u662F\u5927\u5B66\u540C\u5B66\uFF0C\u5979\u6BD5\u4E1A\u540E\u505A\u4E86\u63D2\u753B\u5E08\uFF0C\u6211\u4EEC\u521A\u5728\u4E00\u8D77\u4E09\u4E2A\u6708\u2026", rows: 3, onChange: setValue('background') }), _jsx(Field, { label: "\u8865\u5145\u8BF4\u660E", value: values.note, placeholder: "\u5176\u5B83\u60F3\u8865\u5145\u7684\u8BBE\u5B9A\uFF08\u53EF\u9009\uFF09", rows: 2, onChange: setValue('note') })] })] }), _jsx("div", { className: css.formFooter, children: mode === 'create'
                    ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: css.ghostButton, onClick: () => void actions.addCharacter(values), children: "\u8DF3\u8FC7\u8096\u50CF\u56FE\uFF0C\u76F4\u63A5\u6DFB\u52A0" }), _jsx("button", { type: "button", className: css.primaryButton, disabled: !canSave, onClick: () => void actions.addCharacter(values, portrait === '' ? undefined : portrait), children: "\u6EE1\u610F\uFF0C\u4FDD\u5B58\u5E76\u6DFB\u52A0\u4E3A\u597D\u53CB" })] }))
                    : (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: css.primaryButton, disabled: !canSave, onClick: () => void actions.updateCharacter(character.id, values, portrait === '' ? undefined : portrait), children: "\u4FDD\u5B58\u4FEE\u6539" }), portrait !== '' && _jsx("div", { className: css.portraitHint, children: "\u4FDD\u5B58\u4FEE\u6539\u65F6\u4F1A\u540C\u65F6\u66F4\u65B0\u8BBE\u5B9A\u6587\u4EF6\u5E76\u4FDD\u5B58\u5F53\u524D\u8096\u50CF\u3002" })] })) })] }));
}
// ------------------------------------------------------------- shell --
export function ChatPanel(props) {
    const { useModel } = props;
    const view = useModel(s => s.view);
    const characters = useModel(s => s.characters);
    let body;
    if (view.kind === 'settings') {
        body = _jsx(SettingsView, { ...props });
    }
    else if (view.kind === 'create') {
        body = _jsx(CharacterFormView, { ...props, mode: "create" });
    }
    else if (view.kind === 'edit') {
        const character = characters.find(c => c.id === view.characterId);
        body = character === undefined
            ? _jsx(SettingsView, { ...props })
            : _jsx(CharacterFormView, { ...props, mode: "edit", character: character });
    }
    else {
        const character = characters.find(c => c.id === view.characterId);
        body = character === undefined
            ? (_jsxs("div", { className: css.hero, children: [_jsx("div", { className: css.heroEmoji, children: "\uD83D\uDC98" }), _jsx("div", { className: css.heroTitle, children: "\u6B22\u8FCE\u6765\u5230 AI \u5973\u53CB\u52A9\u624B" }), _jsx("div", { className: css.heroHint, children: "\u5728\u5DE6\u4FA7\u70B9\u51FB\u300C\uFF0B\u300D\u6DFB\u52A0\u597D\u53CB\uFF0C\u586B\u5199\u4F60\u5FC3\u4E2D\u7684 TA \u7684\u5916\u5F62\u3001\u6027\u683C\u4E0E\u6545\u4E8B\uFF0C \u751F\u6210\u4E00\u5F20\u6EE1\u610F\u7684\u8096\u50CF\uFF0C\u7136\u540E\u5C31\u53EF\u4EE5\u5F00\u59CB\u804A\u5929\u4E86\u3002" }), _jsx("button", { type: "button", className: css.primaryButton, onClick: () => props.actions.openCreate(), children: "\u6DFB\u52A0\u597D\u53CB" })] }))
            : _jsx(ChatView, { ...props, character: character });
    }
    return (_jsxs("div", { className: css.root, children: [body, _jsx(ToastStack, { ...props })] }));
}
//# sourceMappingURL=ChatPanel.js.map