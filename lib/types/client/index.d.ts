/**
 * Client half of the AI girlfriend companion app: the single `apply` body
 * creates one shared {@link GirlfriendModel} and mounts two entries that
 * side-by-side replace the built-in conversation columns (cell shadowing via
 * `priority: -1`):
 *
 * - `'sidebar'`     → the WeChat-like friend list (avatar, last message,
 *                     add-friend, right-click character edit, bottom-left
 *                     settings gear).
 * - `'conversation'` → the chat dialog / settings / character editor, driven
 *                     by the same model through the inject hooks compartment.
 *
 * The same model source is injected into both entries' hooks compartments —
 * the renderer binds one `useModel` selector hook per entry over the shared
 * observable, so both columns always agree on state.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import type { InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import { GirlfriendModel } from './model.ts';
export { GirlfriendModel } from './model.ts';
export type { ModelActions } from './model.ts';
export type { ApiProfile, ApiSettings, Character, CharacterFormValues, ChatMessage, ViewState, } from './types.ts';
/** Business face every entry receives: the observable model + its actions. */
export interface GirlfriendInjected {
    hooks: {
        model: GirlfriendModel;
    };
    actions: GirlfriendModel;
}
/** Composed props of the friend-list entry. */
export type FriendListComponentProps = PropsRuntime<'sidebar'> & InjectFace<GirlfriendInjected>;
/** Composed props of the chat-dialog entry. */
export type ChatPanelComponentProps = PropsRuntime<'conversation'> & InjectFace<GirlfriendInjected>;
/** Services required by the client half. */
export declare const inject: string[];
/**
 * Client plugin body: mount the two companion entries.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map