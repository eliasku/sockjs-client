import { EventEmitter } from "../../event/emitter";

const debug = (...args: any[]) => console.log("[sockjs-client:polling]", ...args);

class Polling extends EventEmitter {
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
    const self = this;
    let poll = (this.poll = new this.Receiver(this.receiveUrl, this.AjaxObject));

    poll.on("message", function (msg: string) {
      debug("message", msg);
      self.emit("message", msg);
    });

    poll.once("close", function (code: number, reason: string) {
      debug("close", code, reason, self.pollIsClosing);
      self.poll = poll = null;

      if (!self.pollIsClosing) {
        if (reason === "network") {
          self._scheduleReceiver();
        } else {
          self.emit("close", code || 1006, reason);
          self.removeAllListeners();
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

export { Polling };
