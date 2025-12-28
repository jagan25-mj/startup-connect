import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import '@testing-library/jest-dom';

// Mock the useAuth hook
const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Protected Route Tests', () => {
  const TestComponent = () => <div>Protected Content</div>;

  interface MockUser {
    id?: string;
  }

  interface MockProfile {
    role?: string;
  }

  const renderWithProviders = (ui: React.ReactElement, user: MockUser | null = null, profile: MockProfile | null = null, loading: boolean = false) => {
    mockUseAuth.mockReturnValue({
      user,
      profile,
      loading,
      profileLoading: false,
    });

    return render(
      <MemoryRouter initialEntries={['/protected']}>
        <AuthProvider>
          <Routes>
            <Route path="/protected" element={ui} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );
  };

  it('redirects to login when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      profileLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <AuthProvider>
          <Routes>
            <Route path="/protected" element={
              <ProtectedRoute>
                <TestComponent />
              </ProtectedRoute>
            } />
            <Route path="/auth/login" element={<div>Login Page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Should navigate to login page
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('shows loading state when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      loading: true,
      profileLoading: false,
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <TestComponent />
              </ProtectedRoute>
            } />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('loader')).toBeInTheDocument(); // Loader2 element
  });

  it('renders protected content when user is authenticated with correct role', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '123' },
      profile: { role: 'founder' },
      loading: false,
      profileLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <AuthProvider>
          <Routes>
            <Route 
              path="/protected" 
              element={
                <ProtectedRoute requiredRole="founder">
                  <TestComponent />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects when user does not have required role', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '123' },
      profile: { role: 'talent' }, // Different role than required
      loading: false,
      profileLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <AuthProvider>
          <Routes>
            <Route 
              path="/protected" 
              element={
                <ProtectedRoute requiredRole="founder">
                  <TestComponent />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Since we can't test actual navigation, we check that content is not rendered
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders protected content when no role is required', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '123' },
      profile: { role: 'talent' },
      loading: false,
      profileLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <AuthProvider>
          <Routes>
            <Route 
              path="/protected" 
              element={
                <ProtectedRoute>
                  <TestComponent />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});