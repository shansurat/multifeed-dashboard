export type FeedType = "BTC-USD" | "ETH-USD" | "SOL-USD" | "DOGE-USD";

export interface MarketEvent {
  id: string;
  feed: FeedType;
  type: "trade" | "sentiment";
  description: string;
  side: "buy" | "sell";
  price: number;
  quantity: number;
  timestamp: number;
}

export type ConnectionStatus =
  | "CONNECTING"
  | "CONNECTED"
  | "DISCONNECTED"
  | "RECONNECTING";

export interface FeedState {
  events: MarketEvent[];
  status: ConnectionStatus;
  isPaused: boolean;
  selectedFeed: FeedType | "ALL";
  searchQuery: string;
}
