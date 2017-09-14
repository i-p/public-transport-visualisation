const webpack = require('webpack');
const path = require('path');

module.exports = {
  module: {
    loaders: [
      {
        test: /.scss$/,
        loaders: ["style", "css", "sass"],
        include: path.resolve(__dirname, '../')
      }
    ]
  },
  externals: [
    {
      cesium: "var Cesium"
    }
  ],
  plugins: [
    // Conditional requires workaround
    // https://github.com/airbnb/enzyme/issues/47
    // https://github.com/airbnb/enzyme/blob/master/docs/guides/webpack.md
    new webpack.IgnorePlugin(/react\/addons/),
    new webpack.IgnorePlugin(/react\/lib\/ReactContext/),
    new webpack.IgnorePlugin(/react\/lib\/ExecutionEnvironment/)
  ]
};
