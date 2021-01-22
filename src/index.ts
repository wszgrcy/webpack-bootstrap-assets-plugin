import * as webpack from 'webpack';
import * as path from 'path';
import { RawSource } from 'webpack-sources';
import { SyncWaterfallHook } from 'tapable';
import { createHash } from 'crypto';
import { AttrGroup, BootstrapAssetsPluginOptions, EmittedFiles, ExtensionFilter, FileInfo } from './type';

function getEmittedFiles(compilation: webpack.compilation.Compilation): EmittedFiles[] {
    const files: EmittedFiles[] = [];

    for (const chunk of compilation.chunks as Iterable<webpack.compilation.Chunk>) {
        for (const file of chunk.files) {
            files.push({
                id: chunk.id!.toString(),
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

function filterAndMapBuildFiles(files: EmittedFiles[], extensionFilter: ExtensionFilter | ExtensionFilter[]): FileInfo[] {
    const filteredFiles: FileInfo[] = [];
    const validExtensions: string[] = Array.isArray(extensionFilter) ? extensionFilter : [extensionFilter];

    for (const { file, name, extension, initial } of files) {
        if (name && initial && validExtensions.includes(extension)) {
            filteredFiles.push({ file, extension, name });
        }
    }

    return filteredFiles;
}
function generateSri(content: string) {
    const algorithm = 'sha384';
    return `${algorithm}-${createHash(algorithm).update(content, 'utf8').digest('base64')}`;
}

export class BootstrapAssetsPlugin {
    constructor(private options?: BootstrapAssetsPluginOptions) {
        this.options = { ...new BootstrapAssetsPluginOptions(), ...this.options };
    }
    hooks = {
        originAssets: new SyncWaterfallHook<EmittedFiles[]>(['files']),
        beforeEmit: new SyncWaterfallHook<{ scripts: AttrGroup[]; stylesheets: AttrGroup[] }>(['bootstrapJson']),
    };
    apply(compiler: webpack.Compiler) {
        compiler.hooks.shouldEmit.tap('BootstrapAssetsPlugin', (compilation) => {
            let files = getEmittedFiles(compilation);
            files = this.hooks.originAssets.call(files);
            let bootstrapFiles = filterAndMapBuildFiles(files, ['.css', '.js']);
            let bootstrapJson: { scripts: AttrGroup[]; stylesheets: AttrGroup[] } = {
                scripts: [],
                stylesheets: [],
            };
            for (const bootstrapFile of bootstrapFiles) {
                let attrGroup: AttrGroup = {};
                if (this.options.sri) {
                    let content = compilation.getAsset(bootstrapFile.file).source.source() as string;
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
                            } else if (this.options.isModuleType(bootstrapFile) && !this.options.isNoModuleType(bootstrapFile)) {
                                attrGroup.type = 'module';
                            } else {
                                attrGroup.defer = '';
                            }
                        } else {
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
            compilation.assets[this.options.output] = new RawSource(JSON.stringify(bootstrapJson, undefined, 4));
        });
    }
}
