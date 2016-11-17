import Cesium from "cesium"

function fixTilingScheme(tilingScheme, initialLevel) {
  tilingScheme._numberOfLevelZeroTilesX = 2 << initialLevel;
  tilingScheme._numberOfLevelZeroTilesY = 1 << initialLevel;

  tilingScheme.getNumberOfXTilesAtLevel = function(level) {
    return this._numberOfLevelZeroTilesX << (level - initialLevel);
  };

  tilingScheme.getNumberOfYTilesAtLevel = function(level) {
    return this._numberOfLevelZeroTilesY << (level - initialLevel);
  };
}

export default function selectDisplayedTileRange(viewer, {level, xRange, yRange}) {
  // need to access private variable otherwise a DeveloperError is thrown
  var tilingScheme = viewer.scene.globe.terrainProvider._tilingScheme;

  fixTilingScheme(tilingScheme, level);

  const surface = viewer.scene.globe._surface;

  function createZeroLevelTiles() {
    const result = [];
    for (var x=xRange[0]; x<=xRange[1]; x++) {
      for (var y=yRange[0]; y<=yRange[1]; y++) {
        const tile = new Cesium.QuadtreeTile({ tilingScheme, x, y, level });
        result.push(tile);
      }
    }
    return result;
  }

  surface._levelZeroTiles = createZeroLevelTiles();

  const origInvalidateAllTiles = surface.invalidateAllTiles;

  surface.invalidateAllTiles = function() {
    origInvalidateAllTiles.call(this);
    surface._levelZeroTiles = createZeroLevelTiles();
  };
}
