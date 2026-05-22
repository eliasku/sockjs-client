import { EventEmitter } from "../../event/emitter";

const EventSourceBrowserDriver: any = (globalThis as any).EventSource;

const debug = (...args: any[]) => console.log("[sockjs-client:receiver:eventsource]", ...args);

function decodeURISafe(s: string): string {
  return decodeURI(s.replace(/%(?![0-9][0-9a-fA-F]+)/g, "%25"));
}

export class EventSourceReceiver extends EventEmitter {
  es: any;

  constructor(url: string) {
    super();
    debug(url);

    const es = (this.es = new EventSourceBrowserDriver(url));
    es.onmessage = (e: any) => {
      debug("message", e.data);
      this.emit("message", decodeURISafe(e.data));
    };
    es.onerror = (e: any) => {
      debug("error", es.readyState, e);
      const reason = es.readyState !== 2 ? "network" : "permanent";
      this._cleanup();
      this._close(reason);
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
    setTimeout(() => {
      this.emit("close", null, reason);
      this.removeAllListeners();
    }, 200);
  }
}
