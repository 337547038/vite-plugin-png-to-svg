import spriteImage from './image'

interface Config {
  iconPath?: string // icon图片位置，默认/src/assets/icon
  savePath?: string // 生成样式图片保存位置，默认/src/assets/icon（不创建目录需确保保存位置路径存在）
  width?: number // 合并生成的图片宽度，单位px，默认 500
  spacing?: number //两张图片间的间距，默认 5
  prefix?: string // 生成css类名前缀，默认 icon-
  root?: string
}

/**
 * 监听文件增加删除变化，重新生成
 */
const watcherIconFile = (file: string, config: Config) => {
  const filePath = file.replace(/\\/g, '/')
  if (filePath.indexOf(config.iconPath) !== -1 && (file.endsWith('.jpg') || file.endsWith('.png'))) {
    spriteImage(config)
  }
}

const sprites = (config: Config) => {
  const configDefault = config || {}
  if (!configDefault.iconPath) {
    configDefault.iconPath = "/src/assets/icon"
  }
  return {
    name: 'vitePluginSprites',
    enforce: 'pre',
    configResolved(cfg: any) {
      configDefault.root = cfg.root
    },
    buildStart() {
      spriteImage(configDefault)
    },
    handleHotUpdate({file, server}) {
      //console.log('handleHotUpdate',file)
    },
    configureServer(server) {
      server.watcher.on('add', (file) => {
        watcherIconFile(file, configDefault)
      })
      server.watcher.on('change', (file) => {
        watcherIconFile(file, configDefault)
      })
      server.watcher.on('unlink', (file) => {
        watcherIconFile(file, configDefault)
      })
    }
  }
}
sprites.images = spriteImage
export default sprites


