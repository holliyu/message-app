import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const port = 3001; 

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(cors());
app.use(express.json());

// Health check - PUT THIS FIRST to test if server is working
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Main messages endpoint
app.get('/api/messages', (req: Request, res: Response) => {
  // Simple test response
  res.json({
    data: [{ id: 1, content: 'Test message' }],
    pagination: { page: 1, total: 1 }
  });
});

// creating message object
interface Message {
  id: number;
  userId: string;
  content: string;
  timestamp: string;
  isLive: boolean;
}

// Generate 100,000 static messages
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

  // returns 500 error based off of simulated delays
  if (shouldFail()) {
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }

  // defines page number and limit of messages per page
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
  
  // adds live message arrays and static messages, then paginates this to return specific range of messages
  const allMessages = [...liveMessages, ...staticMessages];
  const start = (page - 1) * limit;
  const paginatedMessages = allMessages.slice(start, start + limit);
  
  res.json({
    data: paginatedMessages,
    pagination: {
      currentPage: page,
      perPage: limit,
      total: allMessages.length,
      totalPages: Math.ceil(allMessages.length / limit)
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

// Chrome DevTools app-specific endpoint
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req: Request, res: Response) => {
  res.json({
    name: 'mock-server',
    version: '1.0.0',
    description: 'Mock API server for message app'
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});