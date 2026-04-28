'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchMessages, fetchLiveMessages, Message } from '@/lib/api-client';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const nextCursorRef = useRef<number | undefined>(undefined);
  const liveIdsRef = useRef<Set<number>>(new Set());

  const loadMessages = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      nextCursorRef.current = undefined;
      setHasMore(true);
    }

    setIsLoading(true);

    try {
      const cursor = isRefresh ? undefined : nextCursorRef.current;
      const result = await fetchMessages(cursor);

      if (isRefresh) {
        setMessages(result.data);
      } else {
        setMessages(prev => [...prev, ...result.data]);
      }

      result.data.forEach(msg => liveIdsRef.current.add(msg.id));
      nextCursorRef.current = result.pagination.nextCursor ?? undefined;
      setHasMore(result.pagination.hasMore);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    const loadInitialMessages = async () => {
      setIsLoading(true);
      nextCursorRef.current = undefined;
      setHasMore(true);

      try {
        const result = await fetchMessages(undefined);
        setMessages(result.data);
        result.data.forEach(msg => liveIdsRef.current.add(msg.id));
        nextCursorRef.current = result.pagination.nextCursor ?? undefined;
        setHasMore(result.pagination.hasMore);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }

      setIsLoading(false);
    };

    loadInitialMessages();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const result = await fetchLiveMessages();
        const newLive = result.data.filter(msg => !liveIdsRef.current.has(msg.id));
        if (newLive.length === 0) return;

        setMessages(prev => [...newLive, ...prev]);
        newLive.forEach(msg => liveIdsRef.current.add(msg.id));
      } catch (error) {
        console.error('Error fetching live messages:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <h1>Welcome</h1>
        {messages.map(msg => (
          <div key={msg.id}>
            <p>{msg.content}</p>
            <small>{new Date(msg.timestamp).toLocaleString()}</small>
          </div>
        ))}
        {isLoading && <p>Loading...</p>}
        <button onClick={() => loadMessages(false)} disabled={isLoading || !hasMore}>
          Load More
        </button>
        {!hasMore && <p>No more messages.</p>}
      </main>
    </div>
  );
}
