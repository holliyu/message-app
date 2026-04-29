'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { fetchMessages, fetchLiveMessages, Message } from '@/lib/api-client';
import MessageItem from './MessageItem';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedMessageId, setHighlightedMessageId] = useState<number | null>(null);

  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const nextCursorRef = useRef<number | undefined>(undefined);
  const liveIdsRef = useRef<Set<number>>(new Set());
  const isLoadingRef = useRef(false);
  const hasInitiallyScrolledRef = useRef(false);

  interface SearchResult {
    id: number;
    index: number;
    content: string;
  }

  const loadMessages = useCallback(async (isRefresh = false) => {
    if (isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    setIsLoading(true);

    try {
      const cursor = isRefresh ? undefined : nextCursorRef.current;
      const result = await fetchMessages(cursor);

      if (isRefresh) {
        // Initial load: API returns newest messages, store as-is
        setMessages(result.data);
      } else {
        // Loading older messages: prepend them to the beginning
        // API returns messages sorted oldest-first within the batch
        setMessages(prev => [...result.data, ...prev]);
      }

      result.data.forEach(msg => liveIdsRef.current.add(msg.id));
      nextCursorRef.current = result.pagination.nextCursor ?? undefined;
      setHasMore(result.pagination.hasMore);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }

    setIsLoading(false);
    isLoadingRef.current = false;
  }, []);

  // Initial load
  useEffect(() => {
    loadMessages(true);
  }, [loadMessages]);

  // Scroll to bottom AFTER React has rendered the initial messages
  useEffect(() => {
    console.log('Scroll effect triggered, messages.length:', messages.length, 'hasInitiallyScrolledRef:', hasInitiallyScrolledRef.current);
    if (messages.length > 0 && !hasInitiallyScrolledRef.current) {
      // This runs after React commits the render, so DOM is updated
      // Use { index: 'LAST' } to scroll to the last item (bottom)
      console.log('Scrolling to LAST, total messages:', messages.length);
      // Use setTimeout to ensure Virtuoso has fully rendered
      setTimeout(() => {
        virtuosoRef.current?.scrollToIndex({ index: 'LAST' });
        console.log('Scroll command executed');
      }, 100);
      hasInitiallyScrolledRef.current = true;
    }
  }, [messages.length]);

  // live messages polling
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const result = await fetchLiveMessages();
        const newLive = result.data.filter(msg => !liveIdsRef.current.has(msg.id));
        if (newLive.length === 0) return;

        // Append new messages to the bottom
        setMessages(prev => [...prev, ...newLive]);
        newLive.forEach(msg => liveIdsRef.current.add(msg.id));
        
        // Auto-scroll if at bottom, otherwise show notification
        if (isAtBottom) {
          virtuosoRef.current?.scrollToIndex({ index: 'LAST', behavior: 'smooth' });
        } else {
          setNewMessageCount(prev => prev + newLive.length);
        }
      } catch (error) {
        console.error('Error fetching live messages:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isAtBottom]);

  // Handle reaching the top (load more older messages)
  const handleReachedTop = useCallback(() => {
    if (hasMore && !isLoadingRef.current) {
      loadMessages(false);
    }
  }, [hasMore, loadMessages]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    virtuosoRef.current?.scrollToIndex({ index: 'LAST' });
    setNewMessageCount(0);
    setIsAtBottom(true);
  }, []);

  const performSearch = useCallback((query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      return;
  }

  const results: SearchResult[] = [];
    messages.forEach((message, index) => {
      if (message.content.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          id: message.id,
          index: index,
          content: message.content.substring(0, 100) // preview
        });
      }
    });
    setSearchResults(results);
    setSearchQuery(query);
  }, [messages]);

  // Jump to a specific search result
  const jumpToResult = useCallback((resultIndex: number) => {
    if (!virtuosoRef.current) return;
    
    const result = searchResults[resultIndex];
    if (!result) return;
    
    // Scroll to the target index
    virtuosoRef.current.scrollToIndex({
      index: result.index,
      align: 'center',
      behavior: 'smooth'
    });
    
    // Set highlight using message ID (not index) - more reliable when messages are prepended
    setHighlightedMessageId(result.id);
    
    // Clear highlight after 2 seconds
    setTimeout(() => {
      setHighlightedMessageId(null);
    }, 2000);
  }, [searchResults]);

  return (
    <div className="justify-center font-sans dark:bg-black">
      <main className="flex flex-1 w-full flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <h1>Welcome</h1>
        <input
          type="text"
          placeholder="Search messages"
          className="border p-2 rounded w-full mb-4"
          value={searchQuery}
          onChange={(e) => performSearch(e.target.value)}
        />
        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="mt-2 border rounded max-h-48 overflow-y-auto">
            {searchResults.map((result, idx) => (
              <div
                key={result.id}
                onClick={() => jumpToResult(idx)}
                className="p-2 hover:bg-gray-100 cursor-pointer border-b"
              >
                <div className="text-sm text-gray-600 truncate">
                  {result.content}
                </div>
              </div>
            ))}
          </div>
        )}
        {/* New message indicator - Virtuoso's sticky footer handles this elegantly */}
        {newMessageCount > 0 && !isAtBottom && (
          <button
            onClick={scrollToBottom}
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              zIndex: 1000,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            ↓ {newMessageCount} new message{newMessageCount !== 1 ? 's' : ''}
          </button>
        )}
        
        {/* Virtuoso handles all scroll anchoring automatically! */}
        <div style={{ height: '500px', width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <Virtuoso
            ref={virtuosoRef}
            data={messages}
            totalCount={hasMore ? undefined : messages.length}
            followOutput={(isAtBottom) => {
              // Only auto-scroll for live messages after initial load
              if (isAtBottom && hasInitiallyScrolledRef.current) {
                return 'smooth';
              }
              return false;
            }}
            atBottomStateChange={setIsAtBottom}
            atTopStateChange={handleReachedTop}
            overscan={200}
            itemContent={(index, message) => (
              <MessageItem
                message={message}
                isHighlighted={highlightedMessageId === message.id}
                onHighlightComplete={() => {
                  if (highlightedMessageId === message.id) {
                    setHighlightedMessageId(null);
                  }
                }}
              />
            )}
            components={{
              // Show loading indicator at top when loading older messages
              Header: isLoading ? () => (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '8px' }}>
                  Loading older messages...
                </div>
              ) : !hasMore ? () => (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '8px' }}>
                  You have reached the beginning
                </div>
              ) : undefined,
            }}
          />
        </div>
        
        {/* Navigation button */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button
            onClick={scrollToBottom}
            style={{
              padding: '8px 16px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Jump to Bottom ↓
          </button>
        </div>
      </main>
    </div>
  );
}