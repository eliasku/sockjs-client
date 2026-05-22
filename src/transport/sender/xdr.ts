import { EventEmitter } from "../../event/emitter";
import * as eventUtils from "../../utils/event";
import * as browser from "../../utils/browser";
import * as urlUtils from "../../utils/url";

const debug = (...args: any[]) => console.log("[sockjs-client:sender:xdr]", ...args);

class XDRObject extends EventEmitter {
  xdr: any;
  unloadRef: any;
  timeout: number | undefined;

  static enabled: boolean;

  constructor(method: string, url: string, payload?: string) {
    super();
    debug(method, url);
    const self = this;

    setTimeout(function () {
      self._start(method, url, payload);
    }, 0);
  }

  _start(method: string, url: string, payload?: string): void {
    debug("_start");
    const self = this;
    const xdr = new (globalThis as any).XDomainRequest();
    url = urlUtils.addQuery(url, "t=" + +new Date());

    xdr.onerror = function () {
      debug("onerror");
      self._error();
    };
    xdr.ontimeout = function () {
      debug("ontimeout");
      self._error();
    };
    xdr.onprogress = function () {
      debug("progress", xdr.responseText);
      self.emit("chunk", 200, xdr.responseText);
    };
    xdr.onload = function () {
      debug("load");
      self.emit("finish", 200, xdr.responseText);
      self._cleanup(false);
    };
    this.xdr = xdr;
    this.unloadRef = eventUtils.unloadAdd(function () {
      self._cleanup(true);
    });
    try {
      this.xdr.open(method, url);
      if (this.timeout) {
        this.xdr.timeout = this.timeout;
      }
      this.xdr.send(payload);
    } catch (x) {
      this._error();
    }
  }

  _error(): void {
    this.emit("finish", 0, "");
    this._cleanup(false);
  }

  _cleanup(abort: boolean): void {
    debug("cleanup", abort);
    if (!this.xdr) {
      return;
    }
    this.removeAllListeners();
    eventUtils.unloadDel(this.unloadRef);

    this.xdr.ontimeout = this.xdr.onerror = this.xdr.onprogress = this.xdr.onload = null;
    if (abort) {
      try {
        this.xdr.abort();
      } catch (x) {
        // intentionally empty
      }
    }
    this.unloadRef = this.xdr = null;
  }

  close(): void {
    debug("close");
    this._cleanup(true);
  }
}

XDRObject.enabled = !!(globalThis as any).XDomainRequest && browser.hasDomain();

export { XDRObject };
