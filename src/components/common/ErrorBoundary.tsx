'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
  label?: string;
}

interface State {
  hasError: boolean;
}

// Panel-level error boundary. Wrapping each major widget individually means
// one bad API response or render bug takes down a single card, not the
// entire broadcast — critical for a screen running unattended for weeks.
export class ErrorBoundary extends React.Component<Props, State> {
  private resetTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error(`[ErrorBoundary${this.props.label ? `:${this.props.label}` : ''}]`, error);
    this.resetTimer = setTimeout(() => this.setState({ hasError: false }), 10000);
  }

  componentWillUnmount() {
    if (this.resetTimer) clearTimeout(this.resetTimer);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full items-center justify-center panel-border rounded bg-terminal-panel">
          <span className="font-mono text-xs text-terminal-dim">
            {this.props.label ?? 'WIDGET'} UNAVAILABLE — RETRYING
          </span>
        </div>
      );
    }
    return this.props.children;
  }
}
