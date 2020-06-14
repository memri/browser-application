"use strict";
module.exports = {
  entry: './demo.ts',
  module: {
    rules: [
      {
        test: /\.(t|j)sx?$/,
        use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: true
            }
          },
        exclude: /node_modules/,
      },
    ],
  },
    resolveLoader: {
        modules: [
            "node_modules", 
            __dirname + "/node_modules",
        ],
    },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
  },
  output: {
    filename: 'bundle.js',
    path: __dirname + '/dist',
  },
    devServer: {
        contentBase: __dirname,
        compress: true,
        port: 9000
    },
};