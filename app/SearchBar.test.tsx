import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchBar from './SearchBar';
import { searchMessages } from '@/lib/api-client';

// Mock the API client
jest.mock('@/lib/api-client', () => ({
  searchMessages: jest.fn(),
}));

const searchMessagesMock = searchMessages as jest.MockedFunction<typeof searchMessages>;

describe('SearchBar', () => {
  const mockMessages = [
    { id: 1, content: 'Test message 1', timestamp: '2024-01-01T00:00:00Z', userId: 'user1' },
    { id: 2, content: 'Test message 2', timestamp: '2024-01-01T00:01:00Z', userId: 'user2' },
  ];

  const mockOnJumpToResult = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    searchMessagesMock.mockResolvedValue({
      data: [],
      meta: { total: 0, returned: 0, query: '' },
    });
  });

  it('should render the search input', () => {
    render(<SearchBar messages={mockMessages} onJumpToResult={mockOnJumpToResult} />);
    expect(screen.getByPlaceholderText('Search messages...')).toBeInTheDocument();
  });

  it('should clear results when query is empty', async () => {
    render(<SearchBar messages={mockMessages} onJumpToResult={mockOnJumpToResult} />);
    
    const input = screen.getByPlaceholderText('Search messages...');
    
    // Type and then clear
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.change(input, { target: { value: '' } });
    
    // Results should be cleared
    await waitFor(() => {
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  it('should call onJumpToResult when a result is clicked', async () => {
    searchMessagesMock.mockResolvedValue({
      data: [
        { id: 1, content: 'Test message 1', timestamp: '2024-01-01T00:00:00Z', userId: 'user1' },
      ],
      meta: { total: 1, returned: 1, query: 'test' },
    });

    render(<SearchBar messages={mockMessages} onJumpToResult={mockOnJumpToResult} />);
    
    const input = screen.getByPlaceholderText('Search messages...');
    fireEvent.change(input, { target: { value: 'test' } });
    
    await waitFor(() => {
      const resultItem = screen.getByText('Test message 1');
      fireEvent.click(resultItem);
    });
    
    expect(mockOnJumpToResult).toHaveBeenCalledWith(0, expect.arrayContaining([
      expect.objectContaining({ id: 1 }),
    ]));
  });

  it('should clear search after selecting a result', async () => {
    searchMessagesMock.mockResolvedValue({
      data: [
        { id: 1, content: 'Test message 1', timestamp: '2024-01-01T00:00:00Z', userId: 'user1' },
      ],
      meta: { total: 1, returned: 1, query: 'test' },
    });

    render(<SearchBar messages={mockMessages} onJumpToResult={mockOnJumpToResult} />);
    
    const input = screen.getByPlaceholderText('Search messages...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'test' } });
    
    await waitFor(() => {
      const resultItem = screen.getByText('Test message 1');
      fireEvent.click(resultItem);
    });
    
    // Input should be cleared
    await waitFor(() => {
      expect(input.value).toBe('');
    });
    
    // Results should be hidden
    await waitFor(() => {
      expect(screen.queryByText('Test message 1')).not.toBeInTheDocument();
    });
  });
});