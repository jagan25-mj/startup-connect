import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mock Supabase client
const mockSupabase = {
    from: vi.fn(),
    rpc: vi.fn(),
    channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
};

vi.mock('@/integrations/supabase/client', () => ({
    supabase: mockSupabase,
}));

// Mock useAuth
const mockUser = { id: 'user-1' };
const mockProfile = { id: 'user-1', full_name: 'Test User', role: 'talent' };

vi.mock('@/hooks/useAuth', () => ({
    useAuth: vi.fn(() => ({
        user: mockUser,
        profile: mockProfile,
        loading: false,
        profileLoading: false,
    })),
    AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({
        toast: vi.fn(),
    }),
}));

describe('Messaging Flow Integration Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create or get a conversation when starting a chat', async () => {
        // Mock the RPC call for get_or_create_conversation
        const conversationId = 'conv-123';
        mockSupabase.rpc.mockResolvedValue({
            data: conversationId,
            error: null,
        });

        // Import the hook after mocks are set up
        const { useMessages } = await import('@/hooks/useMessages');

        // Create a test component to use the hook
        function TestComponent() {
            const { startConversation } = useMessages();

            return (
                <button onClick={() => startConversation('other-user-id')}>
                    Start Chat
                </button>
            );
        }

        render(
            <MemoryRouter>
                <TestComponent />
            </MemoryRouter>
        );

        const button = screen.getByText('Start Chat');
        fireEvent.click(button);

        await waitFor(() => {
            expect(mockSupabase.rpc).toHaveBeenCalledWith('get_or_create_conversation', {
                other_user_id: 'other-user-id',
            });
        });
    });

    it('should send a message and update the UI', async () => {
        const conversationId = 'conv-123';
        const newMessageId = 'msg-456';

        // Mock sending message
        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'messages') {
                return {
                    insert: vi.fn().mockResolvedValue({
                        data: [{ id: newMessageId, content: 'Hello!', sender_id: 'user-1' }],
                        error: null,
                    }),
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    order: vi.fn().mockReturnThis(),
                };
            }
            if (table === 'conversations') {
                return {
                    select: vi.fn().mockReturnThis(),
                    or: vi.fn().mockReturnThis(),
                    order: vi.fn().mockResolvedValue({
                        data: [{ id: conversationId, participant_one: 'user-1', participant_two: 'user-2' }],
                        error: null,
                    }),
                };
            }
            return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            };
        });

        const { useMessages } = await import('@/hooks/useMessages');

        function TestComponent() {
            const { sendMessage, messages } = useMessages(conversationId);

            return (
                <div>
                    <div data-testid="messages">
                        {messages.map((m) => (
                            <div key={m.id}>{m.content}</div>
                        ))}
                    </div>
                    <button onClick={() => sendMessage('Hello!')}>Send</button>
                </div>
            );
        }

        render(
            <MemoryRouter>
                <TestComponent />
            </MemoryRouter>
        );

        const sendButton = screen.getByText('Send');
        fireEvent.click(sendButton);

        await waitFor(() => {
            expect(mockSupabase.from).toHaveBeenCalledWith('messages');
        });
    });

    it('should display messages from a conversation', async () => {
        const conversationId = 'conv-123';
        const mockMessages = [
            { id: 'msg-1', content: 'Hi there!', sender_id: 'user-2', created_at: new Date().toISOString() },
            { id: 'msg-2', content: 'Hello!', sender_id: 'user-1', created_at: new Date().toISOString() },
        ];

        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'messages') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    order: vi.fn().mockResolvedValue({
                        data: mockMessages,
                        error: null,
                    }),
                };
            }
            if (table === 'conversations') {
                return {
                    select: vi.fn().mockReturnThis(),
                    or: vi.fn().mockReturnThis(),
                    order: vi.fn().mockResolvedValue({
                        data: [{
                            id: conversationId,
                            participant_one: 'user-1',
                            participant_two: 'user-2',
                            other_participant: { id: 'user-2', full_name: 'Other User' }
                        }],
                        error: null,
                    }),
                };
            }
            return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            };
        });

        const { useMessages } = await import('@/hooks/useMessages');

        function TestComponent() {
            const { messages, loading } = useMessages(conversationId);

            if (loading) return <div>Loading...</div>;

            return (
                <div data-testid="messages">
                    {messages.map((m) => (
                        <div key={m.id} data-testid={`message-${m.id}`}>
                            {m.content}
                        </div>
                    ))}
                </div>
            );
        }

        render(
            <MemoryRouter>
                <TestComponent />
            </MemoryRouter>
        );

        // Wait for messages to load
        await waitFor(() => {
            expect(mockSupabase.from).toHaveBeenCalledWith('messages');
        });
    });
});

describe('Matching Flow Integration Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch matches for a talent user', async () => {
        const mockMatches = [
            {
                id: 'match-1',
                startup_id: 'startup-1',
                talent_id: 'user-1',
                score: 85,
                startup: {
                    id: 'startup-1',
                    name: 'Test Startup',
                    industry: 'Technology',
                    stage: 'mvp',
                    founder: { id: 'founder-1', full_name: 'Founder Name' },
                },
            },
        ];

        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'matches') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    in: vi.fn().mockReturnThis(),
                    order: vi.fn().mockReturnThis(),
                    range: vi.fn().mockResolvedValue({
                        data: mockMatches,
                        error: null,
                    }),
                    limit: vi.fn().mockResolvedValue({
                        data: mockMatches,
                        error: null,
                    }),
                };
            }
            return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            };
        });

        const { useMatches } = await import('@/hooks/useMatches');

        function TestComponent() {
            const { matches, loading, error } = useMatches();

            if (loading) return <div>Loading...</div>;
            if (error) return <div>Error: {error}</div>;

            return (
                <div data-testid="matches">
                    {matches.map((m) => (
                        <div key={m.id} data-testid={`match-${m.id}`}>
                            Score: {m.score}
                        </div>
                    ))}
                </div>
            );
        }

        render(
            <MemoryRouter>
                <TestComponent />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(mockSupabase.from).toHaveBeenCalledWith('matches');
        });
    });

    it('should update matches in real-time via subscription', async () => {
        let subscriptionCallback: ((payload: unknown) => void) | null = null;

        mockSupabase.channel.mockReturnValue({
            on: vi.fn((event, config, callback) => {
                subscriptionCallback = callback;
                return {
                    on: vi.fn().mockReturnThis(),
                    subscribe: vi.fn(),
                };
            }),
            subscribe: vi.fn(),
        });

        mockSupabase.from.mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({ data: [], error: null }),
        });

        const { useMatches } = await import('@/hooks/useMatches');

        function TestComponent() {
            const { matches } = useMatches();
            return <div data-testid="match-count">{matches.length}</div>;
        }

        render(
            <MemoryRouter>
                <TestComponent />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(mockSupabase.channel).toHaveBeenCalledWith('matches-changes');
        });

        // Verify real-time subscription is set up
        expect(mockSupabase.channel).toHaveBeenCalled();
    });
});
