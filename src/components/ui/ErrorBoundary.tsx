"use client";

import { Component, type ReactNode } from "react";

interface Props { children: ReactNode; onExit: () => void; }
interface State { error: Error | null; }

export class GameErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-arcade-bg px-4">
          <p className="font-pixel text-xs text-arcade-neon-red neon-text-red">GAME CRASHED</p>
          <p className="font-mono text-sm text-gray-500 max-w-xs text-center">{this.state.error.message}</p>
          <button
            onClick={this.props.onExit}
            className="py-2 px-4 font-pixel text-[9px] border border-arcade-border text-gray-500 hover:text-white hover:border-white transition-all"
          >
            BACK TO ARCADE
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
