const path = require('path');
const webpack = require('webpack');
const CracoSwcPlugin = require('craco-swc');
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")

module.exports = {
  plugins: [
    new NodePolyfillPlugin(),
  ],
  resolve: {
    extensions: ['*', '.js', '.jsx'],
    fallback: {
      buffer: require.resolve("buffer"),
      crypto: require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
    },
  },
  plugins: [
    {
      plugin: {
        ...CracoSwcPlugin,
        overrideCracoConfig: ({ cracoConfig }) => {
          if (typeof cracoConfig.eslint.enable !== 'undefined') {
            cracoConfig.disableEslint = !cracoConfig.eslint.enable;
          }
          delete cracoConfig.eslint;
          return cracoConfig;
        },
        overrideWebpackConfig: ({ webpackConfig, cracoConfig }) => {
          if (
            typeof cracoConfig.disableEslint !== 'undefined' &&
            cracoConfig.disableEslint === true
          ) {
            webpackConfig.plugins = webpackConfig.plugins.filter(
              (instance) => instance.constructor.name !== 'ESLintWebpackPlugin',
            );
          }
          return webpackConfig;
        },
      },
      options: {
        swcLoaderOptions: {
          jsc: {
            externalHelpers: true,
            target: 'es5',
            parser: {
              syntax: 'typescript',
              tsx: true,
              dynamicImport: true,
              exportDefaultFrom: true,
            },
          },
        },
      },
    },
  ],
  webpack: {
    configure: (webpackConfig) => {
      const wasmExtensionRegExp = /\.wasm$/;
      webpackConfig.resolve.extensions.push(".wasm");
      webpackConfig.experiments = {
        asyncWebAssembly: true,
      };
      webpackConfig.module.rules.forEach((rule) => {
        (rule.oneOf || []).forEach((oneOf) => {
          if (oneOf.type === "asset/resource") {
            oneOf.exclude.push(wasmExtensionRegExp);
          }
        });
      });

      return webpackConfig;
    },
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
  }
};