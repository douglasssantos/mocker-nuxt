export interface ExternalTargetConfig {
    name: string;
    baseURL: string;
    mockBasePath?: string;
}
export interface NormalizedTarget {
    name: string;
    baseURL: string;
    mockBasePath: string;
}
export declare function normalizeTarget(target: ExternalTargetConfig): NormalizedTarget;
/** Same host, including http and https on the default ports. */
export declare function sameTargetHost(baseURL: string, absolute: URL): boolean;
export declare function relativeToTarget(baseURL: string, absolute: URL): string | null;
export declare function internalMockPath(target: NormalizedTarget, path: string, search?: string): string;
/** Absolute URL belonging to a configured target, rewritten to the local mock path. */
export declare function rewriteAbsoluteUrl(href: string, targets: ExternalTargetConfig[]): string | null;
export declare function parseInternalPath(pathname: string, targets: ExternalTargetConfig[]): {
    name: string;
    baseURL: string;
    path: string;
} | null;
export declare function externalUrl(baseURL: string, path: string, search?: string): URL;
