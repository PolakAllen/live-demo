const HtmlWebpackPlugin = require('html-webpack-plugin');
const paths = require('./paths.js');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const ESLintPlugin = require("eslint-webpack-plugin");

module.exports = {
  entry: paths.entry,
  output: { path: paths.build, filename: "index.bundle.js" },
  mode: "development",
  resolve: { 
    modules: [paths.node_modules],
    extensions: ['.ts', '.tsx', '...'],
    alias: {
      '@': paths.src
    }
  },
  devServer: { contentBase: paths.build },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            configFile: paths.babelConfig
          }
        }
      },
      {
        test: /\.(scss)$/,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
      {
        test: /\.(jpg|jpeg|png|gif|mp3|svg)$/,
        use: ["file-loader"],
      },
      { /* Applies to the entry point (src/main/index.html) to ensure proper loading of resources */
        test: /\.html$/,
        loader: 'html-loader'
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: paths.html
    }),
    new ForkTsCheckerWebpackPlugin({
      async: false
    }),
    new ESLintPlugin({
      extensions: ["js", "jsx", "ts", "tsx"],
    }),
  ],
};