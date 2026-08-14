//#region lib/types/invariant.js
/**
* Package-owned invariant companion for `dsh-client-ui-girlfriend`.
* @module dsh-client-ui-girlfriend/invariant
*/
const PACKAGE_NAME = "dsh-client-ui-girlfriend";
/** Cordis companion plugin name. */
const name = "client-ui-girlfriend-invariant";
/** Service required before the companion can reserve package ownership. */
const inject = ["invariants"];
/**
* No runtime invariant: the companion app owns no cross-plugin mutable state
* and emits no cordis events — its route surface is host-side HTTP and its
* business state is registrant-private in the browser half.
*/
const install = () => {};
/**
* Register this package's invariant companion.
* @param ctx - Cordis context carrying the invariant service.
* @returns the installed registration's disposer after setup succeeds.
*/
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
