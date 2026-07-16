"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  onExit: () => void;
  /** true if the player paid a coin to enter this run (arcade mode) */
  paid?: boolean;
  /** refund the coin when a paid run fails to load its chunk */
  onRefund?: () => void;
  /** re-mount the game to retry the dynamic import */
  onRetry?: () => void;
}
interface State { error: Error | null; }

function isChunkError(err: Error): boolean {
  return (
    err.name === "ChunkLoadError" ||
    /loading chunk|failed to fetch dynamically imported|importing a module script failed/i.test(err.message)
  );
}

export class GameErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  private refunded = false;

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // A failed chunk load means the game never mounted — hand the coin back.
    if (isChunkError(error) && this.props.paid && this.props.onRefund && !this.refunded) {
      this.refunded = true;
      this.props.onRefund();
    }
  }

  private retry = () => {
    this.refunded = false;
    this.setState({ error: null });
    this.props.onRetry?.();
  };

  render() {
    const { error } = this.state;
    if (error) {
      const chunk = isChunkError(error);
      return (
        <div className="min-h-dvh flex flex-col items-center justify-start pt-8 md:justify-center md:pt-0 gap-4 bg-arcade-bg px-4 text-center">
          <p className="font-pixel text-xs text-arcade-neon-red neon-text-red">
            {chunk ? "CONNECTION DROPPED" : "GAME CRASHED"}
          </p>
          <p className="font-mono text-sm text-gray-500 max-w-xs">
            {chunk
              ? this.props.paid
                ? "Couldn't load the game. Your coin was refunded."
                : "Couldn't load the game — check your connection."
              : error.message}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {chunk && (
              <button
                onClick={this.retry}
                className="min-h-[44px] py-2 px-5 font-pixel text-[9px] border border-arcade-neon-cyan text-arcade-neon-cyan hover:bg-arcade-neon-cyan hover:text-black active:scale-95 transition-all"
                style={{ touchAction: "manipulation" }}
              >
                TAP TO RETRY
              </button>
            )}
            <button
              onClick={this.props.onExit}
              className="min-h-[44px] py-2 px-5 font-pixel text-[9px] border border-arcade-border text-gray-500 hover:text-white hover:border-white active:scale-95 transition-all"
              style={{ touchAction: "manipulation" }}
            >
              BACK TO ARCADE
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
