const path = require('path');

module.exports = {
  mode: 'development',
  devtool: false,
  entry: './src/widget-test.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'code.js',
    clean: true
  },
  optimization: {
    minimize: false,
    runtimeChunk: false,
    splitChunks: false
  },
  externals: {
    figma: 'figma'
  }
};