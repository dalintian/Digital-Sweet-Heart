/**
 * Shared business vocabulary of the AI girlfriend companion app (browser
 * half). All state rides JSON-compatible plain data through the model's
 * immutable snapshots.
 */
/** One model provider configuration (OpenAI-compatible endpoint). */
export interface ApiProfile {
    /** Base URL such as https://api.openai.com/v1 (the /chat/completions etc. are appended). */
    baseUrl: string;
    /** API key. */
    apiKey: string;
    /** Model name. */
    model: string;
}
/** The four provider knobs the settings view exposes. */
export interface ApiSettings {
    /** 对话模型（角色对话、生成图片/视频提示词） */
    chat: ApiProfile;
    /** 视觉语言模型（分析用户上传的照片） */
    vlm: ApiProfile;
    /** 文生图模型（生成肖像图、聊天中的照片） */
    image: ApiProfile;
    /** 文生视频模型（生成聊天中的视频） */
    video: ApiProfile & {
        pollPath: string;
    };
}
export declare const EMPTY_PROFILE: ApiProfile;
export declare function emptySettings(): ApiSettings;
export declare function profileConfigured(profile: ApiProfile): boolean;
/** The persona fields a girlfriend profile records (and the form edits). */
export interface CharacterFormValues {
    name: string;
    appearance: string;
    personality: string;
    hobbies: string;
    tone: string;
    background: string;
    note: string;
}
/** A friend (girlfriend) character, as derived from its Markdown profile. */
export interface Character extends CharacterFormValues {
    id: string;
    createdAt: number;
    updatedAt: number;
    /** Relative asset path under the data directory, e.g. images/<id>.png. */
    avatarPath?: string;
    /** Last message preview for the friend list. */
    lastMessage: string;
    /** Last message time (ms epoch) for the friend list. */
    lastTime?: number;
}
export type MessageKind = 'text' | 'image' | 'video' | 'photo';
/** One chat bubble. */
export interface ChatMessage {
    id: string;
    role: 'user' | 'girlfriend';
    kind: MessageKind;
    /** Text content; for media bubbles it is the caption/prompt. */
    content: string;
    /** Media payload (data URL or absolute URL) for image/video/photo bubbles. */
    mediaUrl?: string;
    /** Photo analysis from the VLM (uploaded photos). */
    analysis?: string;
    time: number;
}
export type ViewState = {
    kind: 'chat';
    characterId: string;
} | {
    kind: 'settings';
} | {
    kind: 'create';
} | {
    kind: 'edit';
    characterId: string;
};
export interface Toast {
    id: string;
    text: string;
    kind: 'warn' | 'info' | 'error';
}
/** Busy keys: chat, image, video, photo(analyze), portrait. */
export type BusyKey = 'chat' | 'image' | 'video' | 'photo' | 'portrait';
/** The immutable app snapshot every component derives from. */
export interface AppState {
    settings: ApiSettings;
    characters: Character[];
    /** Chat history per character (bounded). */
    messages: Record<string, ChatMessage[]>;
    view: ViewState;
    toasts: Toast[];
    busy: Partial<Record<BusyKey, boolean>>;
}
export declare function newMessage(role: ChatMessage['role'], kind: MessageKind, content: string): ChatMessage;
/** Format a timestamp for the friend list (HH:mm today, MM/DD otherwise). */
export declare function formatTime(time: number | undefined): string;
/** Build the persona system prompt for one character. */
export declare function buildPersonaPrompt(character: Character): string;
//# sourceMappingURL=types.d.ts.map