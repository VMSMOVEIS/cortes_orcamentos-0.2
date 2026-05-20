import React, { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary class component to catch rendering errors in the component tree.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full text-center border-t-4 border-red-500">
             <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                 <AlertTriangle size={32} className="text-red-600" />
             </div>
             <h2 className="text-2xl font-bold text-slate-800 mb-2">Algo deu errado!</h2>
             <p className="text-slate-500 mb-6">
                 Ocorreu um erro ao processar o layout. Isso geralmente acontece com dados inválidos ou atualizações rápidas.
             </p>
             
             {this.state.error && (
                 <div className="bg-slate-100 p-3 rounded text-left text-xs font-mono text-red-600 mb-6 overflow-auto max-h-32 border border-slate-200">
                     {this.state.error.toString()}
                 </div>
             )}

             <button 
                onClick={this.handleReset}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
                <RefreshCcw size={18} /> Recarregar Aplicação
             </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}