import * as utils from "../../utils/iframe";
import * as random from "../../utils/random";
import * as browser from "../../utils/browser";
import * as urlUtils from "../../utils/url";
import { EventEmitter } from "../../event/emitter";

const debug = (...args: any[]) => console.log("[sockjs-client:receiver:jsonp]", ...args);

class JsonpReceiver extends EventEmitter {
  id: string;
  timeoutId: ReturnType<typeof setTimeout>;
  script: HTMLScriptElement | null;
  script2: HTMLScriptElement | null;
  loadedOkay: boolean;
  aborting: boolean;
  errorTimer: ReturnType<typeof setTimeout> | null;

  constructor(url: string) {
    super();
    debug(url);
    const self = this;

    utils.polluteGlobalNamespace();

    this.id = "a" + random.string(6);
    this.script = null;
    this.script2 = null;
    this.loadedOkay = false;
    this.aborting = false;
    this.errorTimer = null;
    const urlWithId = urlUtils.addQuery(url, `c=${encodeURIComponent(`${utils.WPrefix}.${this.id}`)}`);

    (globalThis as any)[utils.WPrefix][this.id] = this._callback.bind(this);
    this._createScript(urlWithId);

    this.timeoutId = setTimeout(function () {
      debug("timeout");
      self._abort(new Error("JSONP script loaded abnormally (timeout)"));
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
    if (this.script2) {
      this.script2.parentNode!.removeChild(this.script2);
      this.script2 = null;
    }
    if (this.script) {
      const script = this.script;
      script.parentNode!.removeChild(script);
      (script as any).onreadystatechange = script.onerror = script.onload = script.onclick = null as any;
      this.script = null;
    }
    delete (globalThis as any)[utils.WPrefix][this.id];
  }

  _scriptError(): void {
    debug("_scriptError");
    const self = this;
    if (this.errorTimer) {
      return;
    }

    this.errorTimer = setTimeout(function () {
      if (!self.loadedOkay) {
        self._abort(new Error("JSONP script loaded abnormally (onerror)"));
      }
    }, JsonpReceiver.scriptErrorTimeout);
  }

  _createScript(url: string): void {
    debug("_createScript", url);
    const self = this;
    const script = (this.script = (globalThis as any).document.createElement("script"));
    let script2: HTMLScriptElement | null = null;

    script.id = "a" + random.string(8);
    script.src = url;
    script.type = "text/javascript";
    script.charset = "UTF-8";
    script.onerror = this._scriptError.bind(this);
    script.onload = function () {
      debug("onload");
      self._abort(new Error("JSONP script loaded abnormally (onload)"));
    };

    (script as any).onreadystatechange = function () {
      debug("onreadystatechange", script.readyState);
      if (/loaded|closed/.test(script.readyState)) {
        if (script && (script as any).htmlFor && (script as any).onclick) {
          self.loadedOkay = true;
          try {
            (script as any).onclick();
          } catch (x) {
            // intentionally empty
          }
        }
        if (script) {
          self._abort(new Error("JSONP script loaded abnormally (onreadystatechange)"));
        }
      }
    };

    if (typeof script.async === "undefined" && (globalThis as any).document.attachEvent) {
      if (!browser.isOpera()) {
        try {
          (script as any).htmlFor = script.id;
          (script as any).event = "onclick";
        } catch (x) {
          // intentionally empty
        }
        script.async = true;
      } else {
        script2 = this.script2 = (globalThis as any).document.createElement("script");
        script2!.text = `try{var a = document.getElementById('${script.id}'); if(a)a.onerror();}catch(x){};`;
        script.async = script2!.async = false;
      }
    }
    if (typeof script.async !== "undefined") {
      script.async = true;
    }

    const head = (globalThis as any).document.getElementsByTagName("head")[0];
    head.insertBefore(script, head.firstChild);
    if (script2) {
      head.insertBefore(script2, head.firstChild);
    }
  }
}

export { JsonpReceiver };
