# Realtime Multi-Feed Dashboard BY Shan Surat

## Key Features

- Handles rapid-fire WebSocket events without UI freezing.
- Uses windowing techniques to render only visible items, supporting 2,000+ rows with constant 60fps performance.
- Custom WebSocket hook with **Exponential Backoff** reconnection logic and connection status monitoring.
- Real-time filtering across 7 different data points (Symbol, Price, Description, etc.) using memoized logic.
- De-duplication of events using `Set` (O(1) complexity) and memory management (capping list size).

---

## Tech Stack & Rationale

### Core Framework

- **Next.js (App Router):** For a modern, server-capable foundation.
- **TypeScript:** Strict typing for all data interfaces (`MarketEvent`, `ConnectionStatus`) to ensure type safety across the full stack.

### State & Performance

- **Zustand:** Chosen over Redux/Context for its transient update capabilities. It allows high-frequency state changes without triggering unnecessary re-renders in unrelated components.
- **@tanstack/react-virtual:** Implements "Windowing" (Virtualization). Instead of rendering 2,000 DOM nodes (which crashes browsers), it only renders the ~15 nodes currently on screen.
- **date-fns:** Lightweight date formatting for timestamps.

### UI & Styling

- **Tailwind CSS:** For rapid, utility-first styling with a specific focus on "Dark Mode" aesthetics (Slate/Emerald/Rose palette).
- **Lucide React:** Clean, lightweight SVG icons.
- **clsx / tailwind-merge:** For safe and dynamic class name construction.

---

## Architectural Approach

### 1. The WebSocket "Nervous System" (`useWebSocket.ts`)

Instead of a simple connection, I built a custom hook that manages the entire lifecycle:

- Auto-detects disconnects.
- If the server fails, it retries in increasing intervals (1s, 2s, 4s...) to prevent network flooding.
- "Give Up" logic after 5 failed attempts, requiring manual user intervention (The "Reconnect" button).

### 2. The Data Store (`useStore.ts`)

The Zustand store acts as the single source of truth but is optimized for speed:

- Uses a `Set<string>` to track Event IDs. This makes checking for duplicates instant, regardless of list size.
- Automatically trims the oldest events once the list exceeds 2,000 items to prevent memory leaks during long sessions.

### 3. Rendering Strategy (`page.tsx`)

- **Strict Mode Handling:** Configured to prevent double-invocations of the WebSocket during development.
- **Memoized Filtering:** The search logic is wrapped in `useMemo`. This ensures complex filtering (checking 7 fields) only runs when the query changes, not on every single tick of the WebSocket.

---

## Getting Started

This project consists of two parts: the **Frontend (Next.js)** and the **Mock Server (Node.js)**. You need to run both.

### Prerequisites

- Node.js (v18+)
- npm or yarn

### 1. Installation

Clone the repository and install dependencies:

```bash
npm install
```

### 2. Start the Mock Server (The Data Source)

Open a terminal window and run:

```bash
node mock-server/server.js
```

### 3. Start the Frontend

Open a second terminal window and run:

```bash
npm run dev
```

Open http://localhost:3000/feed in your browser.

## How to Test Resilience

1. Confirm data is flowing (Green "CONNECTED" badge).
2. Go to the Mock Server terminal and press `Ctrl` + `C`.
3. The badge will turn Amber ("RECONNECTING") and pulse. It will attempt to reconnect 5 times.
4. The badge turns Red ("RECONNECT").
5. Run node mock-server/server.js again.
6. Click the "RECONNECT" button in the UI. Data flow resumes immediately.
