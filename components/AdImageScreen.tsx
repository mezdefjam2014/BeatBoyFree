import React from 'react';
import { X, ExternalLink, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { AdData } from '../types';

interface AdImageScreenProps {
    onClose: () => void;
    data: AdData | null;
}

const AdImageScreen: React.FC<AdImageScreenProps> = ({ onClose, data }) => {
    
    return (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-300">
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950/50">
                    <h2 className="text-sm font-black text-white tracking-widest uppercase flex items-center gap-2">
                        <ImageIcon size={14} className="text-[var(--accent)]"/> SPONSORED
                    </h2>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-white/10 rounded-full text-zinc-500 hover:text-white transition-colors"
                        title="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Main Content */}
                <div className="p-8 flex flex-col items-center justify-center min-h-[350px]">
                    {!data ? (
                        <div className="text-center text-red-500 flex flex-col items-center gap-3 animate-in fade-in">
                             <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20">
                                <AlertCircle size={32} />
                             </div>
                             <span className="font-bold text-sm">Ad failed to load.</span>
                        </div>
                    ) : (
                        <div className="w-full flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500">
                            
                            {/* Title: Displayed above image as requested */}
                            <h3 className="text-2xl font-black text-center text-white leading-none tracking-tight">
                                {data.ad_title}
                            </h3>

                            {/* Image Container: 1:1 Aspect Ratio, Radius 12px */}
                            <div 
                                className={`relative w-full shadow-2xl border border-zinc-700 overflow-hidden group ${data.ad_link ? 'cursor-pointer hover:border-[var(--accent)] transition-colors' : ''}`}
                                style={{ 
                                    aspectRatio: '1 / 1', 
                                    borderRadius: '12px' 
                                }}
                                onClick={() => data.ad_link && window.open(data.ad_link, '_blank')}
                            >
                                <img 
                                    src={data.ad_image} 
                                    alt={data.ad_title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    style={{ objectFit: 'cover' }}
                                />
                                
                                {/* Hover Overlay if clickable */}
                                {data.ad_link && (
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                        <div className="bg-white text-black px-6 py-3 rounded-full font-black text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)] transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                            TAP TO LEARN MORE <ExternalLink size={12} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Footer / Status */}
                <div className="bg-zinc-950 p-3 border-t border-zinc-800 flex justify-between items-center text-[9px] text-zinc-600 font-mono uppercase tracking-widest">
                    <span>Ads by Phonicore</span>
                    <span>Live Connection</span>
                </div>
            </div>
        </div>
    );
};

export default AdImageScreen;