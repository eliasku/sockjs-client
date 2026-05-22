import * as utils from "../utils/event";
import * as urlUtils from "../utils/url";
import { EventEmitter } from "../event/emitter";
import { WebSocketBrowserDriver } from "./browser/websocket";

const debug = (...args: any[]) => console.log("[sockjs-client:websocket]", ...args);

export class WebSocketTransport extends EventEmitter {
  url: string;
  ws: any;
  unloadRef: any;

  static enabled: any;
  static transportName: string = "websocket";
  static roundTrips: number = 2;

  constructor(transUrl: string, ignore?: any, options?: any) {
    super();
    if (!WebSocketTransport.enabled()) {
      throw new Error("Transport created when disabled");
    }

    debug("constructor", transUrl);

    let url = urlUtils.addPath(transUrl, "/websocket");
    if (url.slice(0, 5) === "https") {
      url = `wss${url.slice(5)}`;
    } else {
      url = `ws${url.slice(4)}`;
    }
    this.url = url;

    this.ws = WebSocketBrowserDriver ? WebSocketBrowserDriver(this.url, [], options) : null;
    if (!this.ws) {
      throw new Error("WebSocket not available");
    }
    this.ws.onmessage = (e: any) => {
      debug("message event", e.data);
      this.emit("message", e.data);
    };
    this.unloadRef = utils.unloadAdd(() => {
      debug("unload");
      this.ws.close();
    });
    this.ws.onclose = (e: any) => {
      debug("close event", e.code, e.reason);
      this.emit("close", e.code, e.reason);
      this._cleanup();
    };
    this.ws.onerror = (e: any) => {
      debug("error event", e);
      this.emit("close", 1006, "WebSocket connection broken");
      this._cleanup();
    };
  }

  send(data: string): void {
    const msg = `[${data}]`;
    debug("send", msg);
    this.ws.send(msg);
  }

  close(): void {
    debug("close");
    const ws = this.ws;
    this._cleanup();
    if (ws) {
      ws.close();
    }
  }

  _cleanup(): void {
    debug("_cleanup");
    const ws = this.ws;
    if (ws) {
      ws.onmessage = ws.onclose = ws.onerror = null;
    }
    utils.unloadDel(this.unloadRef);
    this.unloadRef = this.ws = null;
    this.removeAllListeners();
  }
}

WebSocketTransport.enabled = function (): boolean {
  debug("enabled");
  return !!WebSocketBrowserDriver;
};
