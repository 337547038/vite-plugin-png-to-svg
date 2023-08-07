import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import pngToSvg from 'vite-plugin-png-to-svg'
//import pngToSvg from './packages/src'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    pngToSvg({
      isReplace: true,
      replaceType: 'img',
    })
  ]
})
