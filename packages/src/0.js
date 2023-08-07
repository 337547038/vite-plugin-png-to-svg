
const { createFilter } = require('@rollup/pluginutils');
const PNGReader = require('pngjs').PNGReader;
const potrace = require('potrace');
const fs = require('fs');
const path = require('path');

module.exports = function pngToSvgPlugin(options = {}) {
  const filter = createFilter(options.include, options.exclude);

  return {
    name: 'png-to-svg',

    resolveId(source) {
      if (source.endsWith('.png')) {
        return path.resolve(path.dirname(this.id), source);
      }

      return null;
    },

    async load(id) {
      if (filter(id) && id.endsWith('.png')) {
        const reader = new PNGReader(fs.readFileSync(id));
        const pngData = await new Promise((resolve, reject) => {
          reader.parse((err, png) => {
            if (err) {
              reject(err);
            } else {
              resolve(png);
            }
          });
        });

        const bitmap = {
          width: pngData.width,
          height: pngData.height,
          data: pngData.pixels
        };

        const trace = potrace.trace(bitmap);
        const svg = trace.getSVG();

        return `export default ${JSON.stringify(svg)};`;
      }

      return null;
    }
  };
};
