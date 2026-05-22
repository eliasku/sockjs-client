import { transportList } from "./transport-list";
import { createSockJS } from "./main";

const SockJS = createSockJS(transportList);

if ("_sockjs_onload" in globalThis) {
  setTimeout((globalThis as any)._sockjs_onload, 1);
}

export { SockJS };
