import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMatches } from '@/hooks/useMatches';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import '@testing-library/jest-dom';

// Mock the dependencies
const mockUseAuth = vi.fn();
const mockUseToast = vi.fn();
const mockToast = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => mockUseToast(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
      in: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn(() => Promise.resolve({})),
      })),
    })),
    removeChannel: vi.fn(),
  },
}));

describe('Match Generation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseToast.mockReturnValue({ toast: mockToast });
  });

  it('fetches matches for talent role', async () => {
    const mockUser = { id: 'user-123' };
    const mockProfile = { role: 'talent' };
    const mockMatches = [
      {
        id: 'match-1',
        score: 95,
        startup_id: 'startup-1',
        talent_id: 'user-123',
        startup: {
          id: 'startup-1',
          name: 'Test Startup',
          description: 'Test Description',
          industry: 'Tech',
          stage: 'seed',
          founder: {
            id: 'founder-1',
            full_name: 'Founder Name',
            avatar_url: null,
            skills: ['React', 'Node.js'],
          },
        },
        talent: {
          id: 'user-123',
          full_name: 'Talent Name',
          avatar_url: null,
          bio: 'Test bio',
          skills: ['React', 'TypeScript'],
        },
      },
    ];

    mockUseAuth.mockReturnValue({
      user: mockUser,
      profile: mockProfile,
    });

    // Mock the supabase response for talent
    const mockSupabaseFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: mockMatches, error: null })),
          })),
        })),
      })),
    }));

    // Replace the mock temporarily for this test
    const originalSupabase = supabase;
    Object.defineProperty(originalSupabase, 'from', {
      value: mockSupabaseFrom,
    });

    const { result } = renderHook(() => useMatches());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.matches).toEqual(mockMatches);
    });

    // Restore original mock
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
    }));
  });

  it('fetches matches for founder role', async () => {
    const mockUser = { id: 'founder-123' };
    const mockProfile = { role: 'founder' };
    const mockStartups = [{ id: 'startup-1' }];
    const mockMatches = [
      {
        id: 'match-1',
        score: 90,
        startup_id: 'startup-1',
        talent_id: 'talent-1',
        startup: {
          id: 'startup-1',
          name: 'Test Startup',
          description: 'Test Description',
          industry: 'Tech',
          stage: 'seed',
          founder_id: 'founder-123',
        },
        talent: {
          id: 'talent-1',
          full_name: 'Talent Name',
          avatar_url: null,
          bio: 'Test bio',
          skills: ['React', 'TypeScript'],
        },
      },
    ];

    mockUseAuth.mockReturnValue({
      user: mockUser,
      profile: mockProfile,
    });

    // Mock the supabase response for founder - first for startups, then for matches
    const mockSupabaseFrom = vi.fn((table: string) => {
      if (table === 'startups') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: mockStartups, error: null })),
          })),
        };
      } else if (table === 'matches') {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({ data: mockMatches, error: null })),
              })),
            })),
          })),
        };
      }
    });

    // Replace the mock temporarily for this test
    const originalSupabase = supabase;
    Object.defineProperty(originalSupabase, 'from', {
      value: mockSupabaseFrom,
    });

    const { result } = renderHook(() => useMatches());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.matches).toEqual(mockMatches);
    });

    // Restore original mock
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
    }));
  });

  it('handles error when fetching matches', async () => {
    const mockUser = { id: 'user-123' };
    const mockProfile = { role: 'talent' };
    const mockError = new Error('Failed to fetch matches');

    mockUseAuth.mockReturnValue({
      user: mockUser,
      profile: mockProfile,
    });

    // Mock the supabase response to return an error
    const mockSupabaseFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: null, error: mockError })),
          })),
        })),
      })),
    }));

    // Replace the mock temporarily for this test
    const originalSupabase = supabase;
    Object.defineProperty(originalSupabase, 'from', {
      value: mockSupabaseFrom,
    });

    const { result } = renderHook(() => useMatches());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to fetch matches');
    });

    // Verify that toast was called with error message
    expect(mockToast).toHaveBeenCalledWith({
      variant: 'destructive',
      title: 'Error fetching matches',
      description: 'Failed to fetch matches',
    });

    // Restore original mock
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
    }));
  });

  it('returns empty matches when no user is authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
    });

    const { result } = renderHook(() => useMatches());

    expect(result.current.loading).toBe(true);
    expect(result.current.matches).toEqual([]);
  });
});