const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    
    entry: {
      code: './src/code.ts',
      ui: './src/ui.tsx'
    },
    
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true
    },
    
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        },
        {
          test: /\.scss$/,
          use: ['style-loader', 'css-loader', 'sass-loader']
        },
        {
          test: /\.(png|jpg|gif|svg)$/,
          type: 'asset/resource'
        }
      ]
    },
    
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@server': path.resolve(__dirname, 'server')
      }
    },
    
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/ui.html',
        filename: 'ui.html',
        chunks: ['ui'],
        inject: 'body'
      })
    ],
    
    // Figma-specific optimizations
    optimization: {
      minimize: isProduction,
      usedExports: true,
      sideEffects: false
    },
    
    // Development server configuration
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist')
      },
      port: 8080,
      hot: true,
      open: false
    },
    
    // External dependencies that Figma provides
    externals: {
      'figma': 'figma'
    }
  };
};