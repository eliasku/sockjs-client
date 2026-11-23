import { transportList } from "./transport-list";
import { createSockJS, type SockJS as SockJSClass } from "./main";

export const SockJS: typeof SockJSClass = createSockJS(transportList);

if ("_sockjs_onload" in globalThis) {
  setTimeout((globalThis as any)._sockjs_onload, 1);
}
