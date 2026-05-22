import * as random from "../../utils/random";
import * as urlUtils from "../../utils/url";

const debug = (...args: any[]) => console.log("[sockjs-client:sender:jsonp]", ...args);

let form: HTMLFormElement | null = null;
let area: HTMLTextAreaElement | null = null;

function createIframe(id: string): HTMLIFrameElement {
  debug("createIframe", id);
  try {
    return (globalThis as any).document.createElement(`<iframe name="${id}">`);
  } catch {
    const iframe = (globalThis as any).document.createElement("iframe");
    iframe.name = id;
    return iframe;
  }
}

function createForm(): void {
  debug("createForm");
  form = (globalThis as any).document.createElement("form");
  form!.style.display = "none";
  form!.style.position = "absolute";
  form!.method = "POST";
  form!.enctype = "application/x-www-form-urlencoded";
  form!.acceptCharset = "UTF-8";

  area = (globalThis as any).document.createElement("textarea");
  area!.name = "d";
  form!.appendChild(area!);

  (globalThis as any).document.body.appendChild(form!);
}

const jsonpSender = function (url: string, payload: string, callback: (err?: Error) => void): () => void {
  debug(url, payload);
  if (!form) {
    createForm();
  }
  const id = "a" + random.string(8);
  form!.target = id;
  form!.action = urlUtils.addQuery(urlUtils.addPath(url, "/jsonp_send"), `i=${id}`);

  const iframe = createIframe(id);
  iframe.id = id;
  iframe.style.display = "none";
  form!.appendChild(iframe);

  try {
    area!.value = payload;
  } catch {
    // seriously broken browsers get here
  }
  form!.submit();

  const completed = function (err?: Error) {
    debug("completed", id, err);
    if (!(iframe as any).onerror) {
      return;
    }
    (iframe as any).onreadystatechange = (iframe as any).onerror = (iframe as any).onload = null;
    setTimeout(function () {
      debug("cleaning up", id);
      iframe.parentNode!.removeChild(iframe);
    }, 500);
    area!.value = "";
    callback(err);
  };
  (iframe as any).onerror = function () {
    debug("onerror", id);
    completed();
  };
  (iframe as any).onload = function () {
    debug("onload", id);
    completed();
  };
  (iframe as any).onreadystatechange = function (e: any) {
    debug("onreadystatechange", id, (iframe as any).readyState, e);
    if ((iframe as any).readyState === "complete") {
      completed();
    }
  };
  return function () {
    debug("aborted", id);
    completed(new Error("Aborted"));
  };
};

export { jsonpSender };
