import * as utils from "../../utils/iframe";
import * as random from "../../utils/random";
import * as urlUtils from "../../utils/url";
import { EventEmitter } from "../../event/emitter";

const debug = (...args: any[]) => __DEBUG__ && console.log("[sockjs-client:receiver:jsonp]", ...args);

export class JsonpReceiver extends EventEmitter {
  id: string;
  timeoutId: ReturnType<typeof setTimeout>;
  script: HTMLScriptElement | null;
  loadedOkay: boolean;
  aborting: boolean;
  errorTimer: ReturnType<typeof setTimeout> | null;

  constructor(url: string) {
    super();
    debug(url);
    utils.polluteGlobalNamespace();

    this.id = "a" + random.string(6);
    this.script = null;
    this.loadedOkay = false;
    this.aborting = false;
    this.errorTimer = null;
    const urlWithId = urlUtils.addQuery(url, `c=${encodeURIComponent(`${utils.WPrefix}.${this.id}`)}`);

    (globalThis as any)[utils.WPrefix][this.id] = this._callback.bind(this);
    this._createScript(urlWithId);

    this.timeoutId = setTimeout(() => {
      debug("timeout");
      this._abort(new Error("JSONP script loaded abnormally (timeout)"));
    }, JsonpReceiver.timeout);
  }

  abort(): void {
    debug("abort");
    if ((globalThis as any)[utils.WPrefix][this.id]) {
      const err: any = new Error("JSONP user aborted read");
      err.code = 1000;
      this._abort(err);
    }
  }

  static timeout: number = 35000;
  static scriptErrorTimeout: number = 1000;

  _callback(data: any): void {
    debug("_callback", data);
    this._cleanup();

    if (this.aborting) {
      return;
    }

    if (data) {
      debug("message", data);
      this.emit("message", data);
    }
    this.emit("close", null, "network");
    this.removeAllListeners();
  }

  _abort(err: Error & { code?: number }): void {
    debug("_abort", err);
    this._cleanup();
    this.aborting = true;
    this.emit("close", err.code, err.message);
    this.removeAllListeners();
  }

  _cleanup(): void {
    debug("_cleanup");
    clearTimeout(this.timeoutId);
    if (this.script) {
      const script = this.script;
      script.parentNode!.removeChild(script);
      script.onerror = script.onload = null;
      this.script = null;
    }
    delete (globalThis as any)[utils.WPrefix][this.id];
  }

  _scriptError(): void {
    debug("_scriptError");
    if (this.errorTimer) {
      return;
    }

    this.errorTimer = setTimeout(() => {
      if (!this.loadedOkay) {
        this._abort(new Error("JSONP script loaded abnormally (onerror)"));
      }
    }, JsonpReceiver.scriptErrorTimeout);
  }

  _createScript(url: string): void {
    debug("_createScript", url);
    const script = (this.script = (globalThis as any).document.createElement("script"));

    script.id = "a" + random.string(8);
    script.src = url;
    script.type = "text/javascript";
    script.charset = "UTF-8";
    script.async = true;
    script.onerror = this._scriptError.bind(this);
    script.onload = () => {
      debug("onload");
      this._abort(new Error("JSONP script loaded abnormally (onload)"));
    };

    const head = (globalThis as any).document.getElementsByTagName("head")[0];
    head.insertBefore(script, head.firstChild);
  }
}
