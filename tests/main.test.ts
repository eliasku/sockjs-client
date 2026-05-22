import { describe, it, expect } from "bun:test";
import { SockJS } from "../src/entry";
import { transportList } from "../src/transport-list";

describe("SockJS", () => {
  describe("Constructor", () => {
    it("should create a valid WebSocket-like object", () => {
      const s = new SockJS("http://localhost");
      expect(s).toHaveProperty("url");
      expect(s.readyState).toBe(SockJS.CONNECTING);
      expect(s).toHaveProperty("extensions", "");
      expect(s).toHaveProperty("protocol", "");
      s.close();
    });

    describe("WebSocket specification step #1", () => {
      it("should throw TypeError for no arguments", () => {
        expect(() => {
          const _sockjs = new (SockJS as any)();
        }).toThrow();
      });

      it("should throw SyntaxError when the url contains a fragment", () => {
        expect(() => {
          const _sockjs = new SockJS("http://localhost/#test");
        }).toThrow();
      });
    });

    it("should generate 8-character-long session ids by default", () => {
      const s = new SockJS("http://localhost");
      expect(s._generateSessionId!().length).toBe(8);
      s.close();
    });

    it("should generate N-character-long session ids", () => {
      for (let i = 1; i <= 10; i++) {
        const s = new SockJS("http://localhost", undefined, { sessionId: i } as any);
        expect(s._generateSessionId!().length).toBe(i);
        s.close();
      }
    });
  });

  describe("Transport list", () => {
    it("should have transports with valid interfaces", () => {
      transportList.forEach((Trans: any) => {
        expect(Trans).toBeDefined();
        expect(Trans).toHaveProperty("transportName");
        expect(Trans.transportName.length).toBeGreaterThan(0);
        expect(Trans).toHaveProperty("roundTrips");
        expect(typeof Trans.roundTrips).toBe("number");
        expect(Trans).toHaveProperty("enabled");
        expect(typeof Trans.enabled).toBe("function");
        expect(Trans.prototype).toHaveProperty("send");
        expect(typeof Trans.prototype.send).toBe("function");
        expect(Trans.prototype).toHaveProperty("close");
        expect(typeof Trans.prototype.close).toBe("function");
      });
    });
  });
});
