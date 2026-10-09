declare const _default: import("h3").EventHandler<import("h3").EventHandlerRequest, {
    enabled: boolean;
    interceptExternal: boolean;
    targets: import("../../shared/externalMatch.js.js").NormalizedTarget[];
    routes: {
        name: string;
        target: string | undefined;
        route: string;
        method: import("../../../types.js.js").MockMethod;
        enabled: boolean;
    }[];
}>;
export default _default;
