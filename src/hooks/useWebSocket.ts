import { useEffect, useRef, useState, useCallback } from "react";
import { ConnectionStatus, MarketEvent } from "@/types";

interface WebSocketOptions {
  url: string;
  onMessage: (event: MarketEvent) => void;
}

const MAX_RETRIES = 5;

export const useWebSocket = ({ url, onMessage }: WebSocketOptions) => {
  // Expose a clear status state for the UI to render
  const [status, setStatus] = useState<ConnectionStatus>("DISCONNECTED");

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);

  const connect = useCallback(() => {
    // Prevent duplicate connections
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus("CONNECTING");

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WS Connected");
      setStatus("CONNECTED");

      reconnectAttempts.current = 0;
    };

    ws.onmessage = (event) => {
      // Handle malformed messages safely (don’t crash)
      try {
        const parsedData = JSON.parse(event.data);

        if (
          typeof parsedData === "object" &&
          parsedData !== null &&
          "id" in parsedData
        ) {
          onMessage(parsedData);
        } else {
          console.warn("Received malformed data structure:", parsedData);
        }
      } catch (err) {
        console.error("Failed to parse WS message (Invalid JSON):", event.data);
      }
    };

    ws.onclose = () => {
      console.log("WS Disconnected");
      setStatus("DISCONNECTED");
      wsRef.current = null;
      attemptReconnect();
    };

    ws.onerror = (error) => {
      console.error("WS Error:", error);
      ws.close();
    };
  }, [url, onMessage]);

  // Implement reconnect with backoff
  const attemptReconnect = () => {
    if (reconnectTimeoutRef.current) return;

    if (reconnectAttempts.current >= MAX_RETRIES) {
      console.log("Max retries reached. Giving up.");
      setStatus("DISCONNECTED");
      return;
    }

    setStatus("RECONNECTING");

    // Exponential Backoff: 1s -> 2s -> 4s -> 8s (Capped at 5s)
    const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 5000);

    console.log(
      `🔄 Reconnecting in ${delay}ms... (Attempt ${
        reconnectAttempts.current + 1
      })`
    );

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttempts.current += 1;
      reconnectTimeoutRef.current = null;
      connect();
    }, delay);
  };

  // Connect on page load
  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return { status, connect };
};
