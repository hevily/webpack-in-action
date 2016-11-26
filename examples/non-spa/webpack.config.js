const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const pkgInfo = require('./package.json');
const glob = require('glob');

module.exports = function(options = {}) {
  const profile = require('./conf/' + (process.env.npm_config_profile || 'default'));

  const entries = glob.sync('./src/**/index.js');
  const entryJsList = {};
  const entryHtmlList = [];
  for (const path of entries) {
    const chunkName = path.slice('./src/pages/'.length, -'/index.js'.length);
    entryJsList[chunkName] = path;
    entryHtmlList.push(new HtmlWebpackPlugin({
      template: path.replace('index.js', 'index.html'),
      filename: chunkName + '.html',
      chunks: ['manifest', 'vendor', chunkName],
      favicon: './src/favicon.png'
    }));
  }

  return {
    entry: Object.assign({
      vendor: './src/vendor'
    }, entryJsList),

    output: {
      path: __dirname + '/dist',
      filename: options.dev ? '[name].js' : '[name].js?[chunkhash]',
      chunkFilename: '[id].js?[chunkhash]',
      publicPath: '/'
    },

    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: ['babel-loader', 'eslint-loader']
        },

        {
          test: /\.html$/,
          use: 'html-loader',
          options: {
            attrs: ['img:src', 'link:href']
          }
        },

        {
          test: /\.css$/,
          use: [
            'style-loader',
            'css-loader',
            'postcss-loader'
          ]
        },

        {
          test: /favicon\.png$/,
          use: 'file-loader',
          options: {
            name: '[name].[ext]?[hash]'
          }
        },

        {
          test: /\.(png|jpg|jpeg|gif|eot|ttf|woff|woff2|svg|svgz)(\?.+)?$/,
          exclude: /favicon\.png$/,
          loader: 'url-loader',
          options: {
            limit: 10000
          }
        }
      ]
    },

    plugins: [
      ...entryHtmlList,

      new webpack.optimize.CommonsChunkPlugin({
        names: ['vendor', 'manifest']
      }),

      new webpack.DefinePlugin({
        DEBUG: Boolean(options.dev),
        VERSION: JSON.stringify(pkgInfo.version),
        CONF: JSON.stringify({
          experimentalFeatures: profile.experimentalFeatures,
          thirdPartyApiKey: profile.thirdPartyApiKey
        })
      })
    ],

    devServer: {
      port: profile.devServer.port,
      proxy: profile.devServer.proxy
    },

    resolve: {
      alias: {
        src: __dirname + '/src'
      }
    }
  };
};
