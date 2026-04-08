"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  title?: string;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      
      return (
        <div className="p-8 bg-red-50/50 border border-red-100 rounded-2xl text-center space-y-4">
          <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto text-red-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="font-black text-red-900 uppercase tracking-widest text-xs">
            {this.props.title || "Experience Interrupted"}
          </h3>
          <p className="text-red-700/70 text-sm font-medium max-w-xs mx-auto">
            A small technical glitch occurred in this section. We've logged it for our engineers.
          </p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-600/20 active:scale-95 transition-all"
          >
            <RotateCcw className="w-3 h-3" /> Retry View
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
