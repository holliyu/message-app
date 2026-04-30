import { render, screen } from '@testing-library/react';
import MessageItem from './MessageItem';

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

describe('MessageItem', () => {
  const mockMessage = {
    id: 1,
    content: 'Test message content',
    timestamp: '2024-01-01T12:00:00Z',
    userId: 'user123',
  };

  const mockOnHighlightComplete = jest.fn();

  it('should render message content', () => {
    render(
      <MessageItem
        message={mockMessage}
        isHighlighted={false}
        onHighlightComplete={mockOnHighlightComplete}
      />
    );
    
    expect(screen.getByText('Test message content')).toBeInTheDocument();
  });

  it('should render formatted timestamp', () => {
    render(
      <MessageItem
        message={mockMessage}
        isHighlighted={false}
        onHighlightComplete={mockOnHighlightComplete}
      />
    );
    
    // Timestamp should be formatted as a date string
    const timestampElement = screen.getByText((content) => {
      return content.includes('2024') || content.includes('01');
    });
    expect(timestampElement).toBeInTheDocument();
  });

  it('should apply highlight styling when isHighlighted is true', () => {
    const { container } = render(
      <MessageItem
        message={mockMessage}
        isHighlighted={true}
        onHighlightComplete={mockOnHighlightComplete}
      />
    );
    
    const messageDiv = container.firstChild as HTMLElement;
    // Browser converts hex to rgb format
    expect(messageDiv.style.backgroundColor).toBe('rgb(254, 243, 199)');
  });

  it('should not apply highlight styling when isHighlighted is false', () => {
    const { container } = render(
      <MessageItem
        message={mockMessage}
        isHighlighted={false}
        onHighlightComplete={mockOnHighlightComplete}
      />
    );
    
    const messageDiv = container.firstChild as HTMLElement;
    // transparent is the expected value
    expect(messageDiv.style.backgroundColor).toBe('transparent');
  });

  it('should call onHighlightComplete after highlight animation', async () => {
    jest.useFakeTimers();
    
    render(
      <MessageItem
        message={mockMessage}
        isHighlighted={true}
        onHighlightComplete={mockOnHighlightComplete}
      />
    );
    
    // Wait for the setTimeout in the useEffect
    jest.advanceTimersByTime(1000);
    
    expect(mockOnHighlightComplete).toHaveBeenCalled();
    
    jest.useRealTimers();
  });

  it('should not call onHighlightComplete when not highlighted', async () => {
    jest.useFakeTimers();
    
    // Create a fresh mock for this test
    const freshOnHighlightComplete = jest.fn();
    
    render(
      <MessageItem
        message={mockMessage}
        isHighlighted={false}
        onHighlightComplete={freshOnHighlightComplete}
      />
    );
    
    jest.advanceTimersByTime(1000);
    
    expect(freshOnHighlightComplete).not.toHaveBeenCalled();
    
    jest.useRealTimers();
  });
});
