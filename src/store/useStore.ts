import { create } from "zustand";
import { MarketEvent, FeedType, ConnectionStatus } from "@/types";

interface StoreState {
  // Data
  events: MarketEvent[];
  eventIds: Set<string>; // For O(1) deduping lookup

  // UI State
  status: ConnectionStatus;
  selectedFeed: FeedType | "ALL";
  searchQuery: string;

  // Actions
  addEvent: (event: MarketEvent) => void;
  setFeedFilter: (feed: FeedType | "ALL") => void;
  setSearchQuery: (query: string) => void;
  setStatus: (status: ConnectionStatus) => void;
  clearEvents: () => void;
}

const MAX_EVENTS = 2000; // Cap the list to prevent memory crashes

export const useStore = create<StoreState>((set) => ({
  events: [],
  eventIds: new Set(),
  status: "DISCONNECTED",
  selectedFeed: "ALL",
  searchQuery: "",

  addEvent: (newEvent) =>
    set((state) => {
      // Check if ID already exists (O(1) speed)
      if (state.eventIds.has(newEvent.id)) {
        return state;
      }

      // Add new event to the TOP of the list (newest first)
      const newEvents = [newEvent, ...state.events];
      const newIds = new Set(state.eventIds).add(newEvent.id);

      // Trim if too large
      if (newEvents.length > MAX_EVENTS) {
        const removedEvent = newEvents.pop();
        if (removedEvent) newIds.delete(removedEvent.id);
      }

      return {
        events: newEvents,
        eventIds: newIds,
      };
    }),

  setFeedFilter: (feed) => set({ selectedFeed: feed }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setStatus: (status) => set({ status: status }),
  clearEvents: () => set({ events: [], eventIds: new Set() }),
}));
