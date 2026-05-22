import { EventEmitter } from "../../event/emitter";
import * as utils from "../../utils/event";
import * as urlUtils from "../../utils/url";

const XHR: any = (globalThis as any).XMLHttpRequest;

const debug = (...args: any[]) => __DEBUG__ && console.log("[sockjs-client:browser:xhr]", ...args);

export class AbstractXHRObject extends EventEmitter {
  xhr!: XMLHttpRequest;
  unloadRef: any;
  timeout: number | undefined;

  static enabled: boolean = !!XHR;
  static supportsCORS: boolean;

  constructor(method: string, url: string, payload?: string | null, opts?: any) {
    super();
    debug(method, url);
    setTimeout(() => {
      this._start(method, url, payload, opts);
    }, 0);
  }

  _start(method: string, url: string, payload?: string | null, opts?: any): void {
    try {
      this.xhr = new XHR();
    } catch {
      // intentionally empty
    }

    if (!this.xhr) {
      debug("no xhr");
      this.emit("finish", 0, "no xhr support");
      this._cleanup(false);
      return;
    }

    url = urlUtils.addQuery(url, `t=${Date.now()}`);

    this.unloadRef = utils.unloadAdd(() => {
      debug("unload cleanup");
      this._cleanup(true);
    });
    try {
      this.xhr.open(method, url, true);
      if (this.timeout && "timeout" in this.xhr) {
        this.xhr.timeout = this.timeout;
        this.xhr.ontimeout = () => {
          debug("xhr timeout");
          this.emit("finish", 0, "");
          this._cleanup(false);
        };
      }
    } catch (e) {
      debug("exception", e);
      this.emit("finish", 0, "");
      this._cleanup(false);
      return;
    }

    if ((!opts || !opts.noCredentials) && AbstractXHRObject.supportsCORS) {
      debug("withCredentials");
      this.xhr.withCredentials = true;
    }
    if (opts && opts.headers) {
      for (const key in opts.headers) {
        this.xhr.setRequestHeader(key, opts.headers[key]);
      }
    }

    this.xhr.onreadystatechange = () => {
      if (this.xhr) {
        const x = this.xhr;
        let text: string | undefined;
        let status: number | undefined;
        debug("readyState", x.readyState);
        switch (x.readyState) {
          case 3:
            try {
              status = x.status;
              text = x.responseText;
            } catch {
              // intentionally empty
            }
            debug("status", status);

            if (status === 200 && text && text.length > 0) {
              debug("chunk");
              this.emit("chunk", status, text);
            }
            break;
          case 4:
            status = x.status;
            debug("status", status);

            debug("finish", status, x.responseText);
            this.emit("finish", status, x.responseText);
            this._cleanup(false);
            break;
        }
      }
    };

    try {
      this.xhr.send(payload);
    } catch {
      this.emit("finish", 0, "");
      this._cleanup(false);
    }
  }

  _cleanup(abort: boolean): void {
    debug("cleanup");
    if (!this.xhr) {
      return;
    }
    this.removeAllListeners();
    utils.unloadDel(this.unloadRef);

    this.xhr.onreadystatechange = function () {};
    if ((this.xhr as any).ontimeout) {
      (this.xhr as any).ontimeout = null;
    }

    if (abort) {
      try {
        this.xhr.abort();
      } catch {
        // intentionally empty
      }
    }
    this.unloadRef = this.xhr = null as any;
  }

  close(): void {
    debug("close");
    this._cleanup(true);
  }
}

AbstractXHRObject.supportsCORS = typeof XHR === "function" && "withCredentials" in XHR.prototype;
