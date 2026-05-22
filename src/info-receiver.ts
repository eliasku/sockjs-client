import { EventEmitter } from "./event/emitter";
import * as urlUtils from "./utils/url";
import { XHRCorsObject } from "./transport/sender/xhr-cors";
import { XHRLocalObject } from "./transport/sender/xhr-local";
import { XHRFake } from "./transport/sender/xhr-fake";
import { InfoIframe } from "./info-iframe";
import { InfoAjax } from "./info-ajax";

const debug = (...args: any[]) => console.log("[sockjs-client:info-receiver]", ...args);

export class InfoReceiver extends EventEmitter {
  static _getReceiver: (baseUrl: string, url: string, urlInfo: any) => any;
  static timeout: number = 8000;
  xo: any;
  timeoutRef: any;

  constructor(baseUrl: string, urlInfo: any) {
    super();
    debug(baseUrl);
    setTimeout(() => {
      this.doXhr(baseUrl, urlInfo);
    }, 0);
  }

  doXhr(baseUrl: string, urlInfo: any): void {
    const url = urlUtils.addPath(baseUrl, "/info");
    debug("doXhr", url);

    this.xo = InfoReceiver._getReceiver(baseUrl, url, urlInfo);

    this.timeoutRef = setTimeout(() => {
      debug("timeout");
      this._cleanup(false);
      this.emit("finish");
    }, InfoReceiver.timeout);

    this.xo.once("finish", (info: any, rtt: number, status: number) => {
      debug("finish", info, rtt);
      this._cleanup(true);
      this.emit("finish", info, rtt, status);
    });
  }

  _cleanup(wasClean: boolean): void {
    debug("_cleanup");
    clearTimeout(this.timeoutRef);
    this.timeoutRef = null;
    if (!wasClean && this.xo) {
      this.xo.close();
    }
    this.xo = null;
  }

  close(): void {
    debug("close");
    this.removeAllListeners();
    this._cleanup(false);
  }
}

InfoReceiver._getReceiver = function (baseUrl: string, url: string, urlInfo: any): any {
  if (urlInfo.sameOrigin) {
    return new InfoAjax(url, XHRLocalObject);
  }
  if (XHRCorsObject.enabled) {
    return new InfoAjax(url, XHRCorsObject);
  }
  if (InfoIframe.enabled()) {
    return new InfoIframe(baseUrl, url);
  }
  return new InfoAjax(url, XHRFake);
};
