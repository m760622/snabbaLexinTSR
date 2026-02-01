import React, { useState, useRef, useEffect } from 'react';
import { SparklesIcon, XMarkIcon, PaperAirplaneIcon, BookOpenIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { generateAgentResponse, SearchResult } from '../utils/agentUtils';

interface LanguageAgentProps {
    className?: string;
}

export const LanguageAgent: React.FC<LanguageAgentProps> = ({ className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState<{ message: string; sources: SearchResult[] } | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSearch = async (e?: React.FormEvent, manualQuery?: string, forceAI = false) => {
        e?.preventDefault();
        const effectiveQuery = manualQuery || query;
        if (!effectiveQuery.trim()) return;

        if (manualQuery) setQuery(manualQuery);

        setIsTyping(true);
        setResponse(null);

        // Await the response (async enables AI fallback)
        try {
            const result = await generateAgentResponse(effectiveQuery, forceAI);
            setResponse(result);
        } catch (error) {
            console.error('Search error:', error);
            setResponse({
                message: "Ett fel uppstod vid sökningen. / حدث خطأ أثناء البحث.",
                sources: []
            });
        } finally {
            setIsTyping(false);
        }
    };

    const toggleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setResponse(null);
            setQuery('');
        }
    };

    return (
        <div className={`fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans ${className}`}>

            {/* Backdrop Overlay */}
            <div
                className={`
                    fixed inset-0 bg-black/60 backdrop-blur-[5px] z-40 transition-opacity duration-300
                    ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
                `}
                onClick={toggleOpen}
                aria-hidden="true"
            />

            {/* Main Chat Interface */}
            <div
                className={`
                    transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                    ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-10 pointer-events-none'}
                    fixed left-1/2 -translate-x-1/2 bottom-24
                    w-[calc(100vw-32px)] max-w-[360px]
                    bg-white/95 dark:bg-[#020617]/98
                    backdrop-blur-3xl
                    border-2 border-white/40 dark:border-cyan-500/40
                    shadow-2xl shadow-black/20 dark:shadow-cyan-500/20
                    rounded-3xl rounded-br-xl
                    overflow-hidden
                    flex flex-col
                    z-50
                `}
                style={{ maxHeight: 'calc(100vh - 180px)' }}
            >
                {/* Header */}
                <div className="relative bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 p-4 border-b border-white/10 dark:border-cyan-500/10 flex justify-between items-center overflow-hidden">
                    {/* Abstract Grid Background */}
                    <div className="absolute inset-0 opacity-10 dark:opacity-20 pointer-events-none"
                        style={{
                            backgroundImage: 'linear-gradient(rgba(6,182,212,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.5) 1px, transparent 1px)',
                            backgroundSize: '20px 20px'
                        }}>
                    </div>

                    <div className="flex items-center gap-3 relative z-10">
                        <div className="p-2 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/20 text-white">
                            <SparklesIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-cyan-100 text-base tracking-tight">AI Lärare</h3>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-cyan-400/80">Online</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={toggleOpen}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors relative z-10 group"
                        aria-label="Close"
                    >
                        <XMarkIcon className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white transition-colors" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[350px] bg-slate-50/50 dark:bg-[#0B1121]/50 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                    {!response && !isTyping && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 mt-8">
                            <div className="w-14 h-14 bg-gradient-to-tr from-cyan-500/10 to-blue-500/10 rounded-full flex items-center justify-center mb-2 ring-1 ring-cyan-500/20">
                                <ChatBubbleLeftRightIcon className="w-7 h-7 text-cyan-600 dark:text-cyan-400" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-slate-700 dark:text-cyan-50">Vad vill du lära dig?</p>
                                <p className="text-xs font-arabic text-slate-500 dark:text-cyan-200/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>ماذا تريد أن تتعلم اليوم؟</p>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2 max-w-[250px] mt-4">
                                {['Ordföljd', 'Tid', 'Ordspråk', 'Verb'].map((tag) => (
                                    <button
                                        key={tag}
                                        onClick={() => handleSearch(undefined, tag)}
                                        className="text-xs px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300 hover:border-cyan-500 dark:hover:border-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all hover:-translate-y-0.5"
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* User Query Bubble (Echo) */}
                    {query && response && (
                        <div className="flex justify-end animate-slide-up-fade">
                            <div className="bg-cyan-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-none shadow-md shadow-cyan-900/10 max-w-[85%] text-sm">
                                {query}
                            </div>
                        </div>
                    )}

                    {isTyping && (
                        <div className="flex items-center gap-2 text-slate-400 text-xs px-2 animate-pulse">
                            <div className="flex gap-1">
                                <span className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                            <span>Tänker...</span>
                        </div>
                    )}

                    {response && (
                        <div className="space-y-4 animate-slide-up-fade">
                            {/* Agent Message */}
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none text-slate-700 dark:text-slate-200 text-sm leading-relaxed shadow-sm border border-slate-100 dark:border-slate-700">
                                {response.message.split('/').map((part, i) => (
                                    <p key={i} className={`mb-1.5 ${i === 1 ? 'text-right font-arabic text-slate-500 dark:text-slate-300 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50' : ''}`} style={i === 1 ? { fontFamily: 'Tajawal, sans-serif' } : {}}>
                                        {part.trim()}
                                    </p>
                                ))}
                            </div>

                            {/* Knowledge Sources Cards */}
                            {response.sources.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 px-1">
                                        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                            <BookOpenIcon className="w-3 h-3" />
                                            Källa / مصدر
                                        </span>
                                        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
                                    </div>

                                    {response.sources.map((source, idx) => (
                                        <div
                                            key={idx}
                                            className="
                                                group
                                                background-blur-sm
                                                bg-white/80 dark:bg-slate-800/80 
                                                hover:bg-cyan-50/50 dark:hover:bg-cyan-900/20
                                                p-3.5 
                                                rounded-xl 
                                                border border-slate-200 dark:border-slate-700 
                                                hover:border-cyan-300 dark:hover:border-cyan-500/50 
                                                transition-all duration-300
                                                hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/10 dark:hover:shadow-cyan-500/20
                                            "
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`
                                                    text-[10px] font-bold px-2 py-0.5 rounded-full border
                                                    ${source.type === 'grammar'
                                                        ? 'bg-purple-100 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800/50'
                                                        : 'bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50'}
                                                `}>
                                                    {source.type === 'grammar' ? 'GRAMMATIK' : 'ORDSPRÅK'}
                                                </span>
                                            </div>
                                            <h5 className="font-semibold text-slate-900 dark:text-white text-sm mb-1.5 leading-snug">{source.content}</h5>
                                            {source.translation && (
                                                <p className="text-sm text-slate-600 dark:text-slate-300 font-arabic mb-3 dir-rtl text-right leading-relaxed" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                                    {source.translation}
                                                </p>
                                            )}
                                            {source.example && (
                                                <div className="mt-2 p-2 bg-slate-50 dark:bg-black/20 rounded-lg border border-slate-100 dark:border-slate-800">
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                                                        <span className="not-italic mr-1">💡</span>
                                                        {source.example}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                </div>
                            )}

                            {/* Explicit AI Search Button - Always visible */}
                            <button
                                onClick={(e) => handleSearch(e, undefined, true)}
                                className="
                                        w-full mt-2 py-2.5 px-3
                                        flex items-center justify-center gap-2
                                        bg-gradient-to-r from-violet-600 to-indigo-600
                                        hover:from-violet-500 hover:to-indigo-500
                                        text-white text-xs font-semibold
                                        rounded-xl shadow-lg shadow-violet-500/20
                                        transition-all hover:scale-[1.02] active:scale-95
                                        border border-white/10
                                    "
                            >
                                <SparklesIcon className="w-4 h-4" />
                                <span>Mer / المزيد (AI)</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <form onSubmit={handleSearch} className="p-3 border-t border-white/20 dark:border-cyan-500/10 bg-white/60 dark:bg-[#020617]/80 backdrop-blur-md">
                    <div className="relative flex items-center group">
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Fråga om grammatik..."
                            className="
                                w-full pl-4 pr-12 py-3.5 
                                bg-white dark:bg-[#0B1121] 
                                border border-slate-200 dark:border-cyan-500/20
                                group-hover:border-slate-300 dark:group-hover:border-cyan-500/40
                                outline-none 
                                rounded-xl 
                                text-slate-800 dark:text-white 
                                placeholder-slate-400 
                                focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 dark:focus:border-cyan-400/60
                                transition-all duration-300
                                shadow-sm
                            "
                        />
                        <button
                            type="submit"
                            aria-label="Skicka fråga"
                            disabled={!query.trim() || isTyping}
                            className="
                                absolute right-2 
                                p-2
                                bg-gradient-to-tr from-cyan-500 to-blue-600 
                                text-white 
                                rounded-lg 
                                disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale
                                shadow-md shadow-cyan-500/20
                                hover:shadow-cyan-500/40 hover:scale-105
                                transition-all duration-200 active:scale-95
                            "
                        >
                            <PaperAirplaneIcon className="w-5 h-5 -rotate-90 translate-x-[-1px]" />
                        </button>
                    </div>
                    <div className="flex justify-center mt-2">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            Powered by SnabbaLexin AI
                        </span>
                    </div>
                </form>
            </div>

            {/* Floating Action Button (FAB) */}
            <button
                onClick={toggleOpen}
                className={`
                    group
                    relative
                    flex items-center justify-center
                    w-14 h-14
                    bg-gradient-to-tr from-cyan-400 via-cyan-500 to-blue-600
                    text-white
                    rounded-full
                    shadow-[0_8px_24px_rgba(6,182,212,0.4)]
                    hover:shadow-[0_12px_32px_rgba(6,182,212,0.6)] 
                    hover:scale-110
                    active:scale-95
                    transition-all duration-300 ease-spring
                    z-50
                `}
                aria-label="Open AI Tutor"
            >
                {/* Glow Ring */}
                <span className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping opacity-20 duration-[2000ms]"></span>

                {isOpen ? (
                    <XMarkIcon className="w-6 h-6 transform rotate-90 group-hover:rotate-0 transition-transform duration-300" />
                ) : (
                    <>
                        <SparklesIcon className="w-6 h-6 animate-pulse" />

                        {/* Status Badge */}
                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-200 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-400 border-2 border-white dark:border-slate-900"></span>
                        </span>
                    </>
                )}

                {/* Tooltip */}
                {!isOpen && (
                    <span className="
                        absolute right-full mr-4 
                        whitespace-nowrap 
                        px-3 py-1.5 
                        bg-slate-900 text-white text-xs font-semibold tracking-wide
                        rounded-lg
                        shadow-xl
                        opacity-0 group-hover:opacity-100 
                        translate-x-4 group-hover:translate-x-0
                        transition-all duration-300
                        pointer-events-none
                    ">
                        AI Lärare 🤖
                        {/* Triangle */}
                        <span className="absolute top-1/2 -right-1 -mt-1 border-4 border-transparent border-l-slate-900"></span>
                    </span>
                )}
            </button>
        </div >
    );
};
