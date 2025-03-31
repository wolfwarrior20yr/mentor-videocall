const webpack = require("webpack");

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.fallback = {
        process: require.resolve("process/browser"),
        stream: require.resolve("stream-browserify"),
      };
      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          process: "process/browser",
        })
      );
      return webpackConfig;
    },
  },
};
