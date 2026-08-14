/**
 * Browser-side client for the host `/girlfriend/*` routes
 * (`packages/client/ui-girlfriend/src/index.ts` node half). All provider
 * traffic and file I/O flows through these same-origin calls — no CORS.
 */
export interface ChatCallParams {
    baseUrl: string;
    apiKey: string;
    model: string;
    messages: Array<{
        role: string;
        content: string | Array<Record<string, unknown>>;
    }>;
    temperature?: number;
}
export interface ChatResult {
    ok: boolean;
    content?: string;
    message?: string;
}
/** Call the configured chat model (also the vision-language model with image parts). */
export declare function chatCall(params: ChatCallParams): Promise<string>;
/** Call the configured image model; returns a data URL. */
export declare function imageCall(baseUrl: string, apiKey: string, model: string, prompt: string, size?: string): Promise<string>;
/** Call the configured video model; returns a playable URL. */
export declare function videoCall(profile: {
    baseUrl: string;
    apiKey: string;
    model: string;
    pollPath: string;
}, prompt: string): Promise<string>;
export interface MdFileInfo {
    name: string;
    updatedAt: number;
}
/** List the Markdown profile files in the data directory. */
export declare function fsList(): Promise<MdFileInfo[]>;
/** Read one Markdown profile file. */
export declare function fsRead(name: string): Promise<string>;
/** Write one Markdown profile file. */
export declare function fsWrite(name: string, content: string): Promise<void>;
/** Save a portrait image as a file (payload is a data URL). */
export declare function fsSaveAsset(name: string, dataUrl: string): Promise<void>;
/** Delete one stored file (character profile or portrait asset). Missing files are not an error. */
export declare function fsDelete(name: string): Promise<void>;
/** Absolute URL of a stored asset (portrait etc.). */
export declare function assetUrl(relative: string): string;
//# sourceMappingURL=host-api.d.ts.map