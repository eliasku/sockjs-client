import { EventEmitter } from "./event/emitter";
import * as eventUtils from "./utils/event";
import { IframeTransport } from "./transport/iframe";
import { InfoReceiverIframe } from "./info-iframe-receiver";

const debug = (...args: any[]) => console.log("[sockjs-client:info-iframe]", ...args);

class InfoIframe extends EventEmitter {
  static enabled: () => boolean;
  ifr: any;

  constructor(baseUrl: string, url: string) {
    super();
    const self = this;

    const go = function () {
      const ifr = (self.ifr = new IframeTransport(InfoReceiverIframe.transportName, url, baseUrl));

      ifr.once("message", function (msg: string) {
        if (msg) {
          let d: any[];
          try {
            d = JSON.parse(msg);
          } catch {
            debug("bad json", msg);
            self.emit("finish");
            self.close();
            return;
          }

          const info = d[0],
            rtt = d[1];
          self.emit("finish", info, rtt);
        }
        self.close();
      });

      ifr.once("close", function () {
        self.emit("finish");
        self.close();
      });
    };

    if (!(globalThis as any).document.body) {
      eventUtils.attachEvent("load", go);
    } else {
      go();
    }
  }

  close(): void {
    if (this.ifr) {
      this.ifr.close();
    }
    this.removeAllListeners();
    this.ifr = null;
  }
}

InfoIframe.enabled = function () {
  return IframeTransport.enabled();
};

export { InfoIframe };
