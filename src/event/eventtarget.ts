class EventTarget {
  _listeners: Record<string, Function[]>;

  constructor() {
    this._listeners = {};
  }

  addEventListener(eventType: string, listener: Function): void {
    if (!(eventType in this._listeners)) {
      this._listeners[eventType] = [];
    }
    let arr = this._listeners[eventType] || [];
    if (arr.indexOf(listener) === -1) {
      arr = arr.concat([listener]);
    }
    this._listeners[eventType] = arr;
  }

  removeEventListener(eventType: string, listener: Function): void {
    const arr = this._listeners[eventType];
    if (!arr) {
      return;
    }
    const idx = arr.indexOf(listener);
    if (idx !== -1) {
      if (arr.length > 1) {
        this._listeners[eventType] = arr.slice(0, idx).concat(arr.slice(idx + 1));
      } else {
        delete this._listeners[eventType];
      }
    }
  }

  dispatchEvent(...args: any[]): void {
    const event = arguments[0];
    const t = event.type;
    const argsArray = arguments.length === 1 ? [event] : Array.apply(null, arguments as any);
    const onHandler = (this as any)["on" + t];
    if (onHandler) {
      onHandler.apply(this, argsArray);
    }
    const listeners = this._listeners[t];
    if (listeners) {
      for (let i = 0; i < listeners.length; i++) {
        const listener = listeners[i];
        if (listener) {
          listener.apply(this, argsArray);
        }
      }
    }
  }
}

export { EventTarget };
