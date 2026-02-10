import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Terminal, Cpu, Shield, Zap, Activity, CheckCircle2, X } from 'lucide-react';

export interface ReasoningStep {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    timestamp: number;
}

interface LogEntry {
    text: string;
    type: 'step' | 'thought' | 'result' | 'error';
    timestamp: string;
    parsed?: React.ReactNode[];
}

interface ReasoningTerminalProps {
    projectType: string;
    streamingSteps: ReasoningStep[] | string[]; // Adapt to both array of objects or strings
    streamingThoughts: string;
    error: string | null;
    isSubmitting: boolean;
    evaluationResult?: any;
}

const ReasoningTerminal: React.FC<ReasoningTerminalProps> = ({
    projectType,
    streamingSteps,
    streamingThoughts,
    error,
    isSubmitting,
    evaluationResult
}) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [startTime] = useState(() => Date.now());
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const bottomRef = useRef<HTMLDivElement>(null);
    const processedStepsRef = useRef<number>(0);
    const processedThoughtsRef = useRef<number>(0);

    // Get current timestamp
    const getTimestamp = () => new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Keyword definitions for highlighting
    const HIGHLIGHT_KEYWORDS = useMemo(() => [
        { words: ['CoinGecko', 'Birdeye', 'DexScreener'], className: 'text-cyan-400 font-bold' },
        { words: ['[BEAR]', 'RISK', 'HIGH'], className: 'text-red-500 font-bold tracking-wider' },
        { words: ['[BULL]', 'SAFE', 'LOW'], className: 'text-green-400 font-bold tracking-wider' },
        { words: ['AI', 'GPT', 'LLM', 'Model'], className: 'text-emerald-400 font-bold' },
        { words: ['Solana', 'SOL', 'ETH', 'BTC'], className: 'text-amber-400 font-bold' },
        { words: ['Score', 'Analysis', 'Evaluation'], className: 'text-blue-400' },
        { words: ['OK', 'PASS', 'SUCCESS'], className: 'text-emerald-400' },
    ], []);

    // Parse text and return React elements with highlighted keywords
    const parseTextWithHighlights = useCallback((text: string): React.ReactNode[] => {
        // Simple word-based highlighting
        const parts: React.ReactNode[] = [];
        let remainingText = text;

        // This is a simplified parser to avoid complex regex issues
        // In a real app we might want more robust tokenization

        // Check for keywords
        let currentText = text;
        const result: React.ReactNode[] = [];

        // Check each keyword group
        // For simplicity in this fix, we just return the text wrapped if it matches exactly, 
        // or just return the text. A full parser logic was complex and buggy in previous version.
        // Let's implement a basic split by space for highlighting

        const words = text.split(' ');
        words.forEach((word, idx) => {
            let matched = false;
            let className = '';

            for (const group of HIGHLIGHT_KEYWORDS) {
                if (group.words.some(w => word.includes(w))) {
                    className = group.className;
                    matched = true;
                    break;
                }
            }

            if (matched) {
                result.push(<span key={idx} className={className}>{word} </span>);
            } else {
                result.push(<span key={idx}>{word} </span>);
            }
        });

        return result;
    }, [HIGHLIGHT_KEYWORDS]);

    // Timer
    useEffect(() => {
        const interval = setInterval(() => {
            setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    // Process Incoming Data
    useEffect(() => {
        // Handle Steps (Array of strings or objects)
        if (streamingSteps && streamingSteps.length > processedStepsRef.current) {
            const newSteps = streamingSteps.slice(processedStepsRef.current);
            const newEntries: LogEntry[] = newSteps.map(step => {
                const text = typeof step === 'string' ? step : step.title || step.description;
                return {
                    text: `[STEP] ${text}`,
                    type: 'step',
                    timestamp: getTimestamp(),
                    parsed: parseTextWithHighlights(`[STEP] ${text}`)
                };
            });
            setLogs(prev => [...prev, ...newEntries]);
            processedStepsRef.current = streamingSteps.length;
        }

        // Handle Thoughts (String buffer)
        if (streamingThoughts) {
            const allLines = streamingThoughts.split('\n');
            if (allLines.length > processedThoughtsRef.current) {
                const newLines = allLines.slice(processedThoughtsRef.current);
                const newEntries: LogEntry[] = newLines
                    .filter(line => line.trim().length > 0)
                    .map(line => ({
                        text: line,
                        type: 'thought',
                        timestamp: getTimestamp(),
                        parsed: parseTextWithHighlights(line)
                    }));

                if (newEntries.length > 0) {
                    setLogs(prev => [...prev, ...newEntries]);
                }
                processedThoughtsRef.current = allLines.length;
            }
        }
    }, [streamingSteps, streamingThoughts, parseTextWithHighlights]);

    // Error Handling
    useEffect(() => {
        if (error) {
            setLogs(prev => [...prev, {
                text: `ERROR: ${error}`,
                type: 'error',
                timestamp: getTimestamp(),
                parsed: [<span key="err" className="text-red-500 font-bold">ERROR: {error}</span>]
            }]);
        }
    }, [error]);

    // Completion
    useEffect(() => {
        if (evaluationResult && !isSubmitting) {
            setLogs(prev => [...prev, {
                text: "Evaluation Complete. Rendering Report...",
                type: 'result',
                timestamp: getTimestamp(),
                parsed: [<span key="done" className="text-green-400 font-bold">Evaluation Complete. Rendering Report...</span>]
            }]);
        }
    }, [evaluationResult, isSubmitting]);

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    return (
        <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl h-[600px] flex flex-col font-mono text-sm">
            {/* Header */}
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                    </div>
                    <div className="ml-4 flex items-center gap-2 text-slate-400 text-xs">
                        <Terminal size={12} />
                        <span>PREDIKT_EVAL_CORE_V1.0</span>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400">
                        <Activity size={12} className={isSubmitting ? "text-green-400 animate-pulse" : ""} />
                        <span>{isSubmitting ? "ANALYZING" : "IDLE"}</span>
                    </div>
                    <div className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                        {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-950/50">
                {logs.length === 0 && (
                    <div className="text-slate-600 italic">Waiting for input stream...</div>
                )}

                {logs.map((log, idx) => (
                    <div key={idx} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                        <span className="text-slate-600 shrink-0 select-none">
                            [{log.timestamp}]
                        </span>
                        <div className={`break-words ${log.type === 'error' ? 'text-red-400' :
                                log.type === 'step' ? 'text-blue-300' :
                                    log.type === 'result' ? 'text-green-300' :
                                        'text-slate-300'
                            }`}>
                            {log.parsed || log.text}
                        </div>
                    </div>
                ))}

                {isSubmitting && (
                    <div className="flex gap-3 animate-pulse text-slate-500">
                        <span className="text-slate-600 shrink-0 select-none">
                            [{getTimestamp()}]
                        </span>
                        <span className="after:content-['_'] after:animate-pulse">Processing...</span>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Footer Status */}
            <div className="bg-slate-900/50 border-t border-slate-800 px-4 py-2 text-xs flex justify-between text-slate-500">
                <div>Target: {projectType.toUpperCase()}</div>
                <div>Mem: 24MB / Threads: 8</div>
            </div>
        </div>
    );
};

export default ReasoningTerminal;
