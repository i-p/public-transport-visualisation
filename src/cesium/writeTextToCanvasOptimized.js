/**
 * Copy of writeTextToCanvas from Cesium, with added support for caching
 * results of calls to Cesium.measureText / using precalculated dimensions.
 * The reason is performance - every call to measureText is quite expensive,
 * because it triggers layout recalculation.
 */

import Cesium from "cesium";

const defined = Cesium.defined;
const defaultValue = Cesium.defaultValue;
const Color = Cesium.Color;

let imageSmoothingEnabledName;



export default function writeTextToCanvasOptimized(text, options) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(text)) {
    throw new Cesium.DeveloperError('text is required.');
  }
  //>>includeEnd('debug');
  if (text === '') {
    return undefined;
  }

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  var font = defaultValue(options.font, '10px sans-serif');
  var stroke = defaultValue(options.stroke, false);
  var fill = defaultValue(options.fill, true);
  var strokeWidth = defaultValue(options.strokeWidth, 1);
  var backgroundColor = defaultValue(options.backgroundColor, Color.TRANSPARENT);
  var padding = defaultValue(options.padding, 0);
  var doublePadding = padding * 2.0;

  var textMeasurementsCache = options.textMeasurementsCache;

  var canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  canvas.style.font = font;

  var context2D = canvas.getContext('2d');

  if (!defined(imageSmoothingEnabledName)) {
    if (defined(context2D.imageSmoothingEnabled)) {
      imageSmoothingEnabledName = 'imageSmoothingEnabled';
    } else if (defined(context2D.mozImageSmoothingEnabled)) {
      imageSmoothingEnabledName = 'mozImageSmoothingEnabled';
    } else if (defined(context2D.webkitImageSmoothingEnabled)) {
      imageSmoothingEnabledName = 'webkitImageSmoothingEnabled';
    } else if (defined(context2D.msImageSmoothingEnabled)) {
      imageSmoothingEnabledName = 'msImageSmoothingEnabled';
    }
  }

  context2D.font = font;
  context2D.lineJoin = 'round';
  context2D.lineWidth = strokeWidth;
  context2D[imageSmoothingEnabledName] = false;

  // textBaseline needs to be set before the measureText call. It won't work otherwise.
  // It's magic.
  context2D.textBaseline = defaultValue(options.textBaseline, 'bottom');

  // in order for measureText to calculate style, the canvas has to be
  // (temporarily) added to the DOM.
  canvas.style.visibility = 'hidden';
  document.body.appendChild(canvas);

  var dimensions;

  if (textMeasurementsCache[text]) {
    dimensions = textMeasurementsCache[text];
  } else {
    dimensions = textMeasurementsCache[text] = Cesium.measureText(context2D, text, stroke, fill);

    // NOTE:
    // When serializing textMeasurementsCache via JSON.stringify()
    // TextMetrics.width won't be serialized because it's a calculated property.
    // But it doesn't matter, since it's used only for calculation
    // of "computedWidth" which will be serialized.
    dimensions.computedWidth = Math.max(dimensions.width, dimensions.bounds.maxx - dimensions.bounds.minx);
  }

  //canvas.dimensions = dimensions;

  document.body.removeChild(canvas);
  canvas.style.visibility = '';

  var baseline = dimensions.height - dimensions.ascent + padding;
  canvas.width = dimensions.computedWidth + doublePadding;
  canvas.height = dimensions.height + doublePadding;
  var y = canvas.height - baseline;

  // Properties must be explicitly set again after changing width and height
  context2D.font = font;
  context2D.lineJoin = 'round';
  context2D.lineWidth = strokeWidth;
  context2D[imageSmoothingEnabledName] = false;

  // Draw background
  if (backgroundColor !== Color.TRANSPARENT) {
    context2D.fillStyle = backgroundColor.toCssColorString();
    context2D.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (stroke) {
    var strokeColor = defaultValue(options.strokeColor, Color.BLACK);
    context2D.strokeStyle = strokeColor.toCssColorString();
    context2D.strokeText(text, padding, y);
  }

  if (fill) {
    var fillColor = defaultValue(options.fillColor, Color.WHITE);
    context2D.fillStyle = fillColor.toCssColorString();
    context2D.fillText(text, padding, y);
  }

  return canvas;
}
