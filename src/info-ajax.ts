import { EventEmitter } from "./event/emitter";
import * as objectUtils from "./utils/object";

const debug = (...args: any[]) => console.log("[sockjs-client:info-ajax]", ...args);

class InfoAjax extends EventEmitter {
  xo: any;

  constructor(url: string, AjaxObject: any) {
    super();
    const self = this;
    const t0 = +new Date();
    this.xo = new AjaxObject("GET", url);

    this.xo.once("finish", function (status: number, text: string) {
      let info: any;
      let rtt: number | undefined;
      if (status === 200) {
        rtt = +new Date() - t0;
        if (text) {
          try {
            info = JSON.parse(text);
          } catch (e) {
            debug("bad json", text);
          }
        }

        if (!objectUtils.isObject(info)) {
          info = {};
        }
      }
      self.emit("finish", info, rtt, status);
      self.removeAllListeners();
    });
  }

  close(): void {
    this.removeAllListeners();
    this.xo.close();
  }
}

export { InfoAjax };
