const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface Message {
  id: number;
  userId: string;
  content: string;
  timestamp: string;
  isLive?: boolean;
}

export async function fetchMessages(page: number = 1, limit: number = 50) {
  const response = await fetch(`${API_URL}/api/messages?page=${page}&limit=${limit}`);
  
  if (!response.ok) {
    if (response.status === 500) {
      // Retry on random failure
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchMessages(page, limit);
    }
    throw new Error(`HTTP ${response.status}`);
  }
  
  return response.json();
}

export async function fetchLiveMessages() {
  const response = await fetch(`${API_URL}/api/messages/live`);
  if (!response.ok) return { data: [] };
  return response.json();
}