export declare class RouteMatcher {
    static normalize(path: string): string;
    static signature(path: string): string;
    static match(pattern: string, path: string): Record<string, string> | null;
}
