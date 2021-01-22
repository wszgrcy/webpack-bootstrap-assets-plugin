export declare type ExtensionFilter = '.js' | '.css';
export interface EmittedFiles {
    id?: string;
    name?: string;
    file: string;
    initial: boolean;
    asset?: boolean;
    extension: string;
}
export interface FileInfo {
    file: string;
    name: string;
    extension: string;
}
export declare class BootstrapAssetsPluginOptions {
    crossOrigin: 'none' | 'anonymous' | 'use-credentials';
    sri: boolean;
    deployUrl: string;
    output: string;
    isModuleType?: (file: FileInfo) => boolean;
    isNoModuleType?: (file: FileInfo) => boolean;
}
export interface AttrGroup {
    nomodule?: string;
    integrity?: string;
    crossOrigin?: string;
    defer?: string;
    type?: string;
    src?: string;
    href?: string;
}
//# sourceMappingURL=type.d.ts.map