import { transportList } from "./transport-list";
import { createSockJS, type SockJSClass } from "./main";

export const SockJS: SockJSClass = createSockJS(transportList);

if ("_sockjs_onload" in globalThis) {
  setTimeout((globalThis as any)._sockjs_onload, 1);
}
