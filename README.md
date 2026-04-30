# Message App

A high-performance message viewer built with Next.js and React.

## Features

### Backend (Mock Server)

- **Data Source**: Uses a local `messages.json` file containing 100,000 unique message entries
- **API Endpoints**: API endpoints built to support processes such as fetching messages for display, and for searching for particular messages
- **Live Injection**: Background process generates a new mock message every 3–5 seconds

### Frontend (React + TypeScript)

- **Virtualization**: Uses `react-virtuoso` to render only visible messages, preventing memory leaks and UI lag
- **Live Messaging**: Live messages displayed as they appear
- **Search functionality**: Search functionality with highlighting to identify selected search results

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Install dependencies
npm install

```

### Running the Application

```bash
# To run both servers at the same time
npm run dev:all

# Terminal 1: Start the mock server (port 3001)
npm run dev:mock

# Terminal 2: Start the Next.js frontend (port 3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Running Jest tests

```bash
# To run jest tests
npm run test
```

## Project Structure

```
message-app/
├── app/
│   ├── page.tsx           # Main page with Virtuoso virtual list
│   ├── MessageItem.tsx    # Individual message component with highlight support
│   ├── SearchBar.tsx      # Search component with API integration
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── lib/
│   └── api-client.ts      # API client with typed interfaces
├── mock-server/
│   ├── server.ts          # Express mock server
│   ├── messages.json      # 100,000 message data file (generated)
│   └── package.json       # Mock server dependencies
└── README.md
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/messages` | Fetch paginated messages (50 per page) |
| `GET /api/messages/live` | Fetch live messages |
| `GET /api/messages/search?q={query}` | Search all 100,000 messages |
| `GET /api/health` | Health check endpoint |

## Key Technologies

- **Next.js 16** - React framework
- **react-virtuoso** - Virtual list component
- **Express** - Mock server
- **TypeScript** - Type safety

## Future actions
- Tidy up jests tests and make them more understandable
- Improve styling, with more animations for loading
