const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
const webpack = require('webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  // Common configuration
  const commonConfig = {
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? false : 'inline-source-map',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader', 'postcss-loader']
        },
        {
          test: /\.scss$/,
          use: ['style-loader', 'css-loader', 'sass-loader']
        },
        {
          test: /\.(png|jpg|gif|svg)$/,
          type: 'asset/inline' // Inline images as base64
        }
      ]
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@server': path.resolve(__dirname, 'server')
      }
    }
  };

  // UI configuration
  const uiConfig = {
    ...commonConfig,
    name: 'ui',
    entry: './src/ui.tsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'ui.js',
      clean: false
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/ui.html',
        filename: 'ui.html',
        inject: 'body',
        cache: false,
        scriptLoading: 'blocking',
        minify: isProduction ? {
          collapseWhitespace: true,
          removeComments: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          useShortDoctype: true
        } : false
      }),
      // Inline all chunks into HTML for Figma
      isProduction && new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/./]),
      // Define globals for Figma plugin environment
      new webpack.DefinePlugin({
        'global': 'window',
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development')
      })
    ].filter(Boolean),
    optimization: {
      minimize: isProduction,
      // Don't split chunks for UI - bundle everything together
      splitChunks: false,
      runtimeChunk: false
    }
  };

  // Code configuration
  const codeConfig = {
    ...commonConfig,
    name: 'code',
    target: 'node',
    entry: './src/code.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'code.js',
      clean: false
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development')
      })
    ],
    optimization: {
      minimize: isProduction
    }
  };

  // Development server configuration
  if (!isProduction) {
    uiConfig.devServer = {
      static: {
        directory: path.join(__dirname, 'dist')
      },
      port: 8080,
      hot: true,
      open: false
    };
  }

  return [uiConfig, codeConfig];
};