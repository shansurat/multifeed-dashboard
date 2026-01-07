const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

console.log("🚀 Crypto Ticker Server started on port 8080");

const FEEDS = ["BTC-USD", "ETH-USD", "SOL-USD", "DOGE-USD"];
const TYPES = ["trade", "sentiment"];

wss.on("connection", (ws) => {
  console.log("Client connected");

  // 1. Send an initial burst of data (Snapshot)
  // This helps test if your UI can handle immediate load
  for (let i = 0; i < 20; i++) {
    ws.send(JSON.stringify(generateEvent()));
  }

  // 2. Simulate High-Frequency Events (Every 100ms)
  const intervalId = setInterval(() => {
    // Send a batch of 1-3 events at once to simulate concurrency
    const batchSize = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < batchSize; i++) {
      ws.send(JSON.stringify(generateEvent()));
    }
  }, 100);

  // 3. Chaos Monkey (Simulate random disconnects) - Optional
  // Uncomment this to test your "Resilience/Reconnect" logic automatically
  /*
  setTimeout(() => {
     console.log('💥 Simulating connection drop');
     ws.close();
  }, 30000); // Kills connection after 30s
  */

  ws.on("close", () => {
    console.log("Client disconnected");
    clearInterval(intervalId);
  });
});

// Add this array at the top
const DESCRIPTIONS = [
  "Whale Alert 🐋",
  "Bot Arbitrage 🤖",
  "Stop Loss Triggered",
  "Retail FOMO",
  "Liquidation Cascade",
  "Limit Order Filled",
  "Market Maker Exec",
];

function generateEvent() {
  const feed = FEEDS[Math.floor(Math.random() * FEEDS.length)];
  const isBuy = Math.random() > 0.5;
  const priceBase = feed.startsWith("BTC")
    ? 65000
    : feed.startsWith("ETH")
    ? 3500
    : 150;

  // Random price fluctuation
  const price = (priceBase + (Math.random() * 100 - 50)).toFixed(2);

  return {
    id: crypto.randomUUID(),
    feed: feed,
    type: "trade",
    description: DESCRIPTIONS[Math.floor(Math.random() * DESCRIPTIONS.length)],
    side: isBuy ? "buy" : "sell",
    price: parseFloat(price),
    quantity: (Math.random() * 10).toFixed(4),
    timestamp: Date.now(),
  };
}
