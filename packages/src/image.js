import fs from 'fs'
import path from 'path'
import images from 'images'

// 根据参数路径返回相对路径
const getRelativePath = (root, cPath, filed) => {
  const fullPath = path.join(root, cPath, filed)
  return path.relative(root, fullPath)
}
const imgSprites = (config = {}) => {
  const {
    iconPath,
    root = './'
  } = config
  const fullPath = path.join(root, iconPath)
  if (!fs.existsSync(fullPath)) {
    console.log(`icon图片路径不存在${fullPath}`)
    return
  }
  fs.readdir(fullPath, (err, paths) => {
    if (err) {
      throw err
    }
    // 提取jpg和png两种格式，同时排除sprites.png，确保当生成图片保存在同一目录时sprites.png再次被引用
    const pathsFilter = paths.filter((item) => {
      return (item.endsWith('.jpg') || item.endsWith('.png')) && item !== 'sprites.png'
    })
    const length = pathsFilter.length
    let index = 0
    const tempArray = []
    console.log(`检测到${length}个图片文件，开始进行合并~`)
    pathsFilter.forEach((src) => {
      const imgSrc = getRelativePath(root, iconPath, src)
      const imgSize = images(imgSrc).size()
      tempArray.push({
        path: imgSrc,
        width: imgSize.width,
        height: imgSize.height
      })
      index++
      if (index === length) {
        writeFile(tempArray, config)
      }
    })
  })
}
const writeFile = (imgArray, config) => {
  const {
    root = './',
    savePath = config.savePath || config.iconPath,
    width = 500,
    spacing = 5,
    prefix = "icon-"
  } = config
  // 对tempArray排序，将高度差不多的放一行，减少行与行的间距
  imgArray.sort((a, b) => {
    return a.height < b.height
  })
  let usedWidth = 0 // 当前列已使用宽度，换行时要回0
  let usedHeight = 0 // 当前使用高度
  let maxHeight = 0 // 当前行最大高度，换行时要回0
  imgArray.forEach((item) => {
    // 计算每张图片的坐标位置点
    if (item.width + usedWidth + spacing > width) {
      // 要换行
      usedHeight += maxHeight + spacing
      usedWidth = 0
      maxHeight = 0
      // 如果xy没有时才重写
      item.x = item.x || 0
    } else {
      item.x = item.x || usedWidth
    }
    if (item.height > maxHeight) {
      maxHeight = item.height
    }
    item.y = item.y || usedHeight
    usedWidth += item.width + spacing
  })
  const imgHeight = usedHeight + maxHeight // 生成图片的高度
  // 创建一个指定宽高的透明图像
  const imgCanvas = images(width, imgHeight)
  //
  const imgSavePath = getRelativePath(root, savePath, 'sprites.png')
  let cssTemp = `[class*="${prefix}"]:before{content:"";background-image: url(./sprites.png); display:flex;align-items: center}\n`
  imgArray.forEach((item) => {
    imgCanvas.draw(images(item.path), item.x, item.y)
    const fileName = path.basename(item.path)
    const iconName = fileName.substring(0, fileName.indexOf('.'))
    //const fileName = item.path.substring(0, item.path.indexOf('.'))
    const x = item.x ? `-${item.x}px` : 0
    const y = item.y ? `-${item.y}px` : 0
    cssTemp += `.${
      prefix + iconName
    }:before{background-position: ${x} ${y};width: ${item.width}px;height: ${
      item.height
    }px}\n`
  })
  // 创建css文件
  const cssSavePath = getRelativePath(root, savePath, 'sprites.css')
  fs.writeFile(`${cssSavePath}`, cssTemp, function (err) {
    if (err) throw err
    // 绿色
    console.log(`成功写入css文件：${cssSavePath}`)
  })
  // 保存图片文件
  imgCanvas.save(imgSavePath)
  console.log(`成功合并图片：${imgSavePath}`)
}

export default imgSprites
