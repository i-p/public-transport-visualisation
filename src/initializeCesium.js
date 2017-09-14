import options from "./options";
import { showCustomTileRange } from "./cesium/selectDisplayedTileRange"

export default function initializeCesium() {
  Cesium.BingMapsApi.defaultKey = "AjCgBPI90qGuC4qk0K75MVgl6HCdbVkH_r7jJWtiPq8VBmcb74aGvUOekz-7hBuE";

  const tileRange = options.tileRange;
  const imageryProvider = new Cesium.BingMapsImageryProvider({
    url: "//dev.virtualearth.net"
  });
  // const imageryProvider = new Cesium.MapboxImageryProvider({
  //   mapId: 'mapbox.streets'
  // });

  if (options.tileRange.enabled) {
    imageryProvider.readyPromise.then(() => {
      for (let x = tileRange.xRange[0]; x <= tileRange.xRange[1]; x++) {
        for (let y = tileRange.yRange[0]; y <= tileRange.yRange[1]; y++) {
          imageryProvider.requestImage(x, y, tileRange.level);
        }
      }
    });
  }

  const viewer = new Cesium.Viewer("cesiumContainer", {
    terrainExaggeration: options.terrainExaggeration,
    animation: false,
    baseLayerPicker: false,
    fullscreenButton: false,
    geocoder: false,
    homeButton: false,
    infoBox: false,
    sceneModePicker: false,
    selectionIndicator: true,
    timeline: false,
    navigationHelpButton: false,
    scene3DOnly: true,

    skyAtmosphere: false,
    imageryProvider,

    creditContainer: "credits"
  });

  if (options.displayTileCoordinates) {
    viewer.imageryLayers.add(new Cesium.ImageryLayer(new Cesium.TileCoordinatesImageryProvider()));
  }

  //TODO move value to options
  viewer.camera.setView({destination: new Cesium.Cartesian3(9075216.322398473, 1601349.1706513234, 8430794.265876785) });

  viewer.scene.fxaa = false;

  viewer.scene.skyBox.show = false;
  viewer.scene.sun.show = false;
  viewer.scene.screenSpaceCameraController.enableLook = false;

  //TODO separate module
  viewer.clock.startTime = options.start.clone();
  viewer.clock.stopTime = options.stop.clone();
  viewer.clock.currentTime = options.current.clone();
  viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
  viewer.clock.multiplier = options.defaultSpeed;
  viewer.clock.shouldAnimate = false;

  const terrainProvider = new Cesium.CesiumTerrainProvider({
    url : "https://assets.agi.com/stk-terrain/world"
    //requestVertexNormals: true
  });

  if (options.tileRange.enabled) {
    showCustomTileRange(viewer, options.tileRange);
  }

  viewer.terrainProvider = terrainProvider;

  //viewer.scene.globe.enableLighting = true;

  viewer.scene.debugShowFramesPerSecond = options.showFramesPerSecond;

  return viewer;
}
