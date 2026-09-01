import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

/** Catches render errors and shows a friendly recovery screen (no stack traces). */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log for developers; never shown to the user.
    console.error('Local Reader error:', error, info);
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center dark:bg-slate-950">
        <span className="text-4xl" aria-hidden>
          😕
        </span>
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Something went wrong
          </h1>
          <p className="mt-1 max-w-sm text-sm text-slate-600 dark:text-slate-400">
            The app hit an unexpected error. Reloading usually fixes it — your saved documents are
            safe on your device.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Reload
        </button>
      </div>
    );
  }
}
