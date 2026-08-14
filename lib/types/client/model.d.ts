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
import { type ApiSettings, type AppState, type CharacterFormValues } from './types.ts';
/** Actions the components may call. */
export interface ModelActions {
    openChat(characterId: string): void;
    openSettings(): void;
    openCreate(): void;
    openEdit(characterId: string): void;
    goBack(): void;
    saveSettings(settings: ApiSettings): void;
    dismissToast(id: string): void;
    sendChat(characterId: string, text: string): Promise<void>;
    generateImageMessage(characterId: string): Promise<void>;
    generateVideoMessage(characterId: string): Promise<void>;
    uploadPhoto(characterId: string, file: File): Promise<void>;
    generatePortrait(values: CharacterFormValues): Promise<string>;
    addCharacter(values: CharacterFormValues, portraitDataUrl?: string): Promise<void>;
    updateCharacter(id: string, values: CharacterFormValues, portraitDataUrl?: string): Promise<void>;
    deleteCharacter(id: string): Promise<void>;
}
/** The observable app model (HostObservable<AppState> + actions). */
export declare class GirlfriendModel {
    private state;
    private snapshot;
    private readonly listeners;
    constructor();
    getSnapshot(): AppState;
    subscribe(fn: () => void): () => void;
    /** Publish a state change to subscribers. Durability is explicit: callers
     * that change persona/messages/settings follow up with {@link persist}. */
    private commit;
    private persist;
    private toast;
    private appendMessage;
    private chatSettingsPresent;
    private chooseRecentForPrompt;
    openChat(characterId: string): void;
    openSettings(): void;
    openCreate(): void;
    openEdit(characterId: string): void;
    /** Return to the most recently opened chat, or the empty hero. */
    goBack(): void;
    saveSettings(settings: ApiSettings): void;
    dismissToast(id: string): void;
    sendChat(characterId: string, text: string): Promise<void>;
    /** 发张照片：按最近上下文生成一张照片并以消息发出。 */
    generateImageMessage(characterId: string): Promise<void>;
    /** 发个视频：按最近上下文生成一段视频并以消息发出。 */
    generateVideoMessage(characterId: string): Promise<void>;
    /** 上传照片：视觉语言模型分析 → 角色结合上下文回复。 */
    uploadPhoto(characterId: string, file: File): Promise<void>;
    /** 生成一张肖像预览图；返回 data URL，失败返回空字符串（已弹出提醒）。 */
    generatePortrait(values: CharacterFormValues): Promise<string>;
    /** Record one character (MD file + portrait asset), then open her chat. */
    addCharacter(values: CharacterFormValues, portraitDataUrl?: string): Promise<void>;
    /** Update an existing character (MD file rewritten; optional new portrait). */
    updateCharacter(id: string, values: CharacterFormValues, portraitDataUrl?: string): Promise<void>;
    /** Delete a character: chat history and portrait are dropped, the Markdown
     * profile and portrait asset are removed from the host data directory. */
    deleteCharacter(id: string): Promise<void>;
    /**
     * Boot reconciliation: Markdown profile files are the source of truth for
     * persona fields and portraits; this merges them over the local cache when
     * host file access is available.
     */
    private hydrateFromFiles;
}
/** Create the shared model (one instance per plugin load). */
export declare function createModel(): GirlfriendModel;
//# sourceMappingURL=model.d.ts.map