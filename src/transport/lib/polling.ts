import { EventEmitter } from "../../event/emitter";

const debug = (...args: any[]) => __DEBUG__ && console.log("[sockjs-client:polling]", ...args);

export class Polling extends EventEmitter {
  Receiver: any;
  receiveUrl: string;
  AjaxObject: any;
  poll: any;
  pollIsClosing: boolean;

  constructor(Receiver: any, receiveUrl: string, AjaxObject: any) {
    super();
    debug(receiveUrl);
    this.Receiver = Receiver;
    this.receiveUrl = receiveUrl;
    this.AjaxObject = AjaxObject;
    this.pollIsClosing = false;
    this._scheduleReceiver();
  }

  _scheduleReceiver(): void {
    debug("_scheduleReceiver");
    let poll = (this.poll = new this.Receiver(this.receiveUrl, this.AjaxObject));

    poll.on("message", (msg: string) => {
      debug("message", msg);
      this.emit("message", msg);
    });

    poll.once("close", (code: number, reason: string) => {
      debug("close", code, reason, this.pollIsClosing);
      this.poll = poll = null;

      if (!this.pollIsClosing) {
        if (reason === "network") {
          this._scheduleReceiver();
        } else {
          this.emit("close", code || 1006, reason);
          this.removeAllListeners();
        }
      }
    });
  }

  abort(): void {
    debug("abort");
    this.removeAllListeners();
    this.pollIsClosing = true;
    if (this.poll) {
      this.poll.abort();
    }
  }
}
