import { EventEmitter } from "../../event/emitter";

const debug = (...args: any[]) => __DEBUG__ && console.log("[sockjs-client:buffered-sender]", ...args);

export class BufferedSender extends EventEmitter {
  sendBuffer: string[];
  sender: (url: string, payload: string, callback: (err?: any) => void) => () => void;
  url: string;
  sendStop: (() => void) | null;

  constructor(url: string, sender: (url: string, payload: string, callback: (err?: any) => void) => () => void) {
    super();
    debug(url);
    this.sendBuffer = [];
    this.sender = sender;
    this.url = url;
    this.sendStop = null;
  }

  send(message: string): void {
    debug("send", message);
    this.sendBuffer.push(message);
    if (!this.sendStop) {
      this.sendSchedule();
    }
  }

  sendScheduleWait(): void {
    debug("sendScheduleWait");
    let tref: ReturnType<typeof setTimeout>;
    this.sendStop = () => {
      debug("sendStop");
      this.sendStop = null;
      clearTimeout(tref);
    };
    tref = setTimeout(() => {
      debug("timeout");
      this.sendStop = null;
      this.sendSchedule();
    }, 25);
  }

  sendSchedule(): void {
    debug("sendSchedule", this.sendBuffer.length);
    if (this.sendBuffer.length > 0) {
      const payload = `[${this.sendBuffer.join(",")}]`;
      this.sendStop = this.sender(this.url, payload, (err?: any) => {
        this.sendStop = null;
        if (err) {
          debug("error", err);
          this.emit("close", err.code || 1006, `Sending error: ${err}`);
          this.close();
        } else {
          this.sendScheduleWait();
        }
      });
      this.sendBuffer = [];
    }
  }

  _cleanup(): void {
    debug("_cleanup");
    this.removeAllListeners();
  }

  close(): void {
    debug("close");
    this._cleanup();
    if (this.sendStop) {
      this.sendStop();
      this.sendStop = null;
    }
  }
}
