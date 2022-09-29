
const path = require('path');
const webpack = require('webpack');
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")

module.exports = {
  entry: path.resolve(__dirname, './src/index.js'),
  module: {
    rules: [

      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },


    ],
  },
  resolve: {
    extensions: ['*', '.js', '.jsx'],
    fallback: {
      buffer: require.resolve("buffer"),
      crypto: require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
    },
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'bundle.js',
    publicPath: '/'
  },
  experiments: {
    syncWebAssembly: true,
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),

    new NodePolyfillPlugin(),
  ],
  devServer: {
    contentBase: path.resolve(__dirname, './dist'),
    hot: true,
    historyApiFallback: true,
    publicPath: '/',
  },
  eslint: {
    enable: false
  },
};
