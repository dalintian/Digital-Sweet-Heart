import type { Context } from '@deepseek-ai/cordis';
/** Cordis plugin name. */
export declare const name = "client-ui-girlfriend-host";
/** Required services: the route registry. */
export declare const inject: string[];
/** The base path every route of this plugin lives under. */
export declare const ROUTE_PREFIX = "/girlfriend";
/**
 * Mount the girlfriend routes.
 * @param ctx - host plugin context carrying webServer.
 */
export declare function apply(ctx: Context): void;
//# sourceMappingURL=index.d.ts.map