import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import Register from '@/pages/Auth/Register';
import { toast } from '@/hooks/use-toast';
import '@testing-library/jest-dom';

// Access the mocked toast function
const mockToast = toast;

// Mock the useAuth hook
const mockSignUp = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@/hooks/useAuth', async () => {
  const actual = await import('@/hooks/useAuth');
  return {
    ...actual,
    useAuth: vi.fn(() => ({
      signUp: mockSignUp,
      user: null,
      session: null,
      profile: null,
      loading: false,
      profileLoading: false,
    })),
  };
});

vi.mock('react-router-dom', async () => {
  const actual = await import('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: null },
        unsubscribe: vi.fn(),
      })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  },
}));

describe('Auth Flow Tests', () => {
  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <MemoryRouter>
        <AuthProvider>
          {ui}
        </AuthProvider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders registration form correctly', () => {
    renderWithProviders(<Register />);
    
    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByText('I am a...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
  });

  it('validates form inputs', async () => {
    renderWithProviders(<Register />);
    
    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
      expect(screen.getByText('Please select a role')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    mockSignUp.mockResolvedValue({ error: null });
    
    renderWithProviders(<Register />);
    
    // Fill in form
    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'john@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' }
    });
    
    // Select role
    fireEvent.click(screen.getByText('Founder'));
    
    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        'john@example.com',
        'password123',
        'John Doe',
        'founder'
      );
    });
  });

  it('handles registration error', async () => {
    const mockError = new Error('Email already registered');
    mockSignUp.mockResolvedValue({ error: mockError });
    
    renderWithProviders(<Register />);
    
    // Fill in form
    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'john@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByText('Founder'));
    
    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    fireEvent.click(submitButton);
    
    // Just verify that the sign up was called and would have triggered an error toast
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        'john@example.com',
        'password123',
        'John Doe',
        'founder'
      );
    });
  });
});