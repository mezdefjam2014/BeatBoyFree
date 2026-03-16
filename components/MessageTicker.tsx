import React, { useState, useEffect } from 'react';

const MessageTicker = () => {
    const [message, setMessage] = useState('CONNECTING...');
    
    useEffect(() => {
        const fetchMsg = async () => {
            try {
                // LIVE URL: Removed commit hash to always point to HEAD
                // Query param ?t= ensures we bypass cache
                const url = `https://gist.githubusercontent.com/mezdefjam2014/47c0e2e79545fa12be1d57dfcca58bb9/raw/global_message.json?t=${Date.now()}`;
                
                const res = await fetch(url, { cache: 'no-store' });
                
                if (res.ok) {
                    // Get text first to safely handle JSON errors
                    const text = await res.text();
                    try {
                        const data = JSON.parse(text);
                        if (data && data.message) {
                            setMessage(data.message);
                        }
                    } catch (jsonError) {
                        // If JSON is malformed (e.g. while editing), ignore and keep old message
                        console.warn("Invalid JSON in global message:", jsonError);
                    }
                }
            } catch(e) {
                if (message === 'CONNECTING...') setMessage("OFFLINE");
            }
        };

        // Initial fetch
        fetchMsg();
        
        // Poll every 2 seconds for near-instant updates
        const int = setInterval(fetchMsg, 2000);
        return () => clearInterval(int);
    }, []);

    // Slower speed calculation: 20s minimum, plus 1.0s per character for readability
    const animDuration = Math.max(20, message.length * 1.0) + 's';

    return (
        <div className="relative group select-none mr-6 flex flex-col items-center gap-1">
            {/* Monitor Housing - Widened to w-96 (approx 384px) for better visibility */}
            <div className="w-96 h-20 bg-[#121214] rounded-lg border border-[#27272a] shadow-[0_4px_10px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden ring-1 ring-white/5">
                
                {/* Screen Bezel Reflection/Shadow */}
                <div className="absolute inset-0 shadow-[inset_0_0_15px_rgba(0,0,0,1)] z-20 pointer-events-none rounded-md" />
                
                {/* Screen Content */}
                <div className="flex-1 bg-[#050505] relative overflow-hidden flex items-center">
                    
                    {/* Scanlines Effect */}
                    <div className="absolute inset-0 z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none opacity-50" />
                    
                    {/* Glass Reflection */}
                    <div className="absolute inset-0 z-10 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

                    {/* Scrolling Text Container */}
                    <div className="flex whitespace-nowrap" style={{ animation: `ticker ${animDuration} linear infinite` }}>
                        <span className="text-white font-mono text-lg font-bold tracking-widest px-12 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
                            {message} &nbsp;&nbsp;&nbsp;&nbsp; {message} &nbsp;&nbsp;&nbsp;&nbsp; {message}
                        </span>
                        <span className="text-white font-mono text-lg font-bold tracking-widest px-12 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
                            {message} &nbsp;&nbsp;&nbsp;&nbsp; {message} &nbsp;&nbsp;&nbsp;&nbsp; {message}
                        </span>
                    </div>
                </div>

                {/* Status Bar */}
                <div className="h-4 bg-[#0a0a0a] border-t border-[#222] flex items-center justify-between px-2 z-20">
                    <div className="text-[6px] text-zinc-600 font-mono font-bold tracking-widest">NEWS FEED</div>
                    <div className="flex gap-1">
                        <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse shadow-[0_0_4px_blue]" />
                        <div className="w-1 h-1 rounded-full bg-zinc-800" />
                    </div>
                </div>
            </div>
            
            <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest drop-shadow-md">GLOBAL</div>

            <style>{`
                @keyframes ticker {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </div>
    );
}

export default MessageTicker;