import Cesium from "cesium"

export default {
  defaultSpeed: 20,

  tileRange: {
    mask: [
      "     xxxxxxx",
      "            ",
      "            ",
      "            ",
      "x           ",
      "xx          ",
      "xxxxx       ",
      "xxxxxx      ",
      "xxxxxx      ",
      "xxxxxx      ",
      "xxxxxxxx    "
    ],

    enabled: false,
    level: 13,
    xRange: [8964, 8975],
    yRange: [1900, 1910]
  },

  terrainExaggeration: 1.0,

  displayTileCoordinates: false,

  initialCameraView: {
    // This is the view that shows everything.
    // Use viewer.zoomTo(viewer.entities) to find the correct values.
    //
    // destination : Cesium.Cartesian3.fromRadians(0.29864424512457216, 0.8360228569437709, 31913.387238814907),
    // orientation: {
    //   heading: Cesium.Math.toRadians(0),
    //   pitch: Cesium.Math.toRadians(-50.238364688475),
    //   roll: 0.0
    // }
    
    destination: new Cesium.Cartesian3(4077250.7898052568, 1254835.7269374384, 4728019.434778197),
    orientation: {
      heading: 0.00045070733250351935,
      pitch: -0.8791513069185064,
      roll: 6.282927292714518
    }
  },

  current: Cesium.JulianDate.fromDate(new Date(2016, 2, 1, 6, 0)),
  start: Cesium.JulianDate.fromDate(new Date(2016, 2, 1, 0, 0)),
  stop: Cesium.JulianDate.fromDate(new Date(2016, 2, 1, 23, 59)),

  showFramesPerSecond: false
}

