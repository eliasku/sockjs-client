import { describe, it, expect } from "bun:test";
import { string, number, numberString } from "../src/utils/random";
import { getOrigin, isOriginEqual, isSchemeEqual, addPath, addQuery, isLoopbackAddr } from "../src/utils/url";
import { quote } from "../src/utils/escape";
import { extend, isObject } from "../src/utils/object";
import { EventEmitter } from "../src/event/emitter";
import { EventTarget } from "../src/event/eventtarget";
import { CloseEvent } from "../src/event/close";
import { TransportMessageEvent } from "../src/event/trans-message";
import { Event } from "../src/event/event";

describe("utils", () => {
  describe("random", () => {
    it("should generate unique outputs", () => {
      expect(string(8)).not.toEqual(string(8));
    });

    it("should have the correct length", () => {
      const lengths = [1, 2, 3, 128];
      for (const len of lengths) {
        expect(string(len).length).toBe(len);
      }
    });

    it("numberString should have the correct length based on the max", () => {
      expect(numberString(10).length).toBe(1);
      expect(numberString(100).length).toBe(2);
      expect(numberString(1000).length).toBe(3);
      expect(numberString(10000).length).toBe(4);
    });
  });

  describe("url", () => {
    it("getOrigin", () => {
      expect(getOrigin("http://a.b/")).toBe("http://a.b:80");
      expect(getOrigin("http://a.b/c")).toBe("http://a.b:80");
      expect(getOrigin("http://a.b:123/c")).toBe("http://a.b:123");
      expect(getOrigin("https://a.b/")).toBe("https://a.b:443");
      expect(getOrigin("file://a.b/")).toBeNull();
    });

    it("isOriginEqual", () => {
      expect(isOriginEqual("http://localhost", "http://localhost/")).toBe(true);
      expect(isOriginEqual("http://localhost", "http://localhost/abc")).toBe(true);
      expect(isOriginEqual("http://localhost/", "http://localhost")).toBe(true);
      expect(isOriginEqual("http://localhost", "http://localhost")).toBe(true);
      expect(isOriginEqual("http://localhost", "http://localhost:8080")).toBe(false);
      expect(isOriginEqual("http://localhost:8080", "http://localhost")).toBe(false);
      expect(isOriginEqual("http://localhost:8080", "http://localhost:8080/")).toBe(true);
    });

    it("isSchemeEqual", () => {
      expect(isSchemeEqual("http://localhost", "http://localhost/")).toBe(true);
      expect(isSchemeEqual("http://localhost", "https://localhost/")).toBe(false);
    });

    it("addPath", () => {
      expect(addPath("http://example.com", "/test")).toBe("http://example.com/test");
      expect(addPath("http://example.com?q=1", "/test")).toBe("http://example.com/test?q=1");
    });

    it("addQuery", () => {
      expect(addQuery("http://example.com", "a=1")).toBe("http://example.com?a=1");
      expect(addQuery("http://example.com?b=2", "a=1")).toBe("http://example.com?b=2&a=1");
    });

    it("isLoopbackAddr", () => {
      expect(isLoopbackAddr("127.0.0.1")).toBe(true);
      expect(isLoopbackAddr("127.255.255.255")).toBe(true);
      expect(isLoopbackAddr("192.168.1.1")).toBe(false);
      expect(isLoopbackAddr("[::1]")).toBe(true);
    });
  });

  describe("escape", () => {
    it("handles empty string", () => {
      expect(quote("")).toBe('""');
    });

    it("handles non-empty string", () => {
      expect(quote("a")).toBe('"a"');
    });

    it("handles tab and newline", () => {
      expect(['"\\t"', '"\\u0009"']).toContain(quote("\t"));
      expect(['"\\n"', '"\\u000a"']).toContain(quote("\n"));
    });
  });

  describe("object", () => {
    it("extend", () => {
      expect(extend({}, {})).toEqual({});
      const a: Record<string, number> = { a: 1 };
      expect(extend(a, {})).toEqual(a);
      expect(extend(a, { b: 1 })).toEqual({ a: 1, b: 1 });
    });

    it("isObject", () => {
      expect(isObject({})).toBe(true);
      expect(isObject(null)).toBe(false);
      expect(isObject(1)).toBe(false);
      expect(isObject("")).toBe(false);
    });
  });
});

describe("Event system", () => {
  describe("EventTarget", () => {
    it("should add and dispatch event listeners", () => {
      const target = new EventTarget();
      let received = "";
      target.addEventListener("test", (e: any) => {
        received = e.data;
      });
      target.dispatchEvent({ type: "test", data: "hello" } as any);
      expect(received).toBe("hello");
    });

    it("should remove event listeners", () => {
      const target = new EventTarget();
      let count = 0;
      const listener = () => {
        count++;
      };
      target.addEventListener("click", listener);
      target.dispatchEvent({ type: "click" } as any);
      expect(count).toBe(1);
      target.removeEventListener("click", listener);
      target.dispatchEvent({ type: "click" } as any);
      expect(count).toBe(1);
    });
  });

  describe("EventEmitter", () => {
    it("should emit and listen to events", () => {
      const emitter = new EventEmitter();
      let received = "";
      emitter.on("message", (data: string) => {
        received = data;
      });
      emitter.emit("message", "hello");
      expect(received).toBe("hello");
    });

    it("should support once listeners", () => {
      const emitter = new EventEmitter();
      let count = 0;
      emitter.once("message", () => {
        count++;
      });
      emitter.emit("message");
      emitter.emit("message");
      expect(count).toBe(1);
    });

    it("should removeAllListeners", () => {
      const emitter = new EventEmitter();
      let count = 0;
      emitter.on("message", () => {
        count++;
      });
      emitter.emit("message");
      expect(count).toBe(1);
      emitter.removeAllListeners();
      emitter.emit("message");
      expect(count).toBe(1);
    });

    it("should removeAllListeners for specific type", () => {
      const emitter = new EventEmitter();
      let msgCount = 0;
      let closeCount = 0;
      emitter.on("message", () => {
        msgCount++;
      });
      emitter.on("close", () => {
        closeCount++;
      });
      emitter.emit("message");
      emitter.emit("close");
      emitter.removeAllListeners("message");
      emitter.emit("message");
      emitter.emit("close");
      expect(msgCount).toBe(1);
      expect(closeCount).toBe(2);
    });
  });

  describe("CloseEvent", () => {
    it("should have correct properties", () => {
      const e = new CloseEvent();
      expect(e.type).toBe("close");
      expect(e.wasClean).toBe(false);
      expect(e.code).toBe(0);
      expect(e.reason).toBe("");
    });
  });

  describe("TransportMessageEvent", () => {
    it("should carry data", () => {
      const e = new TransportMessageEvent("test data");
      expect(e.type).toBe("message");
      expect(e.data).toBe("test data");
    });
  });

  describe("Event", () => {
    it("should have correct type", () => {
      const e = new Event("open");
      expect(e.type).toBe("open");
    });
  });
});
