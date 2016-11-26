const HIDDEN = -1;

function getSeparationDistance(l1, l2) {
  let dx = Math.abs(l1.screenSpacePosition.x - l2.screenSpacePosition.x);
  let dy = Math.abs(l1.screenSpacePosition.y - l2.screenSpacePosition.y);

  let sx = dx - (l1.width * l1.scale  + l2.width * l2.scale)/2;
  let sy = dy - (l1.height * l1.scale + l2.height * l2.scale)/2;

  return Math.max(sx, sy);
}

export class LabelIntersections {
  constructor({columns, rows}) {
    this.columns = columns;
    this.rows = rows;

    this.grid = new Array(columns * rows);

    for (let i=0; i<this.grid.length; i++) {
      this.grid[i] = [];
    }
  }

  prepare(labels, canvas) {
    let len = labels.length;
    let h = canvas.height;
    let w = canvas.width;

    let maxLabelWidth = 0;
    let maxLabelHeight = 0;

    this._clear();

    for (let i=1; i<len; i++) {
      let label = labels.get(i);

      if (!label.screenSpacePosition) continue;

      let column = (label.screenSpacePosition.x / w * this.columns) | 0;
      let row = (label.screenSpacePosition.y / h * this.rows) | 0;

      if (column < 0 || column > this.columns - 1) {
        label.screenSpacePosition = null;
        continue;
      }
      if (row < 0 || row > this.rows - 1) {
        label.screenSpacePosition = null;
        continue;
      }

      let index = row * this.columns + column;

      label.row = row;
      label.column = column;

      this.grid[index].push(label);

      maxLabelHeight = Math.max(maxLabelHeight, label.height * label.scale);
      maxLabelWidth = Math.max(maxLabelWidth, label.width * label.scale);
    }

    this.maxLabelHeight = maxLabelHeight;
    this.maxLabelWidth = maxLabelWidth;
    this.height = h;
    this.width = w;
  }

  _clear() {
    this.grid.forEach(arr => arr.length = 0);
  }

  _xToColumn(x) {
    return (x / this.width * this.columns) | 0;
  }

  _yToRow(y) {
    return (y / this.height * this.rows) | 0
  }

  intersectsWithVisibleLabel(labelToTest, minimalSeparation) {
    let minimalXDistance = labelToTest.width  * labelToTest.scale / 2 + minimalSeparation + this.maxLabelWidth  / 2;
    let minimalYDistance = labelToTest.height * labelToTest.scale / 2 + minimalSeparation + this.maxLabelHeight / 2;

    let left    = this._xToColumn(labelToTest.screenSpacePosition.x - minimalXDistance);
    let right   = this._xToColumn(labelToTest.screenSpacePosition.x + minimalXDistance);
    let top     = this._yToRow(labelToTest.screenSpacePosition.y - minimalYDistance);
    let bottom  = this._yToRow(labelToTest.screenSpacePosition.y + minimalYDistance);

    for (let c = Math.max(left, 0); c <= Math.min(right, this.columns - 1); c++) {
      for (let r = Math.max(top, 0); r <= Math.min(bottom, this.rows - 1); r++) {

        let index = r * this.columns + c;

        let cell = this.grid[index];

        for (let i=0; i<cell.length; i++) {
          let otherLabel = cell[i];

          if (otherLabel === labelToTest || !otherLabel.screenSpacePosition || otherLabel.next === HIDDEN) continue;

          let dist = getSeparationDistance(labelToTest, otherLabel);
          if (dist <= minimalSeparation) {
            return true;
          }
        }
      }
    }

    return false;
  }
}
