import * as webpack from 'webpack';
import { SyncWaterfallHook } from 'tapable';
import { AttrGroup, BootstrapAssetsPluginOptions, EmittedFiles, FileInfo } from './type';
export declare class BootstrapAssetsPlugin {
    private options?;
    constructor(options?: BootstrapAssetsPluginOptions);
    hooks: {
        originAssets: SyncWaterfallHook<EmittedFiles[], any, any>;
        beforeEmit: SyncWaterfallHook<{
            scripts: AttrGroup[];
            stylesheets: AttrGroup[];
        }, any, any>;
        addAdditionalAttr: SyncWaterfallHook<AttrGroup, FileInfo, any>;
        extraAssets: SyncWaterfallHook<Record<string, string>, {
            scripts: AttrGroup[];
            stylesheets: AttrGroup[];
        }, any>;
    };
    apply(compiler: webpack.Compiler): void;
}
