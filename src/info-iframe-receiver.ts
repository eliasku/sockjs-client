import { EventEmitter } from "./event/emitter";
import { XHRLocalObject } from "./transport/sender/xhr-local";
import { InfoAjax } from "./info-ajax";

class InfoReceiverIframe extends EventEmitter {
  static transportName: string;
  ir: any;

  constructor(transUrl: string) {
    super();
    const self = this;
    this.ir = new InfoAjax(transUrl, XHRLocalObject);
    this.ir.once("finish", function (info: any, rtt: number) {
      self.ir = null;
      self.emit("message", JSON.stringify([info, rtt]));
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

export { InfoReceiverIframe };
