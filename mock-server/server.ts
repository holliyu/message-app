import express, { Request, Response } from 'express';
import cors from 'cors';
import * as fs from 'fs';
import * as path from 'path';

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

interface Message {
  id: number;
  userId: string;
  content: string;
  timestamp: string;
  isLive: boolean;
}

let staticMessages: Message[] = [];
try {
  const messagesPath = path.join(__dirname, 'messages.json');
  const data = fs.readFileSync(messagesPath, 'utf8');
  staticMessages = JSON.parse(data);
} catch (error) {
  console.error('Error loading messages.json:', error);
}

let liveMessages: Message[] = [];
let nextId = 100001;

// setting a new message to appear every 3-5 seconds
setInterval(() => {
  const newMessage: Message = {
    id: nextId++,
    userId: `live_user_${Math.floor(Math.random() * 50)}`,
    content: `New live message`,
    timestamp: new Date().toISOString(),
    isLive: true
  };
  
  // adds live messages to the end of the array (newest last)
  liveMessages.push(newMessage);
  if (liveMessages.length > 100) {
    liveMessages = liveMessages.slice(-100);
  }
}, Math.random() * 2000 + 3000);

// setting 5% failure rate through delayed responses
const simulateDelay = () => new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 500));
const shouldFail = () => Math.random() < 0.05;

// GET messages api endpoint
app.get('/api/messages', async(req: Request, res: Response) => {
  await simulateDelay();

  if (shouldFail()) {
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }

  const cursor = req.query.cursor ? parseInt(req.query.cursor as string) : undefined;
  const limit = Math.min(100, parseInt(req.query.limit as string) || 50);

  // combine existing and live messages
  const allMessages = [...staticMessages, ...liveMessages];
  
  const sortedMessages = [...allMessages].sort((a, b) => a.id - b.id);
  
  let paginatedMessages: Message[];
  let nextCursor: number | null = null;
  
  if (typeof cursor === 'number' && !Number.isNaN(cursor)) {
    paginatedMessages = sortedMessages.filter(msg => msg.id < cursor).slice(-limit);
  } else {
    paginatedMessages = sortedMessages.slice(-limit);
  }
  
  if (paginatedMessages.length > 0) {
    const firstMessage = paginatedMessages[0];
    const hasMoreMessages = sortedMessages.some(msg => msg.id < firstMessage.id);
    nextCursor = hasMoreMessages ? firstMessage.id : null;
  }
  
  const hasMore = nextCursor !== null;

  res.json({
    data: paginatedMessages,
    pagination: {
      nextCursor,
      perPage: limit,
      hasMore
    },
    meta: {
      hasLiveMessages: liveMessages.length > 0,
      liveCount: liveMessages.length,
      totalMessages: sortedMessages.length
    }
  });
});

// GET live messages endpoint 
app.get('/api/messages/live', async(req: Request, res: Response) => {
  await simulateDelay();

  if (shouldFail()) {
    return res.status(500).json({ error: 'Failed to fetch live messages' });
  }
  
  // return live messages in order (oldest first)
  res.json({
    data: liveMessages,
    meta: {
      liveCount: liveMessages.length
    }
  });
});

// GET search messages endpoint - searches both static and live messages
app.get('/api/messages/search', async(req: Request, res: Response) => {
  await simulateDelay();

  if (shouldFail()) {
    return res.status(500).json({ error: 'Failed to search messages' });
  }

  const query = (req.query.q as string)?.toLowerCase().trim();
  if (!query) {
    return res.json({ data: [], meta: { total: 0, query: '' } });
  }

  const allMessages = [...staticMessages, ...liveMessages];
  
  const results = allMessages.filter(msg => 
    msg.content.toLowerCase().includes(query)
  );

  const sortedResults = results.sort((a, b) => b.id - a.id).slice(0, 100);

  res.json({
    data: sortedResults,
    meta: {
      total: results.length,
      returned: sortedResults.length,
      query: query
    }
  });
});

// start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});