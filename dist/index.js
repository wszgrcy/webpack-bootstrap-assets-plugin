"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BootstrapAssetsPlugin = exports.getEmittedFiles = void 0;
const path = __importStar(require("path"));
const webpack_sources_1 = require("webpack-sources");
const tapable_1 = require("tapable");
const crypto_1 = require("crypto");
const type_1 = require("./type");
function getEmittedFiles(compilation) {
    const files = [];
    for (const chunk of compilation.chunks) {
        for (const file of chunk.files) {
            files.push({
                id: chunk.id.toString(),
                name: chunk.name,
                file,
                extension: path.extname(file),
                initial: chunk.isOnlyInitial(),
            });
        }
    }
    for (const file of Object.keys(compilation.assets)) {
        files.push({ file, extension: path.extname(file), initial: false, asset: true });
    }
    return files.filter(({ file, name }, index) => files.findIndex((f) => f.file === file && (!name || name === f.name)) === index);
}
exports.getEmittedFiles = getEmittedFiles;
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
function generateSri(content) {
    const algorithm = 'sha384';
    return `${algorithm}-${crypto_1.createHash(algorithm).update(content, 'utf8').digest('base64')}`;
}
class BootstrapAssetsPlugin {
    constructor(options) {
        this.options = options;
        this.hooks = {
            originAssets: new tapable_1.SyncWaterfallHook(['files']),
            beforeEmit: new tapable_1.SyncWaterfallHook(['bootstrapJson']),
        };
        this.options = Object.assign(Object.assign({}, new type_1.BootstrapAssetsPluginOptions()), this.options);
    }
    apply(compiler) {
        compiler.hooks.shouldEmit.tapPromise('BootstrapAssetsPlugin', (compilation) => __awaiter(this, void 0, void 0, function* () {
            let files = getEmittedFiles(compilation);
            files = this.hooks.originAssets.call(files);
            let bootstrapFiles = filterAndMapBuildFiles(files, ['.css', '.js']);
            let bootstrapJson = {
                scripts: [],
                stylesheets: [],
            };
            for (const bootstrapFile of bootstrapFiles) {
                let attrGroup = {};
                if (this.options.sri) {
                    let content = compilation.getAsset(bootstrapFile.file).source.source();
                    attrGroup.integrity = generateSri(content);
                }
                if (this.options.crossOrigin && this.options.crossOrigin !== 'none') {
                    attrGroup.crossOrigin = this.options.crossOrigin;
                }
                switch (bootstrapFile.extension) {
                    case '.js':
                        if (this.options.isModuleType && this.options.isNoModuleType) {
                            if (this.options.isNoModuleType(bootstrapFile) && !this.options.isModuleType(bootstrapFile)) {
                                attrGroup.nomodule = '';
                                attrGroup.defer = '';
                            }
                            else if (this.options.isModuleType(bootstrapFile) && !this.options.isNoModuleType(bootstrapFile)) {
                                attrGroup.type = 'module';
                            }
                            else {
                                attrGroup.defer = '';
                            }
                        }
                        else {
                            attrGroup.defer = '';
                        }
                        attrGroup.src = (this.options.deployUrl || '') + bootstrapFile.file;
                        bootstrapJson.scripts.push(attrGroup);
                        break;
                    case '.css':
                        attrGroup.href = (this.options.deployUrl || '') + bootstrapFile.file;
                        bootstrapJson.stylesheets.push(attrGroup);
                        break;
                }
            }
            bootstrapJson = this.hooks.beforeEmit.call(bootstrapJson);
            compilation.assets[this.options.output] = new webpack_sources_1.RawSource(JSON.stringify(bootstrapJson, undefined, 4));
        }));
    }
}
exports.BootstrapAssetsPlugin = BootstrapAssetsPlugin;
