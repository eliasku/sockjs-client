import { EventEmitter } from "../../event/emitter";

const debug = (...args: any[]) => console.log("[sockjs-client:receiver:xhr]", ...args);

class XhrReceiver extends EventEmitter {
  bufferPosition: number;
  xo: any;

  constructor(url: string, AjaxObject: any) {
    super();
    debug(url);
    const self = this;

    this.bufferPosition = 0;

    this.xo = new AjaxObject("POST", url, null);
    this.xo.on("chunk", this._chunkHandler.bind(this));
    this.xo.once("finish", function (status: number, text: string) {
      debug("finish", status, text);
      self._chunkHandler(status, text);
      self.xo = null;
      const reason = status === 200 ? "network" : "permanent";
      debug("close", reason);
      self.emit("close", null, reason);
      self._cleanup();
    });
  }

  _chunkHandler(status: number, text: string): void {
    debug("_chunkHandler", status);
    if (status !== 200 || !text) {
      return;
    }

    for (let idx = -1; ; this.bufferPosition += idx + 1) {
      const buf = text.slice(this.bufferPosition);
      idx = buf.indexOf("\n");
      if (idx === -1) {
        break;
      }
      const msg = buf.slice(0, idx);
      if (msg) {
        debug("message", msg);
        this.emit("message", msg);
      }
    }
  }

  _cleanup(): void {
    debug("_cleanup");
    this.removeAllListeners();
  }

  abort(): void {
    debug("abort");
    if (this.xo) {
      this.xo.close();
      debug("close");
      this.emit("close", null, "user");
      this.xo = null;
    }
    this._cleanup();
  }
}

export { XhrReceiver };
