import { describe, it, expect, vi } from "vite-plus/test";
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

  it("should close connections with independent callbacks and inherited listeners", () => {
    vi.useFakeTimers();
    try {
      const first = new SockJS("http://localhost/first");
      const second = new SockJS("http://localhost/second");
      // Cancel deferred connection attempts before exercising the public close lifecycle.
      vi.clearAllTimers();
      const firstClose = vi.fn();
      const secondClose = vi.fn();
      const firstListener = vi.fn();
      const secondListener = vi.fn();
      first.onclose = firstClose;
      second.onclose = secondClose;
      first.addEventListener("close", firstListener);
      second.addEventListener("close", secondListener);

      first.close(3001, "first finished");
      expect(first.readyState).toBe(SockJS.CLOSING);
      expect(second.readyState).toBe(SockJS.CONNECTING);
      expect(firstClose).not.toHaveBeenCalled();
      vi.runAllTimers();

      expect(first.readyState).toBe(SockJS.CLOSED);
      expect(firstClose).toHaveBeenCalledTimes(1);
      expect(firstClose).toHaveBeenCalledWith(
        expect.objectContaining({ type: "close", code: 3001, reason: "first finished", wasClean: true }),
      );
      expect(firstListener).toHaveBeenCalledTimes(1);
      expect(firstListener).toHaveBeenCalledWith(firstClose.mock.calls[0]?.[0]);
      expect(firstClose.mock.contexts[0]).toBe(first);
      expect(firstListener.mock.contexts[0]).toBe(first);
      expect(secondClose).not.toHaveBeenCalled();
      expect(secondListener).not.toHaveBeenCalled();
      expect(second.readyState).toBe(SockJS.CONNECTING);

      second.close(3002, "second finished");
      vi.runAllTimers();

      expect(second.readyState).toBe(SockJS.CLOSED);
      expect(secondClose).toHaveBeenCalledTimes(1);
      expect(secondClose).toHaveBeenCalledWith(
        expect.objectContaining({ type: "close", code: 3002, reason: "second finished", wasClean: true }),
      );
      expect(secondListener).toHaveBeenCalledTimes(1);
      expect(secondListener).toHaveBeenCalledWith(secondClose.mock.calls[0]?.[0]);
      expect(secondClose.mock.contexts[0]).toBe(second);
      expect(secondListener.mock.contexts[0]).toBe(second);
      expect(firstListener).toHaveBeenCalledTimes(1);
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
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
