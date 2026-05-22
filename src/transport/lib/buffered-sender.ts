import { EventEmitter } from "../../event/emitter";

const debug = (...args: any[]) => console.log("[sockjs-client:buffered-sender]", ...args);

class BufferedSender extends EventEmitter {
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
    const self = this;
    let tref: ReturnType<typeof setTimeout>;
    this.sendStop = function () {
      debug("sendStop");
      self.sendStop = null;
      clearTimeout(tref);
    };
    tref = setTimeout(function () {
      debug("timeout");
      self.sendStop = null;
      self.sendSchedule();
    }, 25);
  }

  sendSchedule(): void {
    debug("sendSchedule", this.sendBuffer.length);
    const self = this;
    if (this.sendBuffer.length > 0) {
      const payload = `[${this.sendBuffer.join(",")}]`;
      this.sendStop = this.sender(this.url, payload, function (err?: any) {
        self.sendStop = null;
        if (err) {
          debug("error", err);
          self.emit("close", err.code || 1006, `Sending error: ${err}`);
          self.close();
        } else {
          self.sendScheduleWait();
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

export { BufferedSender };
