"use client";

import { useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useStore } from "@/store/useStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import { format } from "date-fns";
import { Activity, Search, Wifi, WifiOff } from "lucide-react";
import { clsx } from "clsx";
import { FeedType } from "@/types";

// Helper to format currency quickly
const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    val
  );

export default function FeedPage() {
  // Connect to Store
  const {
    events,
    addEvent,
    selectedFeed,
    searchQuery,
    setFeedFilter,
    setSearchQuery,
  } = useStore();

  const { status, connect } = useWebSocket({
    url: "ws://localhost:8080",
    onMessage: addEvent,
  });

  // Connect to WebSocket
  // We pass the 'addEvent' action directly to the hook
  useWebSocket({
    url: "ws://localhost:8080",
    onMessage: addEvent,
  });

  // Filtering
  // I used useMemo here. If I didn't, we would re-run this heavy filter
  // on every single render, killing performance.
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Filter by Feed Tab
      if (selectedFeed !== "ALL" && event.feed !== selectedFeed) return false;

      // Filter by Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const total = event.price * event.quantity;
        const timeString = format(event.timestamp, "HH:mm:ss.SSS");

        return (
          event.feed.toLowerCase().includes(query) || // Symbol
          event.type.toLowerCase().includes(query) || // Type
          event.description.toLowerCase().includes(query) || // Description
          event.price.toString().includes(query) || // Price
          event.quantity.toString().includes(query) || // Size
          total.toFixed(2).includes(query) || // Total
          timeString.includes(query) // Time
        );
      }
      return true;
    });
  }, [events, selectedFeed, searchQuery]);

  // Virtualization Setup
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: filteredEvents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Height of a single row in pixels
    overscan: 5, // Render 5 extra items off-screen for smooth scrolling
  });

  return (
    <div className="h-screen bg-slate-950 text-slate-200 flex flex-col font-mono overflow-hidden">
      {/* --- HEADER --- */}
      <header className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex justify-between items-center shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Activity className="text-emerald-500 w-6 h-6" />
          <h1 className="text-xl font-bold tracking-tight text-white">
            REALTIME MULTI-FEED DASHBOARD{" "}
            <span className="text-slate-500 font-normal">BY SHANSURAT</span>
          </h1>
        </div>

        {/* Connection Status Pill / Button */}
        <button
          onClick={() => {
            if (status === "DISCONNECTED") {
              connect();
            }
          }}
          disabled={status !== "DISCONNECTED"} // Only clickable when dead
          className={clsx(
            "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border transition-all",
            // Connected (Green)
            status === "CONNECTED" &&
              "bg-emerald-950/30 border-emerald-800 text-emerald-400 cursor-default",

            // Connecting/Reconnecting (Amber)
            (status === "CONNECTING" || status === "RECONNECTING") &&
              "bg-amber-950/30 border-amber-800 text-amber-400 cursor-wait",

            // Disconnected (Red + Hover Effect)
            status === "DISCONNECTED" &&
              "bg-rose-950/30 border-rose-800 text-rose-400 hover:bg-rose-900/50 hover:border-rose-500 cursor-pointer shadow-sm hover:shadow-rose-900/20"
          )}
        >
          {
            status === "CONNECTED" ? (
              <Wifi className="w-3 h-3" />
            ) : status === "DISCONNECTED" ? (
              <WifiOff className="w-3 h-3" />
            ) : (
              <Activity className="w-3 h-3 animate-pulse" />
            ) // Different icon for loading
          }

          <span>{status === "DISCONNECTED" ? "RECONNECT" : status}</span>
        </button>
      </header>

      {/* --- CONTROLS --- */}
      <div className="p-4 flex flex-col sm:flex-row gap-4 border-b border-slate-800 bg-slate-900 shrink-0">
        {/* Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
          {(["ALL", "BTC-USD", "ETH-USD", "SOL-USD"] as const).map((feed) => (
            <button
              key={feed}
              onClick={() => setFeedFilter(feed as FeedType | "ALL")}
              className={clsx(
                "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                selectedFeed === feed
                  ? "bg-slate-700 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              {feed === "ALL" ? "ALL MARKETS" : feed}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search Description, Price, Symbol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* --- DATA TABLE HEADERS --- */}
      <div className="grid grid-cols-12 gap-4 px-6 py-2 text-xs font-bold text-slate-500 border-b border-slate-800 uppercase shrink-0">
        <div className="col-span-2">Time</div>
        <div className="col-span-2">Symbol</div>
        <div className="col-span-1">Type</div> {/* Reduced span */}
        <div className="col-span-2 text-right">Price</div>
        <div className="col-span-1 text-right">Size</div> {/* Reduced span */}
        <div className="col-span-2 text-right">Total</div>
        <div className="col-span-2 text-right">Description</div>{" "}
      </div>

      {/* --- VIRTUAL FEED --- */}
      <div
        ref={parentRef}
        className="flex-1 overflow-y-auto custom-scrollbar"
        style={{ contain: "strict", overflowAnchor: "none" }} // CSS Performance Hint
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const event = filteredEvents[virtualRow.index];
            const isBuy = event.side === "buy";

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement} // <--- ADD THIS (Helps accuracy)
                className={clsx(
                  "absolute top-0 left-0 w-full grid grid-cols-12 gap-4 px-6 h-[50px] items-center text-sm border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors",
                  isBuy ? "text-emerald-400" : "text-rose-400"
                )}
                style={{ transform: `translateY(${virtualRow.start}px)` }}
              >
                {/* Time */}
                <div className="col-span-2 text-slate-500 text-xs">
                  {format(event.timestamp, "HH:mm:ss.SSS")}
                </div>

                {/* Symbol */}
                <div className="col-span-2 font-bold text-white">
                  {event.feed}
                </div>

                {/* Type (Small Badge) */}
                <div className="col-span-1">
                  <span
                    className={clsx(
                      "text-[10px] px-1.5 py-0.5 rounded uppercase font-bold bg-opacity-20",
                      isBuy
                        ? "bg-emerald-500 text-emerald-300"
                        : "bg-rose-500 text-rose-300"
                    )}
                  >
                    {event.side === "buy" ? "Buy" : "Sell"}
                  </span>
                </div>

                {/* Price */}
                <div className="col-span-2 text-right font-medium">
                  {formatCurrency(event.price)}
                </div>

                {/* Quantity */}
                <div className="col-span-1 text-right text-slate-400">
                  {Number(event.quantity).toFixed(2)}
                </div>

                {/* Total Value */}
                <div className="col-span-2 text-right text-slate-500">
                  {formatCurrency(event.price * event.quantity)}
                </div>

                {/* Description (New) */}
                <div className="col-span-2 text-right text-xs text-slate-400 truncate">
                  {event.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="p-2 border-t border-slate-800 bg-slate-900 text-[10px] text-slate-500 flex justify-between">
        <span>Displaying {filteredEvents.length} events</span>
        <span>Real-time Socket Mode</span>
      </div>
    </div>
  );
}
