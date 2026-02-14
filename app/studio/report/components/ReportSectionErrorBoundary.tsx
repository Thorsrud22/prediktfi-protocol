import React, { Component, ErrorInfo, ReactNode } from 'react';
import { TriangleAlert as AlertTriangle } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    sectionName?: string;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ReportSectionErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error in Report Section:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="border border-red-500/20 bg-red-900/10 p-4 rounded-xl text-center my-4">
                    <div className="flex items-center justify-center gap-2 text-red-400 mb-2">
                        <AlertTriangle size={20} />
                        <h4 className="font-bold text-sm">Review Unavailable</h4>
                    </div>
                    <p className="text-xs text-red-200/60">
                        {this.props.sectionName ? `The "${this.props.sectionName}" section` : 'This section'} could not be loaded. Data may be incomplete.
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}
