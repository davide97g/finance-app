import * as React from "react";
import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { withTranslation, WithTranslation } from "react-i18next";

// Check if we're in development mode
const isDev =
  typeof import.meta !== "undefined"
    ? (import.meta as any).env?.DEV
    : process.env.NODE_ENV === "development";

interface ErrorBoundaryProps extends WithTranslation {
  children: ReactNode;
  /** Fallback UI to show when an error occurs */
  fallback?: ReactNode;
  /** Optional error handler callback */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Name of the section for better error reporting */
  section?: string;
  /** Whether to show a minimal error UI */
  minimal?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component that catches JavaScript errors anywhere in the child
 * component tree and displays a fallback UI instead of crashing the entire app.
 *
 * @example
 * // Global error boundary
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 *
 * // Section-specific error boundary
 * <ErrorBoundary section="Dashboard" minimal>
 *   <DashboardContent />
 * </ErrorBoundary>
 */
export class ErrorBoundaryClass extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log error for debugging
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Error info:", errorInfo);

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // In production, you might want to send this to an error tracking service
    // e.g., Sentry, LogRocket, etc.
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = (): void => {
    window.location.href = "/";
  };

  handleRefresh = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, section, minimal } = this.props;

    if (!hasError) {
      return children;
    }

    // Use custom fallback if provided
    if (fallback) {
      return fallback;
    }

    // Minimal error UI for sections
    if (minimal) {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
          <p className="text-sm text-muted-foreground mb-3">
            {section
              ? this.props.t("error_loading_section", { section })
              : this.props.t("error_occurred")}
          </p>
          <Button variant="outline" size="sm" onClick={this.handleRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {this.props.t("retry")}
          </Button>
        </div>
      );
    }

    // Full error UI
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-destructive/10 rounded-full">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-xl">
              {this.props.t("oops_something_wrong")}
            </CardTitle>
            <CardDescription>
              {section
                ? this.props.t("unexpected_error_section", { section })
                : this.props.t("unexpected_error")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error details (only in development) */}
            {isDev && error && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-xs font-mono text-muted-foreground break-all">
                  <strong>Error:</strong> {error.message}
                </p>
                {errorInfo?.componentStack && (
                  <details className="mt-2">
                    <summary className="text-xs cursor-pointer text-muted-foreground">
                      Stack trace
                    </summary>
                    <pre className="text-xs mt-2 overflow-auto max-h-32 text-muted-foreground">
                      {errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={this.handleRetry} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                {this.props.t("retry")}
              </Button>
              <Button
                variant="outline"
                onClick={this.handleGoHome}
                className="flex-1"
              >
                <Home className="h-4 w-4 mr-2" />
                {this.props.t("go_home")}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              {this.props.t("if_problem_persists")}{" "}
              <button
                onClick={this.handleRefresh}
                className="underline hover:text-foreground transition-colors"
              >
                {this.props.t("refresh_manually")}
              </button>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
}


// Export both the wrapped and unwrapped component
const ErrorBoundaryWithTranslation = withTranslation()(ErrorBoundaryClass as any);
export { ErrorBoundaryWithTranslation as ErrorBoundary };

/**
 * Higher-order component to wrap any component with an error boundary.
 *
 * @example
 * const SafeDashboard = withErrorBoundary(Dashboard, { section: 'Dashboard', minimal: true });
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children" | "t" | "i18n" | "tReady">
): React.FC<P> {
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || "Component";

  const ComponentWithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundaryWithTranslation {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundaryWithTranslation>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return ComponentWithErrorBoundary;
}

/**
 * Custom hook to throw errors from event handlers (which aren't caught by error boundaries).
 * Use this to convert async errors to synchronous errors that ErrorBoundary can catch.
 *
 * @example
 * const throwError = useErrorHandler();
 *
 * const handleClick = async () => {
 *   try {
 *     await riskyOperation();
 *   } catch (error) {
 *     throwError(error as Error);
 *   }
 * };
 */
export function useErrorHandler(): (error: Error) => void {
  const [, setError] = React.useState<Error | null>(null);

  return React.useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);
}
