const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: {
    main: './src/index.ts'
  },
  output: {
    filename: 'index.js',
    path: path.join(__dirname + '/dist')
  },
  resolve: {
    extensions: [
      '.ts',
      '.js'
    ],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: require.resolve('ts-loader')
      },
      {
        test: /\.html$/,
        loader: require.resolve('html-loader')
      },
      {
        test: /\.(png|svg|jpe?g|gif)$/,
        loader: require.resolve('file-loader'),
        options: {
          esModule: false
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html'
    })
  ]
};
