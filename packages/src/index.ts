import potrace from 'potrace'
import fs from 'fs'
import path from 'path'

interface Config {
  pngPath?: string // png图片位置，默认/src/assets/png
  svgPath?: string // 生成的svg保存位置，默认/src/assets/svg
  isReplace?: boolean // 替换指定文件内容中的png图片，默认false
  include?: string[] // 指定文件后缀，默认['vue','tsx']。isReplace=true时有效
  replaceType?: 'img' | 'svg' // 替换模式，img/svg两种。默认img。isReplace=true时有效
  root?: string
}

/**
 * 监听文件增加变化，重新生成
 */
const watcherPngFile = (file: string, config: Config, type?: string) => {
  const filePath: string = file.replace(/\\/g, '/')
  if (filePath.indexOf(config.pngPath) !== -1 && file.endsWith('.png')) {
    if (type === 'unlink') {
      const delName: string = path.basename(filePath, '.png') + '.svg'
      const unlinkName: string = path.join(config.root, config.svgPath, delName)
      fs.unlink(unlinkName, (err) => {
        if (err) throw err
      })
    } else {
      potraceTrace(file, config).then(r => {
      })
    }
  }
}

/**
 * 递归创建目录
 * @param dirPath
 */
const recursiveMkdir = (dirPath: string) => {
  const parentDir: string = path.dirname(dirPath) // 获取父级目录路径
  if (!fs.existsSync(parentDir)) {
    recursiveMkdir(parentDir) // 递归创建父级目录
  }

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath) // 创建当前目录
  }
}
const potraceTrace = (pngPath: string, config: Config, writeFile: boolean = true) => {
  return new Promise((resolve, reject) => {
    potrace.trace(pngPath, (err: any, svg: string) => {
      if (err) {
        reject()
        throw err
      }
      let svgPath: string = ''
      if (writeFile) {
        const fileName: string = path.basename(pngPath, '.png') + '.svg'
        const savePath: string = path.join(config.root, config.svgPath)
        recursiveMkdir(savePath)
        svgPath = path.join(savePath, fileName)
        fs.writeFileSync(svgPath, svg)
      }
      resolve({svg: svg, svgPath: svgPath})
    })
  })
}

const pngToSvg = (config: Config) => {
  const configDefault = Object.assign({}, {
    pngPath: '/src/assets/png',
    svgPath: '/src/assets/svg',
    isReplace: false,
    include: ['vue', 'tsx'],
    replaceType: 'img',
    root: '/'
  }, config || {})

  return {
    name: 'vitePluginPngToSvg',
    enforce: 'pre',
    configResolved(cfg: any) {
      configDefault.root = cfg.root
    },
    async buildStart() {
      const pngPath: string = path.join(configDefault.root, configDefault.pngPath)
      if (!fs.existsSync(pngPath)) {
        console.log(`png图片路径不存在${pngPath}`)
        return
      }
      fs.readdir(pngPath, (err: any, paths: string[]) => {
        if (err) {
          throw err
        }
        const pathsFilter: string[] = paths.filter((item: string) => {
          return item.endsWith('.png')
        })
        const length: number = pathsFilter.length
        let index: number = 0
        console.log(`检测到${length}个png图片文件，开始转换~`)
        pathsFilter.forEach((src: string) => {
          const joinSrc: string = path.join(configDefault.root, configDefault.pngPath, src)
          potraceTrace(joinSrc, configDefault)
          index++
          if (index === length) {
            console.log(`svg转换完成`)
          }
        })
      })
    },
    handleHotUpdate({file, server}) {
      //console.log('handleHotUpdate',file)
    },
    configureServer(server: any) {
      server.watcher.on('add', (file: string) => {
        watcherPngFile(file, configDefault)
      })
      server.watcher.on('change', (file: string) => {
        watcherPngFile(file, configDefault)
      })
      server.watcher.on('unlink', (file: string) => {
        watcherPngFile(file, configDefault, 'unlink')
      })
    },
    async transform(code: string, id: string) {
      const suffix: string = id.substring(id.lastIndexOf(".") + 1)
      if (configDefault.isReplace && configDefault.include.includes(suffix)) {
        // 包含指定后缀，src为png并且带有data-src="svg"标识
        const regex = /<img([^>]*\ssrc="([^"]+\.png)"[^>]*)data-src="svg"([^>]*)>|<img([^>]*\sdata-src="svg"[^>]*)src="([^"]+\.png)"([^>]*)>/gi
        let replaceCode: string = code
        let match: string[]
        while ((match = regex.exec(code)) !== null) {
          const src: string = match[2] || match[5] // /assets/xx.png
          const img: string = match[0] // <img xxx/>
          const pngPath: string = path.resolve(path.dirname(id), src)
          try {
            const isImg: boolean = configDefault.replaceType === 'img'
            const svgContent: any = await potraceTrace(pngPath, configDefault, isImg)
            let newImgContent: string = svgContent.svg // 直接将原图片替换为svg代码
            if (isImg) {
              // 以图片形式引入，将图片src换为svg路径
              const relativePath: string = path.relative(configDefault.root, svgContent.svgPath).replace(/\\/g, '/')
              newImgContent = img.replace(src, '/' + relativePath)
            }
            replaceCode = code.replace(img, newImgContent)
          } catch (e) {

          }
        }
        return {
          code: replaceCode,
          map: null
        }
      }
    }
  }
}
export default pngToSvg


