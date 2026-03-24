import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="text-4xl mb-4">💥</div>
          <h2 className="text-xl font-semibold text-gray-200 mb-2">Something went wrong</h2>
          <p className="text-gray-400 text-sm mb-4 max-w-md">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-honey-600 text-white rounded-lg hover:bg-honey-500 transition-colors text-sm"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
