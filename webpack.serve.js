const path = require('path');
const { merge } = require('webpack-merge');
const baseConfig = require('./webpack.config');

module.exports = merge(baseConfig, {
  mode: 'development',
  devServer: {
    port: 1234,
    open: true,
    contentBase: path.join(__dirname, './public')
  }
});