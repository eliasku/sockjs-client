import { EventEmitter } from "../../event/emitter";

class XHRFake extends EventEmitter {
  to: ReturnType<typeof setTimeout>;

  static timeout: number = 2000;

  constructor() {
    super();
    const self = this;

    this.to = setTimeout(function () {
      self.emit("finish", 200, "{}");
    }, XHRFake.timeout);
  }

  close(): void {
    clearTimeout(this.to);
  }
}

export { XHRFake };
