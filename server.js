/*eslint no-console:0 */
'use strict';
require('core-js/fn/object/assign');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const config = require('./webpack.config');
const open = require('open');
const express = require('express');
const path = require('path');



if (process.env.REACT_WEBPACK_ENV === "dist") {
  var app = express();
  app.use("/dist", express.static(path.join(path.resolve(__dirname), "dist")));
  app.listen(config.port, err => {
    if (err) {
      console.log(err);
    }
    console.log('Listening at localhost:' + config.port);
    console.log('Opening your system browser...');
    open('http://localhost:' + config.port + '/dist/');
  });
}
else {
  const server = new WebpackDevServer(webpack(config), config.devServer);

  const cesiumPath = process.env.REACT_WEBPACK_ENV === 'dev'
    ? 'node_modules/cesium/Build/CesiumUnminified'
    : 'node_modules/cesium/Build/Cesium';

  server.app.use("/cesium", express.static(path.join(path.resolve(__dirname), cesiumPath)));

  server.listen(config.port, 'localhost', (err) => {
    if (err) {
      console.log(err);
    }
    console.log('Listening at localhost:' + config.port);
    console.log('Opening your system browser...');
    open('http://localhost:' + config.port + '/webpack-dev-server/');
  });
}


