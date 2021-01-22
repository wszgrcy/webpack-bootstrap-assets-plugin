# 说明

- 本项目及部分代码来源于`angular-cli`中的`angular_devkit`部分
- 用于生成一个文件(json 格式),当对项目有其他用法时,代替`index.html`使用

# 使用

- 直接在插件列表中添加就可以`new BootstrapAssetsPlugin()`

# 功能

## hook

### originAssets

- 同步瀑布钩子
- 用于添加原始资源

### beforeEmit

- 同步瀑布钩子
- 生成的对象,即将成为资源

## options

- crossOrigin 是否跨域
- sri `Subresource Integrity`
- deployUrl 部署地址
- output 输出路径
- isModuleType() 是否是现代模块(es2015)
- isNoModuleType() 是否非现代模块(es5)
