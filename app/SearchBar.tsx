'use client';

import { useState, useCallback, useRef } from 'react';
import { searchMessages, Message } from '@/lib/api-client';

export interface SearchResult {
  id: number;
  index: number;
  content: string;
}

interface SearchBarProps {
  messages: Message[];
  onJumpToResult: (resultIndex: number, results: SearchResult[]) => void;
}

export default function SearchBar({ messages, onJumpToResult }: SearchBarProps) {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const searchCounterRef = useRef(0);

  const performSearch = useCallback(async (query: string) => {
    const currentSearchId = ++searchCounterRef.current;
    
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const result = await searchMessages(query);
      
      if (currentSearchId !== searchCounterRef.current) return;
      
      const resultsWithIndex: SearchResult[] = result.data.map(msg => ({
        id: msg.id,
        index: messages.findIndex(m => m.id === msg.id),
        content: msg.content.substring(0, 100)
      }));
      
      setSearchResults(resultsWithIndex);
    } catch (error) {
      console.error('Search error:', error);
      if (currentSearchId !== searchCounterRef.current) return;
      
      const results: SearchResult[] = [];
      messages.forEach((message, index) => {
        if (message.content.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            id: message.id,
            index: index,
            content: message.content.substring(0, 100)
          });
        }
      });
      setSearchResults(results);
    }
  }, [messages]);

  return (
    <div>
      <div>
        <input
          type="text"
          placeholder="Search messages..."
          className="border p-2 rounded w-full pr-10"
          value={searchQuery}
          onChange={(e) => performSearch(e.target.value)}
        />
      </div>
      {searchResults.length > 0 && (
        <div className="max-h-48 overflow-y-auto">
          {searchResults.map((result, idx) => (
            <div
              key={result.id}
              onClick={() => {
                onJumpToResult(idx, searchResults);
                setSearchResults([]);
                setSearchQuery('');
                searchCounterRef.current++; 
              }}
              className="p-2 hover:bg-gray-100 cursor-pointer border-b"
            >
              <div className="text-sm text-gray-600 truncate">
                {result.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}