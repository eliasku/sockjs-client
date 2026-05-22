import { EventEmitter } from "./event/emitter";
import * as objectUtils from "./utils/object";

const debug = (...args: any[]) => __DEBUG__ && console.log("[sockjs-client:info-ajax]", ...args);

export class InfoAjax extends EventEmitter {
  xo: any;

  constructor(url: string, AjaxObject: any) {
    super();
    const t0 = Date.now();
    this.xo = new AjaxObject("GET", url);

    this.xo.once("finish", (status: number, text: string) => {
      let info: any;
      let rtt: number | undefined;
      if (status === 200) {
        rtt = Date.now() - t0;
        if (text) {
          try {
            info = JSON.parse(text);
          } catch {
            debug("bad json", text);
          }
        }

        if (!objectUtils.isObject(info)) {
          info = {};
        }
      }
      this.emit("finish", info, rtt, status);
      this.removeAllListeners();
    });
  }

  close(): void {
    this.removeAllListeners();
    this.xo.close();
  }
}
