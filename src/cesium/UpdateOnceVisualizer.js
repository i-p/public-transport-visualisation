
export default class UpdateOnceVisualizer {
  constructor(inner) {
    this._inner = inner;
    this._updateCalled = false;
  }
  update(time) {
    if (this._updateCalled) {
      return true;
    }
    this._updateCalled = true;
    return this._inner.update(time)
  }
  getBoundingSphere(entity, result) {
    return this._inner.getBoundingSphere(entity, result);
  }
  isDestroyed() { return this._inner.isDestroyed; }
  destroy() { return this._inner.destroy(); }
}
