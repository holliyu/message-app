import { render, screen, waitFor } from '@testing-library/react';
import Home from './page';
import { fetchMessages, fetchLiveMessages } from '@/lib/api-client';

// Mock the API client
jest.mock('@/lib/api-client', () => ({
  fetchMessages: jest.fn(),
  fetchLiveMessages: jest.fn(),
  searchMessages: jest.fn(),
}));

// Mock react-virtuoso
jest.mock('react-virtuoso', () => ({
  Virtuoso: ({ itemContent, data }: { itemContent: (index: number, item: unknown) => React.ReactNode; data?: unknown[] }) => (
    <div data-testid="virtuoso">
      {data?.map((item: unknown, index: number) => (
        <div key={index} data-testid="message-item">
          {itemContent(index, item)}
        </div>
      ))}
    </div>
  ),
}));

// Default mock implementations
const fetchMessagesMock = fetchMessages as jest.MockedFunction<typeof fetchMessages>;
const fetchLiveMessagesMock = fetchLiveMessages as jest.MockedFunction<typeof fetchLiveMessages>;

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock responses
    fetchMessagesMock.mockResolvedValue({
      data: [],
      pagination: { nextCursor: null, perPage: 50, hasMore: false },
      meta: { hasLiveMessages: false, liveCount: 0 },
    });
    
    fetchLiveMessagesMock.mockResolvedValue({
      data: [],
      meta: { liveCount: 0 },
    });
  });

  it('should render the welcome heading', () => {
    render(<Home />);
    expect(screen.getByText('Welcome')).toBeInTheDocument();
  });

  it('should render the search input', () => {
    render(<Home />);
    expect(screen.getByPlaceholderText('Search messages...')).toBeInTheDocument();
  });

  it('should render the jump to bottom button', () => {
    render(<Home />);
    expect(screen.getByText('Jump to Bottom ↓')).toBeInTheDocument();
  });

  it('should call fetchMessages on mount', async () => {
    render(<Home />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(fetchMessagesMock).toHaveBeenCalled();
    });
  });

  it('should display messages when loaded', async () => {
    fetchMessagesMock.mockResolvedValue({
      data: [
        { id: 1, content: 'Test message 1', timestamp: '2024-01-01T00:00:00Z', userId: 'user1' },
        { id: 2, content: 'Test message 2', timestamp: '2024-01-01T00:01:00Z', userId: 'user2' },
      ],
      pagination: { nextCursor: null, perPage: 50, hasMore: false },
      meta: { hasLiveMessages: false, liveCount: 0 },
    });

    render(<Home />);
    
    await waitFor(() => {
      expect(screen.getAllByTestId('message-item').length).toBeGreaterThan(0);
    });
  });

  it('should call fetchLiveMessages periodically', async () => {
    render(<Home />);
    
    // Wait for live message polling (3 second interval)
    await waitFor(() => {
      expect(fetchLiveMessagesMock).toHaveBeenCalled();
    }, { timeout: 5000 });
  });
});
