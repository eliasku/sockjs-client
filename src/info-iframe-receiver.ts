import { EventEmitter } from "./event/emitter";
import { XHRLocalObject } from "./transport/sender/xhr-local";
import { InfoAjax } from "./info-ajax";

export class InfoReceiverIframe extends EventEmitter {
  static transportName: string;
  ir: any;

  constructor(transUrl: string) {
    super();
    this.ir = new InfoAjax(transUrl, XHRLocalObject);
    this.ir.once("finish", (info: any, rtt: number) => {
      this.ir = null;
      this.emit("message", JSON.stringify([info, rtt]));
    });
  }

  close(): void {
    if (this.ir) {
      this.ir.close();
      this.ir = null;
    }
    this.removeAllListeners();
  }
}

InfoReceiverIframe.transportName = "iframe-info-receiver";
