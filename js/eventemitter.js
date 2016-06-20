export default class EventEmitter {
  constructor() {
    this._listeners = {};
  }
  on(event, listener) {
    this._listeners[event] = this._listeners[event] || [];
    this._listeners[event].push(listener);
  }
  once(event, listener) {
    let tmpHandler = (...params) => {
      this.removeListener(event, tmpHandler);
      listener.apply(this, params);
    };
    this.on(event, tmpHandler);
  }
  removeListener(event, listener) {
    if (this._listeners[event]) {
      this._listeners[event] = this._listeners[event].filter(func => func !== listener);
    }
  }
  emit(event, ...params) {
    if (this._listeners[event]) {
      this._listeners[event].forEach(listener => {
        listener.apply(this, params);
      });
    }
  }
}
