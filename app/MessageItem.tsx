import React, { useEffect } from 'react';
import { Message } from '@/lib/api-client';

export default function MessageItem({ message, isHighlighted, onHighlightComplete }: { message: Message, isHighlighted: boolean, onHighlightComplete: () => void }) {
  const itemRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
    if (isHighlighted && itemRef.current) {
      // Trigger reflow to ensure animation plays
      itemRef.current.scrollIntoView({ block: 'center' });
      
      // Call cleanup after animation completes
      const timer = setTimeout(onHighlightComplete, 1000);
      return () => clearTimeout(timer);
    }
  }, [isHighlighted, onHighlightComplete]);
  
  return (
    <div
      ref={itemRef}
      style={{
        padding: '12px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: isHighlighted ? '#fef3c7' : 'transparent', // Yellow highlight
        transition: 'background-color 0.3s ease',
      }}
    >
      <p style={{ margin: 0, fontWeight: 500, color: isHighlighted ? '#92400e' : 'inherit' }}>
        {message.content}
      </p>
      <small style={{ color: '#6b7280' }}>
        {new Date(message.timestamp).toLocaleString()}
      </small>
    </div>
  );
};