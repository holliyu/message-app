import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const port = 3001; 

// enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// middleware to parse JSON bodies
app.use(cors());
app.use(express.json());

// health check api endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// creating message object
interface Message {
  id: number;
  userId: string;
  content: string;
  timestamp: string;
  isLive: boolean;
}

// creating array of 100,000 messages
const staticMessages: Message[] = [];

for (let i = 1; i <= 100000; i++) {
  staticMessages.push({
    id: i,
    userId: `user_${Math.floor(Math.random() * 1000)}`,
    content: `Message ${i}`,
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    isLive: false
  });
}

// creating empty array for live messages incoming
let liveMessages: Message[] = [];
let nextId = 100001;

// setting a new message to appear every 3-5 seconds
setInterval(() => {
  const newMessage: Message = {
    id: nextId++,
    userId: `live_user_${Math.floor(Math.random() * 50)}`,
    content: "New message",
    timestamp: new Date().toISOString(),
    isLive: true
  };
  
  liveMessages.unshift(newMessage);
  liveMessages = liveMessages.slice(0, 100);
}, Math.random() * 2000 + 3000);

// setting 5% failure rate through delayed responses
const simulateDelay = () => new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 500));
const shouldFail = () => Math.random() < 0.05;

// get messages api endpoint
app.get('/api/messages', async(req: Request, res: Response) => {
  await simulateDelay();

  if (shouldFail()) {
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }

  const cursor = req.query.cursor ? parseInt(req.query.cursor as string) : undefined;
  const limit = Math.min(100, parseInt(req.query.limit as string) || 50);

  const allMessages = [...liveMessages, ...staticMessages];
  const sortedMessages = [...allMessages].sort((a, b) => b.id - a.id);

  const paginatedMessages = typeof cursor === 'number' && !Number.isNaN(cursor)
    ? sortedMessages.filter(msg => msg.id < cursor).slice(0, limit)
    : sortedMessages.slice(0, limit);

  const nextCursor = paginatedMessages.length > 0
    ? paginatedMessages[paginatedMessages.length - 1].id
    : null;

  const minMessageId = sortedMessages.length > 0 ? sortedMessages[sortedMessages.length - 1].id : null;
  const hasMore = nextCursor !== null && minMessageId !== null && nextCursor > minMessageId;

  res.json({
    data: paginatedMessages,
    pagination: {
      nextCursor,
      perPage: limit,
      hasMore
    },
    meta: {
      hasLiveMessages: liveMessages.length > 0,
      liveCount: liveMessages.length
    }
  });
});

// live messages api endpoint
app.get('/api/messages/live', async(req: Request, res: Response) => {
  await simulateDelay();

  if (shouldFail()) {
    return res.status(500).json({ error: 'Failed to fetch live messages' });
  }
  
  res.json({
    data: liveMessages,
    meta: {
      liveCount: liveMessages.length
    }
  });
});

// start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});