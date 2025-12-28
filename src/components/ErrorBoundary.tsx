import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Global Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * Logs error information and displays a fallback UI
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // In production, you would send this to an error reporting service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-destructive/10">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <CardTitle className="text-2xl">Something went wrong</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We're sorry, but something unexpected happened. The error has been logged and we'll look into it.
              </p>

              {/* Show error details in development */}
              {import.meta.env.DEV && this.state.error && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="font-semibold text-sm mb-2">Error Details (Development only):</p>
                  <pre className="text-xs overflow-auto max-h-48 text-destructive">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button onClick={this.handleReset} variant="outline">
                  Try Again
                </Button>
                <Button onClick={this.handleReload} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Reload Page
                </Button>
              </div>

              <p className="text-sm text-muted-foreground pt-4">
                If this problem persists, please{' '}
                <a href="mailto:support@startup-connect.com" className="text-primary hover:underline">
                  contact support
                </a>
                .
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
