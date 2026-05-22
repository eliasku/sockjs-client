import * as urlUtils from "../../utils/url";
import { BufferedSender } from "./buffered-sender";
import { Polling } from "./polling";

const debug = (...args: any[]) => console.log("[sockjs-client:sender-receiver]", ...args);

export class SenderReceiver extends BufferedSender {
  poll: Polling | null;

  constructor(transUrl: string, urlSuffix: string, senderFunc: any, Receiver: any, AjaxObject?: any) {
    const pollUrl = urlUtils.addPath(transUrl, urlSuffix);
    debug(pollUrl);
    super(transUrl, senderFunc);
    this.poll = new Polling(Receiver, pollUrl, AjaxObject);
    this.poll.on("message", (msg: string) => {
      debug("poll message", msg);
      this.emit("message", msg);
    });
    this.poll.once("close", (code: number, reason: string) => {
      debug("poll close", code, reason);
      this.poll = null;
      this.emit("close", code, reason);
      this.close();
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
