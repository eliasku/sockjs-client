import { EventTarget } from "./eventtarget";

class EventEmitter extends EventTarget {
  on(type: string, listener: Function): void {
    this.addEventListener(type, listener);
  }

  addListener(type: string, listener: Function): void {
    this.addEventListener(type, listener);
  }

  removeListener(type: string, listener: Function): void {
    this.removeEventListener(type, listener);
  }

  removeAllListeners(type?: string): void {
    if (type) {
      delete this._listeners[type];
    } else {
      this._listeners = {};
    }
  }

  once(type: string, listener: Function): void {
    const self = this;
    let fired = false;

    function g(this: any, ...args: any[]) {
      self.removeListener(type, g);
      if (!fired) {
        fired = true;
        listener.apply(this, args);
      }
    }

    this.on(type, g);
  }

  emit(type: string, ...args: any[]): void {
    const listeners = this._listeners[type];
    if (!listeners) {
      return;
    }
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      if (listener) {
        listener.apply(this, args);
      }
    }
  }
}

export { EventEmitter };
