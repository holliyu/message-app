'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { fetchMessages, fetchLiveMessages, Message } from '@/lib/api-client';
import MessageItem from './MessageItem';
import SearchBar, { SearchResult } from './SearchBar';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [highlightedMessageId, setHighlightedMessageId] = useState<number | null>(null);

  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const nextCursorRef = useRef<number | undefined>(undefined);
  const liveIdsRef = useRef<Set<number>>(new Set());
  const isLoadingRef = useRef(false);
  const hasInitiallyScrolledRef = useRef(false);

  const loadMessages = useCallback(async (isRefresh = false) => {
    if (isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    setIsLoading(true);


    try {
      const cursor = isRefresh ? undefined : nextCursorRef.current;
      const result = await fetchMessages(cursor);

      if (isRefresh) {
        setMessages(result.data);
      } else {
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

  // initial load
  useEffect(() => {
    loadMessages(true);
  }, [loadMessages]);

  const hasMessages = messages.length > 0;
  useEffect(() => {
    if (hasMessages && !hasInitiallyScrolledRef.current) {
      setTimeout(() => {
        virtuosoRef.current?.scrollToIndex({ index: 'LAST' });
      }, 100);
      hasInitiallyScrolledRef.current = true;
    }
  }, [hasMessages]); 


  // live messages polling
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const result = await fetchLiveMessages();
        const newLive = result.data.filter(msg => !liveIdsRef.current.has(msg.id));
        if (newLive.length === 0) return;

        // append new messages to the bottom
        setMessages(prev => [...prev, ...newLive]);
        newLive.forEach(msg => liveIdsRef.current.add(msg.id));
        
        // auto-scroll to newest message if at bottom, otherwise show notification
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

  const handleReachedTop = useCallback(() => {
    if (hasMore && !isLoadingRef.current) {
      loadMessages(false);
    }
  }, [hasMore, loadMessages]);

  const scrollToBottom = useCallback(() => {
    virtuosoRef.current?.scrollToIndex({ index: 'LAST' });
    setNewMessageCount(0);
    setIsAtBottom(true);
  }, []);

  const jumpToResult = useCallback(async (resultIndex: number, searchResults: SearchResult[]): Promise<void> => {
    const result = searchResults[resultIndex];
    if (!result) return;
    
    // if unable to find message, then prompt user to scroll up in order to find it
    if (result.index === -1) {
      alert(`Message ${result.id} found but not yet loaded. Scroll up to load older messages, then search again.`);
      return;
    }
    
    if (!virtuosoRef.current) return;
    
    // scroll to the target index
    virtuosoRef.current.scrollToIndex({
      index: result.index,
      align: 'center',
      behavior: 'smooth'
    });
    
    setHighlightedMessageId(result.id);
    
    setTimeout(() => {
      setHighlightedMessageId(null);
    }, 2000);
  }, []);

  return (
    <div className="justify-center font-sans dark:bg-black">
      <main>
        <h1>Welcome</h1>
        <SearchBar messages={messages} onJumpToResult={jumpToResult} />
        {newMessageCount > 0 && !isAtBottom && (
          <button onClick={scrollToBottom} className="new-message-button">
            ↓ {newMessageCount} new message{newMessageCount !== 1 ? 's' : ''}
          </button>
        )}
        
        <div className="message-container">
          <Virtuoso
            ref={virtuosoRef}
            data={messages}
            totalCount={hasMore ? undefined : messages.length}
            followOutput={(isAtBottom) => {
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
              Header: isLoading ? () => (
                <div className="loading-header">Loading older messages...</div>
              ) : !hasMore ? () => (
                <div className="loading-header">You have reached the beginning</div>
              ) : undefined,
            }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button onClick={scrollToBottom} className="jump-to-bottom-button">
            Jump to Bottom ↓
          </button>
        </div>
      </main>
    </div>
  );
}