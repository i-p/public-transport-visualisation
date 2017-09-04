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

function isInTileRange(tileRange, xx, yy, level) {
  const x = (xx >> (level - tileRange.level)) | 0;
  const y = (yy >> (level - tileRange.level)) | 0;

  if (x >= tileRange.xRange[0] && x <= tileRange.xRange[1]) {
    if (y >= tileRange.yRange[0] && y <= tileRange.yRange[1]) {

      const maskRow = tileRange.mask[y - tileRange.yRange[0]];
      const maskChar = maskRow[x - tileRange.xRange[0]];

      if (maskChar === " ") {
        return true;
      }
    }
  }
  return false;
}

function selectDisplayedTileRange(viewer, {level, xRange, yRange}) {
  // need to access private variable otherwise a DeveloperError is thrown
  const tilingScheme = viewer.scene.globe.terrainProvider._tilingScheme;

  fixTilingScheme(tilingScheme, level);

  const surface = viewer.scene.globe._surface;

  function createZeroLevelTiles() {
    const result = [];
    for (let x = xRange[0]; x <= xRange[1]; x++) {
      for (let y = yRange[0]; y <= yRange[1]; y++) {
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

export default function showCustomTileRange(viewer, tileRange) {
  viewer.terrainProvider.readyPromise.then(() => {
    selectDisplayedTileRange(viewer, tileRange);
  });

  const originalGetTileDataAvailable = Cesium.CesiumTerrainProvider.prototype.getTileDataAvailable;

  viewer.terrainProvider.getTileDataAvailable = function(x, y, level) {
    if (isInTileRange(tileRange, x, y, level)) {
      return originalGetTileDataAvailable.call(this, x, y, level);
    }
    return false;
  };
}
