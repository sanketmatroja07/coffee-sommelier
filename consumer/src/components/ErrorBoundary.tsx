import { Component, ErrorInfo, ReactNode } from "react";
import { clearAppStorage } from "../lib/storage";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h1>Something went wrong</h1>
          <p>Please refresh the page or try again later.</p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <button onClick={() => window.location.reload()}>Refresh</button>
            <button
              onClick={() => {
                clearAppStorage();
                window.location.reload();
              }}
            >
              Reset app data
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
