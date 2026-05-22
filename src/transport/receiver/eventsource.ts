import { EventEmitter } from "../../event/emitter";

const EventSourceBrowserDriver: any = (globalThis as any).EventSource;

const debug = (...args: any[]) => console.log("[sockjs-client:receiver:eventsource]", ...args);

function decodeURISafe(s: string): string {
  return decodeURI(s.replace(/%(?![0-9][0-9a-fA-F]+)/g, "%25"));
}

class EventSourceReceiver extends EventEmitter {
  es: any;

  constructor(url: string) {
    super();
    debug(url);

    const self = this;
    const es = (this.es = new EventSourceBrowserDriver(url));
    es.onmessage = function (e: any) {
      debug("message", e.data);
      self.emit("message", decodeURISafe(e.data));
    };
    es.onerror = function (e: any) {
      debug("error", es.readyState, e);
      const reason = es.readyState !== 2 ? "network" : "permanent";
      self._cleanup();
      self._close(reason);
    };
  }

  abort(): void {
    debug("abort");
    this._cleanup();
    this._close("user");
  }

  _cleanup(): void {
    debug("cleanup");
    const es = this.es;
    if (es) {
      es.onmessage = es.onerror = null;
      es.close();
      this.es = null;
    }
  }

  _close(reason: string): void {
    debug("close", reason);
    const self = this;
    setTimeout(function () {
      self.emit("close", null, reason);
      self.removeAllListeners();
    }, 200);
  }
}

export { EventSourceReceiver };
