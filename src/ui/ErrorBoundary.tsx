import { Component, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

/** Shows a recovery screen instead of a blank page if something throws while rendering. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('Dragon Vision crashed', error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="crash">
        <div className="panel">
          <h2>Something went wrong</h2>
          <p>Your progress is saved. Reload to keep playing.</p>
          <pre className="crash-detail">{this.state.error.message}</pre>
          <button className="btn primary" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      </div>
    );
  }
}
