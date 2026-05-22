import { EventEmitter } from "../../event/emitter";

export class XHRFake extends EventEmitter {
  to: ReturnType<typeof setTimeout>;

  static timeout: number = 2000;

  constructor() {
    super();
    this.to = setTimeout(() => {
      this.emit("finish", 200, "{}");
    }, XHRFake.timeout);
  }

  close(): void {
    clearTimeout(this.to);
  }
}
