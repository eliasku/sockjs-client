import { describe, it, expect } from "bun:test";
import * as random from "../src/utils/random";
import * as urlUtils from "../src/utils/url";
import * as escape from "../src/utils/escape";
import * as objectUtils from "../src/utils/object";

describe("utils", () => {
  describe("random", () => {
    it("should generate unique outputs", () => {
      expect(random.string(8)).not.toEqual(random.string(8));
    });

    it("should have the correct length", () => {
      const lengths = [1, 2, 3, 128];
      for (const len of lengths) {
        expect(random.string(len).length).toBe(len);
      }
    });

    it("numberString should have the correct length based on the max", () => {
      expect(random.numberString(10).length).toBe(1);
      expect(random.numberString(100).length).toBe(2);
      expect(random.numberString(1000).length).toBe(3);
      expect(random.numberString(10000).length).toBe(4);
      expect(random.numberString(100000).length).toBe(5);
    });
  });

  describe("url", () => {
    it("getOrigin", () => {
      expect(urlUtils.getOrigin("http://a.b/")).toBe("http://a.b:80");
      expect(urlUtils.getOrigin("http://a.b/c")).toBe("http://a.b:80");
      expect(urlUtils.getOrigin("http://a.b:123/c")).toBe("http://a.b:123");
      expect(urlUtils.getOrigin("https://a.b/")).toBe("https://a.b:443");
      expect(urlUtils.getOrigin("file://a.b/")).toBeNull();
    });

    it("isOriginEqual", () => {
      expect(urlUtils.isOriginEqual("http://localhost", "http://localhost/")).toBe(true);
      expect(urlUtils.isOriginEqual("http://localhost", "http://localhost/abc")).toBe(true);
      expect(urlUtils.isOriginEqual("http://localhost/", "http://localhost")).toBe(true);
      expect(urlUtils.isOriginEqual("http://localhost", "http://localhost")).toBe(true);
      expect(urlUtils.isOriginEqual("http://localhost", "http://localhost:8080")).toBe(false);
      expect(urlUtils.isOriginEqual("http://localhost:8080", "http://localhost")).toBe(false);
      expect(urlUtils.isOriginEqual("http://localhost:8080", "http://localhost:8080/")).toBe(true);
      expect(urlUtils.isOriginEqual("http://127.0.0.1:80/", "http://127.0.0.1:80/a")).toBe(true);
      expect(urlUtils.isOriginEqual("http://127.0.0.1:80", "http://127.0.0.1:80/a")).toBe(true);
    });

    it("isSchemeEqual", () => {
      expect(urlUtils.isSchemeEqual("http://localhost", "http://localhost/")).toBe(true);
      expect(urlUtils.isSchemeEqual("http://localhost", "https://localhost/")).toBe(false);
      expect(urlUtils.isSchemeEqual("http://localhost", "file://localhost/")).toBe(false);
    });

    it("addPath", () => {
      expect(urlUtils.addPath("http://example.com", "/test")).toBe("http://example.com/test");
      expect(urlUtils.addPath("http://example.com?q=1", "/test")).toBe("http://example.com/test?q=1");
    });

    it("addQuery", () => {
      expect(urlUtils.addQuery("http://example.com", "a=1")).toBe("http://example.com?a=1");
      expect(urlUtils.addQuery("http://example.com?b=2", "a=1")).toBe("http://example.com?b=2&a=1");
    });

    it("isLoopbackAddr", () => {
      expect(urlUtils.isLoopbackAddr("127.0.0.1")).toBe(true);
      expect(urlUtils.isLoopbackAddr("127.255.255.255")).toBe(true);
      expect(urlUtils.isLoopbackAddr("192.168.1.1")).toBe(false);
      expect(urlUtils.isLoopbackAddr("[::1]")).toBe(true);
    });
  });

  describe("escape", () => {
    it("handles empty string", () => {
      expect(escape.quote("")).toBe('""');
    });

    it("handles non-empty string", () => {
      expect(escape.quote("a")).toBe('"a"');
    });

    it("handles tab and newline", () => {
      expect(['"\\t"', '"\\u0009"']).toContain(escape.quote("\t"));
      expect(['"\\n"', '"\\u000a"']).toContain(escape.quote("\n"));
    });

    it("handles unicode", () => {
      expect(escape.quote("\x00\udfff\ufffe\uffff")).toBe('"\\u0000\\udfff\\ufffe\\uffff"');
    });
  });

  describe("object", () => {
    it("extend", () => {
      expect(objectUtils.extend({}, {})).toEqual({});
      const a: Record<string, number> = { a: 1 };
      expect(objectUtils.extend(a, {})).toEqual(a);
      expect(objectUtils.extend(a, { b: 1 })).toEqual({ a: 1, b: 1 });
      expect(a).toEqual({ a: 1, b: 1 });
      const b: Record<string, number> = { b: 2 };
      expect(objectUtils.extend({ a: 1 }, b)).toEqual({ a: 1, b: 2 });
    });
  });
});
