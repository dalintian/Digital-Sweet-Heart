import { ChatPanel } from "./ChatPanel.js";
import { FriendList } from "./FriendList.js";
import { createModel } from "./model.js";
export { GirlfriendModel } from "./model.js";
/** Services required by the client half. */
export const inject = ['slots'];
/**
 * Client plugin body: mount the two companion entries.
 * @param ctx - client root context.
 */
export function apply(ctx) {
    // One model instance for the whole plugin (created once per fiber load).
    const model = createModel();
    ctx.effect(() => {
        const disposeFriends = ctx.slots.register({
            name: 'sidebar',
            priority: -1,
            inject: () => ({ hooks: { model }, actions: model }),
            registrant: 'ui-girlfriend',
        }, FriendList);
        const disposeDialog = ctx.slots.register({
            name: 'conversation',
            priority: -1,
            inject: () => ({ hooks: { model }, actions: model }),
            registrant: 'ui-girlfriend',
        }, ChatPanel);
        return () => {
            disposeFriends();
            disposeDialog();
        };
    }, 'ui-girlfriend: companion entries');
}
//# sourceMappingURL=index.js.map