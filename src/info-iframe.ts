import { EventEmitter } from "./event/emitter";
import * as eventUtils from "./utils/event";
import { IframeTransport } from "./transport/iframe";
import { InfoReceiverIframe } from "./info-iframe-receiver";

const debug = (...args: any[]) => console.log("[sockjs-client:info-iframe]", ...args);

export class InfoIframe extends EventEmitter {
  static enabled: () => boolean;
  ifr: any;

  constructor(baseUrl: string, url: string) {
    super();
    const go = () => {
      const ifr = (this.ifr = new IframeTransport(InfoReceiverIframe.transportName, url, baseUrl));

      ifr.once("message", (msg: string) => {
        if (msg) {
          let d: any[];
          try {
            d = JSON.parse(msg);
          } catch {
            debug("bad json", msg);
            this.emit("finish");
            this.close();
            return;
          }

          const info = d[0],
            rtt = d[1];
          this.emit("finish", info, rtt);
        }
        this.close();
      });

      ifr.once("close", () => {
        this.emit("finish");
        this.close();
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
