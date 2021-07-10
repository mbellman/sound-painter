const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  devtool: false,
  entry: path.join(__dirname, './src/index.ts'),
  output: {
    path: path.join(__dirname, './dist'),
    filename: 'main.js'
  },
  target: ['web', 'es5'],
  module: {
    rules: [
      {
        test: /.tsx?$/,
        loader: 'ts-loader'
      },
      {
        test: /.scss$/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader'
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.ts']
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      inject: 'body'
    })
  ]
};