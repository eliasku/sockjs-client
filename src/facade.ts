import * as iframeUtils from "./utils/iframe";

export class FacadeJS {
  _transport: any;

  constructor(transport: any) {
    this._transport = transport;
    transport.on("message", this._transportMessage.bind(this));
    transport.on("close", this._transportClose.bind(this));
  }

  _transportClose(code: number, reason: string): void {
    iframeUtils.postMessage("c", JSON.stringify([code, reason]));
  }

  _transportMessage(frame: string): void {
    iframeUtils.postMessage("t", frame);
  }

  _send(data: string): void {
    this._transport.send(data);
  }

  _close(): void {
    this._transport.close();
    this._transport.removeAllListeners();
  }
}
