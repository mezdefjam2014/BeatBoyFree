import React, { useState, useEffect } from 'react';
import { X, Globe, RefreshCw, AlertCircle, Wifi, ArrowUpRight } from 'lucide-react';

interface GlobalMessageScreenProps {
    onClose: () => void;
}

const GlobalMessageScreen: React.FC<GlobalMessageScreenProps> = ({ onClose }) => {
    const [message, setMessage] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);

    // Function to fetch without triggering full loading state every time
    const fetchMessage = async (isInitial = false) => {
        if (isInitial) setLoading(true);
        
        try {
            // Using commit-less URL for latest version
            // Added ?t=timestamp to force bypass cache
            const url = `https://gist.githubusercontent.com/mezdefjam2014/47c0e2e79545fa12be1d57dfcca58bb9/raw/global_message.json?t=${Date.now()}`;
            const response = await fetch(url, { cache: 'no-store' });
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const text = await response.text();
            
            try {
                const data = JSON.parse(text);
                if (data && data.message) {
                    setMessage(data.message);
                    setError(false);
                }
            } catch (jsonError) {
                console.warn("Malformed JSON received");
                // Do not clear the existing message if we just fetched bad data
                if (!message && isInitial) {
                    setMessage("Error parsing message feed.");
                    setError(true);
                }
            }
        } catch (err) {
            console.error("Failed to fetch message:", err);
            // Only show error screen if we have NO message at all
            if (!message) {
                setError(true);
                setMessage("Unable to load message");
            }
        } finally {
            if (isInitial) setLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchMessage(true);
        
        // Background poll every 2 seconds
        const intervalId = setInterval(() => fetchMessage(false), 2000);
        
        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-300">
            <div className="min-h-screen w-full flex items-center justify-center p-4">
                <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-300">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-600/10 rounded-lg border border-blue-600/20">
                                <Globe className="text-blue-500" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white tracking-wide">MESSAGES</h2>
                                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                                    <span className="flex items-center gap-1">
                                        <Wifi size={10} /> Live Feed
                                    </span>
                                    <span>•</span>
                                    <span>Global Broadcast</span>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
                            title="Close"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Main Content Area */}
                    <div className="p-8 md:p-12 bg-zinc-900 flex flex-col items-center justify-center min-h-[400px]">
                        <div 
                            className="w-full max-h-[60vh] bg-[#000] text-white font-bold p-5 rounded-[10px] border border-zinc-800 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] overflow-y-auto custom-scrollbar flex flex-col justify-center items-center text-center transition-all"
                            style={{ minHeight: '200px' }}
                        >
                            {loading ? (
                                <div className="flex flex-col items-center gap-3 text-zinc-500 animate-pulse">
                                    <RefreshCw className="animate-spin" size={32} />
                                    <span className="text-sm font-mono tracking-widest uppercase">Fetching Update...</span>
                                </div>
                            ) : (
                                <div className={`text-3xl md:text-4xl leading-tight whitespace-pre-wrap break-words w-full ${error ? 'text-red-500' : 'text-white'}`}>
                                    {error && <div className="flex justify-center mb-4"><AlertCircle size={40}/></div>}
                                    {message}
                                </div>
                            )}
                        </div>

                        <div className="mt-8">
                            <a 
                                href="https://phonicore.com/" 
                                target="_blank" 
                                rel="noreferrer"
                                className="group relative inline-flex items-center gap-4 px-8 py-4 bg-zinc-950 border border-zinc-800 rounded-full overflow-hidden hover:border-blue-500 hover:shadow-[0_0_40px_rgba(59,130,246,0.2)] transition-all duration-300 active:scale-95"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                
                                <Globe size={20} className="text-blue-500 relative z-10" />
                                
                                <div className="flex flex-col relative z-10">
                                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest leading-none mb-1 group-hover:text-zinc-400">Official Site</span>
                                    <span className="text-sm font-black text-zinc-200 group-hover:text-white tracking-widest uppercase leading-none">
                                        PHONICORE.COM
                                    </span>
                                </div>
                                
                                <div className="relative z-10 bg-zinc-800 p-1.5 rounded-full group-hover:bg-blue-600 transition-colors ml-2">
                                    <ArrowUpRight size={14} className="text-zinc-400 group-hover:text-white" />
                                </div>
                            </a>
                        </div>
                    </div>
                    
                    {/* Footer Status Bar */}
                    <div className="p-3 border-t border-zinc-800 bg-zinc-950 flex justify-between items-center text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : (error ? 'bg-red-500' : 'bg-green-500 animate-pulse')}`} />
                            {loading ? 'SYNCING...' : (error ? 'CONNECTION LOST' : 'LIVE CONNECTION')}
                        </div>
                        <div>
                            AUTO-REFRESH: 2s
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalMessageScreen;