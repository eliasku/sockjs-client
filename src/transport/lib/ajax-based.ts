import * as urlUtils from "../../utils/url";
import { SenderReceiver } from "./sender-receiver";

const debug = (...args: any[]) => __DEBUG__ && console.log("[sockjs-client:ajax-based]", ...args);

type AjaxSender = (url: string, payload: string, callback: (err?: Error) => void) => () => void;

function createAjaxSender(AjaxObject: any): AjaxSender {
  return function (url: string, payload: string, callback: (err?: Error) => void): () => void {
    debug("create ajax sender", url, payload);
    const opt: { headers?: { "Content-type": string } } = {};
    if (typeof payload === "string") {
      opt.headers = { "Content-type": "text/plain" };
    }
    const ajaxUrl = urlUtils.addPath(url, "/xhr_send");
    let xo: any = new AjaxObject("POST", ajaxUrl, payload, opt);
    xo.once("finish", function (status: number) {
      debug("finish", status);
      xo = null;

      if (status !== 200 && status !== 204) {
        return callback(new Error(`http status ${status}`));
      }
      callback();
    });
    return function () {
      debug("abort");
      xo.close();
      xo = null;

      const err: any = new Error("Aborted");
      err.code = 1000;
      callback(err);
    };
  };
}

export class AjaxBasedTransport extends SenderReceiver {
  constructor(transUrl: string, urlSuffix: string, Receiver: any, AjaxObject: any) {
    super(transUrl, urlSuffix, createAjaxSender(AjaxObject), Receiver, AjaxObject);
  }
}
