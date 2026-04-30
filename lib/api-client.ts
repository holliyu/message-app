const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface Message {
  id: number;
  userId: string;
  content: string;
  timestamp: string;
  isLive?: boolean;
}

export interface MessagesResponse {
  data: Message[];
  pagination: {
    nextCursor: number | null;
    perPage: number;
    hasMore: boolean;
  };
  meta: {
    hasLiveMessages: boolean;
    liveCount: number;
  };
}

export interface LiveMessagesResponse {
  data: Message[];
  meta: {
    liveCount: number;
  };
}

export interface SearchMessagesResponse {
  data: Message[];
  meta: {
    total: number;
    returned: number;
    query: string;
  };
}

export async function fetchMessages(cursor?: number, limit: number = 50): Promise<MessagesResponse> {
  const params = new URLSearchParams();
  if (cursor !== undefined) {
    params.append('cursor', String(cursor));
  }
  params.append('limit', String(limit));

  const response = await fetch(`${API_URL}/api/messages?${params.toString()}`);

  if (!response.ok) {
    if (response.status === 500) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchMessages(cursor, limit);
    }
    throw new Error(`HTTP ${response.status}`);
  }

  const result = await response.json() as MessagesResponse;
  console.log('Full API response:', result);
  return result;
}

export async function fetchLiveMessages(): Promise<LiveMessagesResponse> {
  const response = await fetch(`${API_URL}/api/messages/live`);
  if (!response.ok) return { data: [], meta: { liveCount: 0 } };
  const result = await response.json();
  return result as LiveMessagesResponse;
}

export async function searchMessages(query: string): Promise<SearchMessagesResponse> {
  if (!query.trim()) {
    return { data: [], meta: { total: 0, returned: 0, query: '' } };
  }

  const params = new URLSearchParams();
  params.append('q', query.trim());

  const response = await fetch(`${API_URL}/api/messages/search?${params.toString()}`);

  if (!response.ok) {
    if (response.status === 500) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return searchMessages(query);
    }
    throw new Error(`HTTP ${response.status}`);
  }

  const result = await response.json() as SearchMessagesResponse;
  return result;
}
