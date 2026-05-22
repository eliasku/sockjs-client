import * as urlUtils from "../../utils/url";
import { BufferedSender } from "./buffered-sender";
import { Polling } from "./polling";

const debug = (...args: any[]) => console.log("[sockjs-client:sender-receiver]", ...args);

class SenderReceiver extends BufferedSender {
  poll: Polling | null;

  constructor(transUrl: string, urlSuffix: string, senderFunc: any, Receiver: any, AjaxObject?: any) {
    const pollUrl = urlUtils.addPath(transUrl, urlSuffix);
    debug(pollUrl);
    super(transUrl, senderFunc);
    const self = this;
    this.poll = new Polling(Receiver, pollUrl, AjaxObject);
    this.poll.on("message", function (msg: string) {
      debug("poll message", msg);
      self.emit("message", msg);
    });
    this.poll.once("close", function (code: number, reason: string) {
      debug("poll close", code, reason);
      self.poll = null;
      self.emit("close", code, reason);
      self.close();
    });
  }

  override close(): void {
    BufferedSender.prototype.close.call(this);
    debug("close");
    this.removeAllListeners();
    if (this.poll) {
      this.poll.abort();
      this.poll = null;
    }
  }
}

export { SenderReceiver };
