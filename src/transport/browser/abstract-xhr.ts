import { EventEmitter } from "../../event/emitter";
import * as utils from "../../utils/event";
import * as urlUtils from "../../utils/url";

const XHR: any = (globalThis as any).XMLHttpRequest;

const debug = (...args: any[]) => console.log("[sockjs-client:browser:xhr]", ...args);

class AbstractXHRObject extends EventEmitter {
  xhr!: XMLHttpRequest;
  unloadRef: any;
  timeout: number | undefined;

  static enabled: boolean = !!XHR;
  static supportsCORS: boolean;

  constructor(method: string, url: string, payload?: string | null, opts?: any) {
    super();
    debug(method, url);
    const self = this;

    setTimeout(function () {
      self._start(method, url, payload, opts);
    }, 0);
  }

  _start(method: string, url: string, payload?: string | null, opts?: any): void {
    const self = this;

    try {
      this.xhr = new XHR();
    } catch (x) {
      // intentionally empty
    }

    if (!this.xhr) {
      debug("no xhr");
      this.emit("finish", 0, "no xhr support");
      this._cleanup(false);
      return;
    }

    url = urlUtils.addQuery(url, "t=" + +new Date());

    this.unloadRef = utils.unloadAdd(function () {
      debug("unload cleanup");
      self._cleanup(true);
    });
    try {
      this.xhr.open(method, url, true);
      if (this.timeout && "timeout" in this.xhr) {
        this.xhr.timeout = this.timeout;
        this.xhr.ontimeout = function () {
          debug("xhr timeout");
          self.emit("finish", 0, "");
          self._cleanup(false);
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

    this.xhr.onreadystatechange = function () {
      if (self.xhr) {
        const x = self.xhr;
        let text: string | undefined;
        let status: number | undefined;
        debug("readyState", x.readyState);
        switch (x.readyState) {
          case 3:
            try {
              status = x.status;
              text = x.responseText;
            } catch (e) {
              // intentionally empty
            }
            debug("status", status);
            if (status === 1223) {
              status = 204;
            }

            if (status === 200 && text && text.length > 0) {
              debug("chunk");
              self.emit("chunk", status, text);
            }
            break;
          case 4:
            status = x.status;
            debug("status", status);
            if (status === 1223) {
              status = 204;
            }
            if (status === 12005 || status === 12029) {
              status = 0;
            }

            debug("finish", status, x.responseText);
            self.emit("finish", status, x.responseText);
            self._cleanup(false);
            break;
        }
      }
    };

    try {
      this.xhr.send(payload);
    } catch (e) {
      self.emit("finish", 0, "");
      self._cleanup(false);
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
      } catch (x) {
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

let _XHR: any = XHR;
const axo = ["Active"].concat("Object").join("X");
if (!AbstractXHRObject.enabled && axo in globalThis) {
  debug("overriding xmlhttprequest");
  _XHR = function () {
    try {
      return new (globalThis as any)[axo]("Microsoft.XMLHTTP");
    } catch (e) {
      return null;
    }
  };
  AbstractXHRObject.enabled = !!new _XHR();
}

let cors = false;
try {
  cors = "withCredentials" in new _XHR();
} catch (ignored) {
  // intentionally empty
}

AbstractXHRObject.supportsCORS = cors;

export { AbstractXHRObject };
