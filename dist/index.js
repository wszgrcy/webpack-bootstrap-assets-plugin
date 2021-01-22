"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NgxBootstrapAssetsPlugin = void 0;
const utils_1 = require("@angular-devkit/build-webpack/src/utils");
const webpack_sources_1 = require("webpack-sources");
const tapable_1 = require("tapable");
class NgxBootstrapAssetsPlugin {
    constructor(options = { output: "bootstrap.json" }) {
        this.options = options;
        this.hooks = {
            originAssets: new tapable_1.SyncWaterfallHook(["files"]),
            beforeAppend: new tapable_1.SyncWaterfallHook(["bootstrapFiles"]),
            beforeEmit: new tapable_1.SyncWaterfallHook(["bootstrapJson"]),
        };
    }
    apply(compiler) {
        compiler.hooks.shouldEmit.tap("NgxBootstrapAssetsPlugin", (compilation) => {
            let files = utils_1.getEmittedFiles(compilation);
            files = this.hooks.originAssets.call(files);
            let bootstrapFiles = filterAndMapBuildFiles(files, [".css", ".js"]);
            bootstrapFiles = this.hooks.beforeAppend.call(bootstrapFiles);
            let bootstrapJson = {
                scripts: [],
                stylesheets: [],
            };
            for (const { extension, file, name } of bootstrapFiles) {
                switch (extension) {
                    case ".js":
                        bootstrapJson.scripts.push({ src: file });
                        break;
                    case ".css":
                        bootstrapJson.stylesheets.push({ href: file });
                        break;
                }
            }
            bootstrapJson = this.hooks.beforeEmit.call(bootstrapJson);
            compilation.assets[this.options.output] = new webpack_sources_1.RawSource(JSON.stringify(bootstrapJson, undefined, 4));
        });
    }
}
exports.NgxBootstrapAssetsPlugin = NgxBootstrapAssetsPlugin;
function filterAndMapBuildFiles(files, extensionFilter) {
    const filteredFiles = [];
    const validExtensions = Array.isArray(extensionFilter) ? extensionFilter : [extensionFilter];
    for (const { file, name, extension, initial } of files) {
        if (name && initial && validExtensions.includes(extension)) {
            filteredFiles.push({ file, extension, name });
        }
    }
    return filteredFiles;
}
