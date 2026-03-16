import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Download, Copy, FileText, Hash, Search, DollarSign, 
  PenTool, FileSignature, Receipt, Image as ImageIcon, Briefcase, 
  Check, ChevronRight, Settings, Share2, Loader2, Plus, Trash2,
  Type, Smile, Move, Wand2, MonitorPlay, Palette, Layout, MousePointer2
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ProducerToolsProps {
    onClose: () => void;
}

type ToolId = 'receipt' | 'hashtag' | 'seo' | 'price' | 'social' | 'split' | 'license' | 'invoice' | 'thumb';

// --- THUMBNAIL GENERATOR CONSTANTS ---
const PRESET_BGS = [
    'linear-gradient(to bottom right, #000000, #434343)', // Dark
    'linear-gradient(to right, #8e2de2, #4a00e0)', // Purple
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Deep Blue
    'linear-gradient(to right, #ff416c, #ff4b2b)', // Red
    'linear-gradient(to right, #00b09b, #96c93d)', // Green
    'radial-gradient(circle, #333333, #000000)', // Radial Dark
    'linear-gradient(to top, #30cfd0 0%, #330867 100%)', // Night
    'linear-gradient(to top, #fbc2eb 0%, #a6c1ee 100%)', // Pastel
    'linear-gradient(120deg, #f6d365 0%, #fda085 100%)', // Sunset
    'conic-gradient(from 180deg at 50% 50%, #2a2a2a 0deg, #111 360deg)', // Conic
];

const EMOJIS = [
    "🔥", "💯", "🎹", "💸", "🚀", "💀", "🥶", "🌊", "🌵", "🐐",
    "🔌", "🔋", "💿", "🎙️", "🎧", "🎼", "🥁", "🎸", "💰", "💎",
    "🏆", "👑", "🦍", "🐍", "🦅", "🦁", "⚡", "❄️", "⛈️", "🌙",
    "🌍", "🌟", "💫", "✨", "💥", "💣", "🩸", "💊", "🧬", "👽"
];

const TEXT_MATERIALS = [
    { id: 'normal', label: 'Normal', class: '' },
    { id: 'neon', label: 'Neon Glow', class: 'drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]' },
    { id: 'metallic', label: 'Metallic', class: 'bg-clip-text text-transparent bg-gradient-to-b from-gray-300 via-white to-gray-400' },
    { id: 'outline', label: 'Outline', class: 'stroke-black stroke-2' }, // Requires webkit-text-stroke usually
    { id: 'gold', label: 'Gold', class: 'bg-clip-text text-transparent bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700' },
];

interface ThumbElement {
    id: string;
    type: 'text' | 'image' | 'emoji';
    content: string;
    x: number; // Percent 0-100
    y: number; // Percent 0-100
    scale: number; // 0.5 - 5
    rotation: number; // degrees
    color: string;
    fontFamily: string;
    material: string; // id from TEXT_MATERIALS
    zIndex: number;
}

const ProducerTools: React.FC<ProducerToolsProps> = ({ onClose }) => {
    const [activeTool, setActiveTool] = useState<ToolId>('receipt');
    const previewRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    // --- SHARED UTILS ---
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
    };

    const downloadTxt = (filename: string, text: string) => {
        const element = document.createElement("a");
        const file = new Blob([text], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = filename;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const exportImage = async () => {
        if (!previewRef.current) return;
        setIsExporting(true);
        try {
            const canvas = await html2canvas(previewRef.current, { scale: 3, useCORS: true, backgroundColor: null });
            const link = document.createElement('a');
            link.download = `BEATBOY_EXPORT_${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch(e) { console.error(e); }
        setIsExporting(false);
    };

    const exportPDF = async () => {
        if (!previewRef.current) return;
        setIsExporting(true);
        try {
            const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            // A4 size roughly
            const pdf = new jsPDF({
                orientation: canvas.width > canvas.height ? 'l' : 'p',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`BEATBOY_DOC_${Date.now()}.pdf`);
        } catch(e) { console.error(e); }
        setIsExporting(false);
    };

    // --- TOOL: THUMBNAIL GENERATOR STATE & LOGIC ---
    const [thumbBg, setThumbBg] = useState(PRESET_BGS[0]);
    const [thumbElements, setThumbElements] = useState<ThumbElement[]>([
        { id: '1', type: 'text', content: 'TYPE BEAT', x: 50, y: 50, scale: 2, rotation: 0, color: '#ffffff', fontFamily: 'Impact, sans-serif', material: 'normal', zIndex: 1 }
    ]);
    const [selectedId, setSelectedId] = useState<string | null>('1');
    
    // Dragging Logic
    const thumbCanvasRef = useRef<HTMLDivElement>(null);
    const draggingRef = useRef<{id: string, startX: number, startY: number, initialElX: number, initialElY: number} | null>(null);

    const handleThumbPointerDown = (e: React.PointerEvent, id: string) => {
        e.stopPropagation();
        setSelectedId(id);
        const el = thumbElements.find(x => x.id === id);
        if (!el) return;
        
        // Capture element logic
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        draggingRef.current = {
            id,
            startX: e.clientX,
            startY: e.clientY,
            initialElX: el.x,
            initialElY: el.y
        };
    };

    const handleThumbPointerMove = (e: React.PointerEvent) => {
        if (!draggingRef.current || !thumbCanvasRef.current) return;
        const { id, startX, startY, initialElX, initialElY } = draggingRef.current;
        
        const rect = thumbCanvasRef.current.getBoundingClientRect();
        const deltaXPixels = e.clientX - startX;
        const deltaYPixels = e.clientY - startY;
        
        // Convert pixels to percentage
        const deltaXPercent = (deltaXPixels / rect.width) * 100;
        const deltaYPercent = (deltaYPixels / rect.height) * 100;
        
        setThumbElements(prev => prev.map(el => {
            if (el.id !== id) return el;
            return {
                ...el,
                x: initialElX + deltaXPercent,
                y: initialElY + deltaYPercent
            };
        }));
    };

    const handleThumbPointerUp = (e: React.PointerEvent) => {
        draggingRef.current = null;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };

    const addThumbElement = (type: 'text'|'emoji'|'image', content: string) => {
        const newEl: ThumbElement = {
            id: crypto.randomUUID(),
            type,
            content,
            x: 50, y: 50,
            scale: type === 'text' ? 1.5 : 1,
            rotation: 0,
            color: '#ffffff',
            fontFamily: 'sans-serif',
            material: 'normal',
            zIndex: thumbElements.length + 1
        };
        setThumbElements([...thumbElements, newEl]);
        setSelectedId(newEl.id);
    };

    const handleThumbUpload = (e: React.ChangeEvent<HTMLInputElement>, isBg: boolean) => {
        if (e.target.files?.[0]) {
            const url = URL.createObjectURL(e.target.files[0]);
            if (isBg) {
                setThumbBg(`url(${url})`);
            } else {
                addThumbElement('image', url);
            }
        }
    };

    const autoDesignThumb = () => {
        // "Look At" button logic: Smart Arrange
        const textEls = thumbElements.filter(e => e.type === 'text');
        const imgEls = thumbElements.filter(e => e.type !== 'text');
        
        let newElements = [...thumbElements];
        
        if (textEls.length > 0) {
            // Main title big and centered
            const main = textEls.reduce((prev, curr) => prev.content.length > curr.content.length ? prev : curr);
            newElements = newElements.map(e => e.id === main.id ? {
                ...e, x: 50, y: 50, scale: 3, material: 'metallic', fontFamily: 'Impact, sans-serif'
            } : e);
            
            // Other texts smaller at top or bottom
            const others = textEls.filter(e => e.id !== main.id);
            others.forEach((e, i) => {
                newElements = newElements.map(el => el.id === e.id ? {
                    ...el, x: 50, y: 80 + (i * 10), scale: 1, material: 'neon'
                } : el);
            });
        }
        
        // Logos in corners
        imgEls.forEach((e, i) => {
             newElements = newElements.map(el => el.id === e.id ? {
                 ...el, x: 10 + (i*10), y: 10, scale: 0.8
             } : el);
        });

        setThumbElements(newElements);
    };

    const exportThumb1080p = async () => {
        if (!thumbCanvasRef.current) return;
        setIsExporting(true);
        try {
            // Create a temp container at 1920x1080
            const canvas = await html2canvas(thumbCanvasRef.current, {
                scale: 1920 / thumbCanvasRef.current.clientWidth, // Scale to 1920 width
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                onclone: (clonedDoc) => {
                    // Fix for bg-clip-text not rendering in html2canvas
                    // We find elements with gradient text classes and convert them to solid color fallbacks
                    const elements = clonedDoc.querySelectorAll('.bg-clip-text');
                    elements.forEach((el) => {
                        const htmlEl = el as HTMLElement;
                        htmlEl.style.background = 'none';
                        htmlEl.style.webkitBackgroundClip = 'initial';
                        htmlEl.style.backgroundClip = 'initial';
                        
                        // Check if it's metallic or gold based on class name
                        if (htmlEl.classList.contains('from-gray-300')) {
                             htmlEl.style.color = '#c0c0c0'; // Silver fallback
                             htmlEl.style.textShadow = '1px 1px 0px #fff, -1px -1px 0px #555'; // Fake bevel
                        } else if (htmlEl.classList.contains('from-yellow-300')) {
                             htmlEl.style.color = '#fbbf24'; // Gold fallback
                             htmlEl.style.textShadow = '1px 1px 0px #fff, -1px -1px 0px #b45309'; // Fake bevel
                        }
                    });
                }
            });
            const link = document.createElement('a');
            link.download = `THUMBNAIL_1080P_${Date.now()}.jpg`;
            link.href = canvas.toDataURL('image/jpeg', 0.9);
            link.click();
        } catch(e) { console.error(e); }
        setIsExporting(false);
    };

    const renderThumbnailTool = () => {
        const selectedEl = thumbElements.find(e => e.id === selectedId);

        return (
            <div className="flex gap-4 h-full relative">
                {/* LEFT SIDEBAR: ASSETS */}
                <div className="w-64 flex flex-col gap-4 overflow-y-auto pr-2 pb-20 custom-scrollbar">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Background</label>
                        <div className="grid grid-cols-5 gap-1">
                            {PRESET_BGS.map((bg, i) => (
                                <button key={i} onClick={() => setThumbBg(bg)} className="w-full h-8 rounded border border-white/10 hover:border-white" style={{ background: bg }} />
                            ))}
                        </div>
                        <label className="flex items-center justify-center gap-2 w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs cursor-pointer hover:bg-zinc-800">
                            <ImageIcon size={12} /> Upload BG
                            <input type="file" className="hidden" accept="image/*" onChange={e => handleThumbUpload(e, true)} />
                        </label>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Add Elements</label>
                        <button onClick={() => addThumbElement('text', 'NEW TEXT')} className="flex items-center gap-2 w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs hover:bg-zinc-800">
                            <Type size={12} /> Add Text
                        </button>
                        <label className="flex items-center gap-2 w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs cursor-pointer hover:bg-zinc-800">
                            <Plus size={12} /> Add Logo / Image
                            <input type="file" className="hidden" accept="image/png,image/jpeg" onChange={e => handleThumbUpload(e, false)} />
                        </label>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Emojis</label>
                        <div className="grid grid-cols-6 gap-1 h-32 overflow-y-auto custom-scrollbar bg-zinc-900 p-1 rounded">
                            {EMOJIS.map(em => (
                                <button key={em} onClick={() => addThumbElement('emoji', em)} className="text-lg hover:bg-white/10 rounded">{em}</button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                        <button onClick={autoDesignThumb} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 shadow-lg animate-pulse">
                            <Wand2 size={14} /> LOOK AT (AUTO-DESIGN)
                        </button>
                    </div>
                </div>

                {/* CENTER: CANVAS */}
                <div className="flex-1 bg-[#09090b] flex items-center justify-center p-4 relative overflow-hidden rounded-xl border border-zinc-800 shadow-inner">
                    <div 
                        ref={thumbCanvasRef}
                        className="relative w-full aspect-video bg-black shadow-2xl overflow-hidden group select-none"
                        style={{ background: thumbBg, backgroundSize: 'cover', backgroundPosition: 'center' }}
                        onPointerMove={handleThumbPointerMove}
                        onPointerUp={handleThumbPointerUp}
                        onPointerLeave={handleThumbPointerUp}
                    >
                        {thumbElements.map(el => (
                            <div
                                key={el.id}
                                onPointerDown={(e) => handleThumbPointerDown(e, el.id)}
                                className={`absolute cursor-move hover:ring-1 hover:ring-white/50 ${selectedId === el.id ? 'ring-2 ring-[var(--accent)] z-50' : ''}`}
                                style={{
                                    left: `${el.x}%`,
                                    top: `${el.y}%`,
                                    transform: `translate(-50%, -50%) scale(${el.scale}) rotate(${el.rotation}deg)`,
                                    zIndex: el.zIndex,
                                    color: el.color,
                                    fontFamily: el.fontFamily,
                                }}
                            >
                                {el.type === 'image' ? (
                                    <img src={el.content} className="max-w-[150px] pointer-events-none" alt="asset" />
                                ) : (
                                    <span className={`whitespace-nowrap font-bold text-4xl pointer-events-none ${TEXT_MATERIALS.find(m => m.id === el.material)?.class || ''}`}>
                                        {el.content}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                    {/* Resolution Badge */}
                    <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-[9px] text-zinc-500 font-mono">1080p CANVAS</div>
                </div>

                {/* RIGHT SIDEBAR: PROPERTIES */}
                <div className="w-60 flex flex-col gap-4 overflow-y-auto pl-2 pb-20 custom-scrollbar border-l border-white/5">
                    {selectedEl ? (
                        <>
                            <div className="flex justify-between items-center">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase">Properties</h3>
                                <button onClick={() => setThumbElements(prev => prev.filter(e => e.id !== selectedId))} className="text-red-500 hover:text-red-400"><Trash2 size={14}/></button>
                            </div>
                            
                            {selectedEl.type === 'text' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] text-zinc-500">Content</label>
                                    <input 
                                        value={selectedEl.content} 
                                        onChange={e => setThumbElements(prev => prev.map(el => el.id === selectedEl.id ? {...el, content: e.target.value} : el))}
                                        className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs"
                                    />
                                    <label className="text-[10px] text-zinc-500">Color</label>
                                    <div className="flex gap-2">
                                        <input type="color" value={selectedEl.color} onChange={e => setThumbElements(prev => prev.map(el => el.id === selectedEl.id ? {...el, color: e.target.value} : el))} className="w-8 h-8 rounded cursor-pointer bg-transparent border-0" />
                                        <input value={selectedEl.color} onChange={e => setThumbElements(prev => prev.map(el => el.id === selectedEl.id ? {...el, color: e.target.value} : el))} className="flex-1 bg-zinc-900 border border-zinc-800 p-1 rounded text-xs" />
                                    </div>
                                    <label className="text-[10px] text-zinc-500">Material</label>
                                    <select 
                                        value={selectedEl.material}
                                        onChange={e => setThumbElements(prev => prev.map(el => el.id === selectedEl.id ? {...el, material: e.target.value} : el))}
                                        className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs"
                                    >
                                        {TEXT_MATERIALS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                                    </select>
                                    <label className="text-[10px] text-zinc-500">Font</label>
                                    <select 
                                        value={selectedEl.fontFamily}
                                        onChange={e => setThumbElements(prev => prev.map(el => el.id === selectedEl.id ? {...el, fontFamily: e.target.value} : el))}
                                        className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs"
                                    >
                                        <option value="sans-serif">Sans Serif</option>
                                        <option value="serif">Serif</option>
                                        <option value="monospace">Monospace</option>
                                        <option value="Impact, sans-serif">Impact</option>
                                        <option value="Arial Black, sans-serif">Bold</option>
                                    </select>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] text-zinc-500">Scale ({selectedEl.scale.toFixed(1)})</label>
                                <input type="range" min="0.1" max="5" step="0.1" value={selectedEl.scale} onChange={e => setThumbElements(prev => prev.map(el => el.id === selectedEl.id ? {...el, scale: parseFloat(e.target.value)} : el))} className="w-full" />
                                
                                <label className="text-[10px] text-zinc-500">Rotation ({selectedEl.rotation}°)</label>
                                <input type="range" min="0" max="360" step="1" value={selectedEl.rotation} onChange={e => setThumbElements(prev => prev.map(el => el.id === selectedEl.id ? {...el, rotation: parseInt(e.target.value)} : el))} className="w-full" />
                            </div>
                        </>
                    ) : (
                        <div className="text-zinc-600 text-xs text-center mt-10">Select an element to edit</div>
                    )}
                    
                    <div className="mt-auto pt-4">
                        <button onClick={exportThumb1080p} disabled={isExporting} className="w-full bg-green-500 hover:bg-green-600 text-black py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-lg">
                            {isExporting ? <Loader2 className="animate-spin" size={14}/> : <Download size={14} />} DOWNLOAD 1080P JPG
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // --- TOOL: RECEIPT MAKER ---
    const [receiptData, setReceiptData] = useState({
        producer: '', client: '', title: '', type: 'Exclusive Rights', amount: '$500.00', date: new Date().toLocaleDateString(), signature: '', logo: null as string | null
    });
    
    const renderReceipt = () => (
        <div className="flex gap-8 h-full">
            <div className="w-80 space-y-4 overflow-y-auto pr-2 pb-20">
                <h3 className="text-xs font-bold text-zinc-500 uppercase">Details</h3>
                <input type="text" placeholder="Producer Name" className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs" value={receiptData.producer} onChange={e => setReceiptData({...receiptData, producer: e.target.value})} />
                <input type="text" placeholder="Client Name" className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs" value={receiptData.client} onChange={e => setReceiptData({...receiptData, client: e.target.value})} />
                <input type="text" placeholder="Beat Title" className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs" value={receiptData.title} onChange={e => setReceiptData({...receiptData, title: e.target.value})} />
                <select className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs" value={receiptData.type} onChange={e => setReceiptData({...receiptData, type: e.target.value})}>
                    <option>MP3 Lease</option><option>WAV Lease</option><option>Trackout Lease</option><option>Unlimited Lease</option><option>Exclusive Rights</option>
                </select>
                <input type="text" placeholder="Amount ($)" className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs" value={receiptData.amount} onChange={e => setReceiptData({...receiptData, amount: e.target.value})} />
                <input type="text" placeholder="Signature Text" className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs" value={receiptData.signature} onChange={e => setReceiptData({...receiptData, signature: e.target.value})} />
                <label className="flex items-center gap-2 text-xs bg-zinc-900 p-2 rounded cursor-pointer border border-zinc-800 hover:bg-zinc-800">
                    <ImageIcon size={14} /> Upload Logo
                    <input type="file" className="hidden" accept="image/*" onChange={e => {
                        if(e.target.files?.[0]) {
                            const url = URL.createObjectURL(e.target.files[0]);
                            setReceiptData({...receiptData, logo: url});
                        }
                    }} />
                </label>
            </div>
            <div className="flex-1 bg-zinc-900 rounded-xl flex items-center justify-center p-8 overflow-y-auto">
                 <div ref={previewRef} className="bg-white text-black p-8 w-[400px] shadow-2xl relative font-mono text-sm">
                    {receiptData.logo && <img src={receiptData.logo} className="h-12 mb-4 mx-auto" />}
                    <div className="text-center border-b-2 border-black pb-4 mb-4">
                        <h2 className="text-2xl font-black uppercase tracking-tighter">{receiptData.producer || 'PRODUCER'}</h2>
                        <p className="text-[10px] uppercase tracking-widest">Official Transaction Receipt</p>
                    </div>
                    <div className="space-y-2 mb-8">
                        <div className="flex justify-between"><span>DATE:</span><span>{receiptData.date}</span></div>
                        <div className="flex justify-between"><span>ORDER #:</span><span>{Math.floor(Math.random()*100000)}</span></div>
                    </div>
                    <div className="space-y-4 mb-8">
                        <div>
                            <span className="text-[10px] text-gray-500">SOLD TO:</span>
                            <div className="font-bold uppercase">{receiptData.client || 'CLIENT NAME'}</div>
                        </div>
                        <div>
                            <span className="text-[10px] text-gray-500">ITEM:</span>
                            <div className="font-bold uppercase">{receiptData.title || 'UNTITLED BEAT'}</div>
                            <div className="text-xs">{receiptData.type}</div>
                        </div>
                    </div>
                    <div className="flex justify-between text-xl font-bold border-t-2 border-black pt-4 mb-12">
                        <span>TOTAL</span>
                        <span>{receiptData.amount}</span>
                    </div>
                    <div className="text-center">
                        <div className="font-cursive text-2xl mb-1">{receiptData.signature || receiptData.producer}</div>
                        <div className="border-t border-black w-32 mx-auto pt-1 text-[10px]">AUTHORIZED SIGNATURE</div>
                    </div>
                 </div>
            </div>
        </div>
    );

    // --- TOOL: HASHTAG GENERATOR ---
    const [hashInput, setHashInput] = useState('');
    const [generatedTags, setGeneratedTags] = useState('');
    const generateHashtags = () => {
        const baseTags = ['#producer', '#beatmaker', '#flstudio', '#typebeat', '#musicproducer', '#beats', '#instrumental'];
        const genreTags: Record<string, string[]> = {
            'trap': ['#trapbeat', '#trapmusic', '#808', '#hiphopbeat'],
            'lofi': ['#lofi', '#lofihiphop', '#chill', '#studybeats'],
            'drill': ['#drillbeat', '#ukdrill', '#nydrill', '#hardbeats'],
            'r&b': ['#rnbbeat', '#smooth', '#soul', '#rnb']
        };
        let pool = [...baseTags];
        const lowerInput = hashInput.toLowerCase();
        Object.keys(genreTags).forEach(k => {
            if (lowerInput.includes(k)) pool = [...pool, ...genreTags[k]];
        });
        
        // Add random filler
        const extras = ['#newmusic', '#upcomingartist', '#studio', '#beatstars', '#sellingbeats', '#rapper', '#artist'];
        pool = [...pool, ...extras];
        
        // Shuffle and pick 25
        const shuffled = pool.sort(() => 0.5 - Math.random()).slice(0, 25);
        setGeneratedTags(shuffled.join(' '));
    };

    const renderHashtags = () => (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500">Describe Your Vibe / Genre</label>
                <input value={hashInput} onChange={e=>setHashInput(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-sm" placeholder="e.g. Dark Trap, Drake Type Beat, Emotional" />
                <button onClick={generateHashtags} className="bg-[var(--accent)] text-black px-6 py-2 rounded-lg text-xs font-bold hover:opacity-90">GENERATE TAGS</button>
            </div>
            {generatedTags && (
                <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 relative group">
                    <p className="text-zinc-300 text-sm leading-relaxed font-mono">{generatedTags}</p>
                    <div className="absolute top-2 right-2 flex gap-2">
                        <button onClick={() => copyToClipboard(generatedTags)} className="p-2 bg-black rounded hover:text-white text-zinc-500"><Copy size={14} /></button>
                        <button onClick={() => downloadTxt('hashtags.txt', generatedTags)} className="p-2 bg-black rounded hover:text-white text-zinc-500"><Download size={14} /></button>
                    </div>
                </div>
            )}
        </div>
    );

    // --- TOOL: YOUTUBE SEO ---
    const [seoData, setSeoData] = useState({ topic: '', artist: '', genre: '' });
    const [seoOutput, setSeoOutput] = useState<{titles: string[], tags: string, desc: string} | null>(null);
    
    const generateSEO = () => {
        const t = seoData.topic || 'Type Beat';
        const a = seoData.artist || 'Unknown Artist';
        const titles = [
            `FREE ${a} Type Beat - "${t}" | ${seoData.genre} Instrumental 2024`,
            `"${t}" - ${a} Style Instrumental | Hard ${seoData.genre} Beat`,
            `[FREE] ${a} x ${seoData.genre} Type Beat - ${t}`,
            `HARD ${seoData.genre} Beat 2024 - "${t}" (${a} Type Beat)`,
            `${seoData.genre} Instrumental - "${t}" | Inspired by ${a}`
        ];
        const tags = `${a} type beat, ${seoData.genre} beat, free beat, instrumental 2024, ${t}, ${a} style instrumental, hard beats, beatstars, new music, producer`;
        const desc = `
🎹 Buy 1 Get 1 FREE: https://[YOUR-STORE-LINK]
➕ Subscribe for more beats: https://youtube.com/[YOUR-CHANNEL]

Title: ${t}
BPM: [BPM]
Key: [KEY]

In the style of ${a}, this ${seoData.genre} instrumental brings a unique vibe...

Socials:
IG: @[YOUR-IG]
Twitter: @[YOUR-TWITTER]

#${a.replace(/\s/g,'')} #TypeBeat #${seoData.genre}
        `.trim();
        setSeoOutput({ titles, tags, desc });
    };

    const renderSEO = () => (
        <div className="flex gap-8 h-full">
            <div className="w-80 space-y-4">
                 <h3 className="text-xs font-bold text-zinc-500 uppercase">Video Details</h3>
                 <input placeholder="Track Title / Topic" className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs" onChange={e=>setSeoData({...seoData, topic: e.target.value})} />
                 <input placeholder="Artist Influence" className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs" onChange={e=>setSeoData({...seoData, artist: e.target.value})} />
                 <input placeholder="Genre" className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs" onChange={e=>setSeoData({...seoData, genre: e.target.value})} />
                 <button onClick={generateSEO} className="w-full bg-[var(--accent)] text-black py-3 rounded-lg text-xs font-bold">GENERATE SEO</button>
            </div>
            <div className="flex-1 space-y-6 overflow-y-auto pr-2 pb-20">
                {seoOutput ? (
                    <>
                        <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                            <h4 className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Optimized Titles</h4>
                            <ul className="space-y-2">
                                {seoOutput.titles.map((t,i) => (
                                    <li key={i} className="flex justify-between items-center text-sm bg-black/40 p-2 rounded">
                                        <span className="truncate mr-2">{t}</span>
                                        <button onClick={()=>copyToClipboard(t)}><Copy size={12} className="text-zinc-500 hover:text-white"/></button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                         <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                            <div className="flex justify-between mb-2">
                                <h4 className="text-[10px] font-bold text-zinc-500 uppercase">Tags</h4>
                                <button onClick={()=>copyToClipboard(seoOutput.tags)}><Copy size={12} className="text-zinc-500 hover:text-white"/></button>
                            </div>
                            <p className="text-xs text-zinc-400 font-mono bg-black/40 p-2 rounded">{seoOutput.tags}</p>
                        </div>
                         <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                            <div className="flex justify-between mb-2">
                                <h4 className="text-[10px] font-bold text-zinc-500 uppercase">Description</h4>
                                <button onClick={()=>copyToClipboard(seoOutput.desc)}><Copy size={12} className="text-zinc-500 hover:text-white"/></button>
                            </div>
                            <pre className="text-xs text-zinc-400 font-mono bg-black/40 p-2 rounded whitespace-pre-wrap">{seoOutput.desc}</pre>
                        </div>
                    </>
                ) : (
                    <div className="h-full flex items-center justify-center text-zinc-600 text-sm">Enter details to generate SEO metadata</div>
                )}
            </div>
        </div>
    );

    // --- TOOL: PRICE CHART ---
    const [prices, setPrices] = useState([
        { service: 'MP3 Lease', price: '$29.99', features: 'MP3 File, Non-Exclusive' },
        { service: 'WAV Lease', price: '$49.99', features: 'WAV File, High Quality' },
        { service: 'Trackout', price: '$99.99', features: 'WAV + Stems, Mix Freedom' },
        { service: 'Exclusive', price: '$499.99', features: 'Full Ownership, Unlimited' },
    ]);
    const [priceTheme, setPriceTheme] = useState('dark');

    const renderPriceChart = () => (
         <div className="flex gap-8 h-full">
             <div className="w-72 space-y-4">
                 <h3 className="text-xs font-bold text-zinc-500 uppercase">Services</h3>
                 {prices.map((p, i) => (
                     <div key={i} className="bg-zinc-900 p-2 rounded border border-zinc-800 space-y-2">
                         <input className="w-full bg-black border border-zinc-800 p-1 rounded text-xs" value={p.service} onChange={e => {const n=[...prices]; n[i].service=e.target.value; setPrices(n)}} />
                         <input className="w-full bg-black border border-zinc-800 p-1 rounded text-xs" value={p.price} onChange={e => {const n=[...prices]; n[i].price=e.target.value; setPrices(n)}} />
                         <input className="w-full bg-black border border-zinc-800 p-1 rounded text-xs" value={p.features} onChange={e => {const n=[...prices]; n[i].features=e.target.value; setPrices(n)}} />
                     </div>
                 ))}
                 <div className="flex gap-2">
                    <button onClick={() => setPriceTheme('dark')} className={`flex-1 py-2 text-xs border rounded ${priceTheme==='dark' ? 'bg-zinc-800 border-white' : 'border-zinc-800'}`}>Dark</button>
                    <button onClick={() => setPriceTheme('light')} className={`flex-1 py-2 text-xs border rounded ${priceTheme==='light' ? 'bg-zinc-200 text-black border-black' : 'border-zinc-800'}`}>Light</button>
                 </div>
             </div>
             <div className="flex-1 bg-zinc-900 rounded-xl flex items-center justify-center p-8 overflow-y-auto">
                 <div ref={previewRef} className={`p-12 w-[500px] shadow-2xl ${priceTheme === 'light' ? 'bg-white text-black' : 'bg-[#09090b] text-white border border-zinc-800'}`}>
                     <div className="text-center mb-12">
                         <h2 className="text-3xl font-black tracking-tighter mb-2">PRICING MENU</h2>
                         <div className={`w-12 h-1 mx-auto ${priceTheme==='light' ? 'bg-black' : 'bg-white'}`} />
                     </div>
                     <div className="space-y-6">
                         {prices.map((p, i) => (
                             <div key={i} className={`flex justify-between items-center p-4 border-b ${priceTheme==='light' ? 'border-gray-200' : 'border-zinc-800'}`}>
                                 <div>
                                     <h3 className="font-bold text-lg uppercase">{p.service}</h3>
                                     <p className={`text-xs ${priceTheme==='light' ? 'text-gray-500' : 'text-zinc-500'}`}>{p.features}</p>
                                 </div>
                                 <div className="text-2xl font-black">{p.price}</div>
                             </div>
                         ))}
                     </div>
                     <div className="mt-12 text-center text-[10px] uppercase tracking-widest opacity-50">
                         Serious Inquiries Only
                     </div>
                 </div>
             </div>
         </div>
    );

    // --- TOOL: SOCIAL CAPTIONS ---
    const renderCaptions = () => (
        <div className="max-w-2xl mx-auto space-y-6">
            <h3 className="text-xs font-bold text-zinc-500 uppercase">Caption Templates</h3>
            <div className="grid grid-cols-1 gap-4">
                {[
                    "Cooked up this heat today 🔥 What y'all think? #producer #beats",
                    "Just dropped a new pack! Link in bio 🎹 #typebeat #flstudio",
                    "Who needs beats? Send me a DM, let's work 📩 #artist #rapper",
                    "Late night studio sessions are the best sessions 🌑 #grind #music",
                    "Tag an artist who would kill this beat! 👇 #hiphop #trap"
                ].map((cap, i) => (
                    <div key={i} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex justify-between items-center group">
                        <p className="text-sm text-zinc-300 italic">"{cap}"</p>
                        <button onClick={() => copyToClipboard(cap)} className="opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-white"><Copy size={16} /></button>
                    </div>
                ))}
            </div>
        </div>
    );

    // --- TOOL: SPLIT SHEET ---
    const [splitData, setSplitData] = useState({ track: '', date: '', parties: [{name: '', role: 'Producer', share: '50%'}] });
    const addParty = () => setSplitData({...splitData, parties: [...splitData.parties, {name: '', role: 'Writer', share: '0%'}]});
    
    const renderSplitSheet = () => (
        <div className="flex gap-8 h-full">
            <div className="w-80 space-y-4">
                <input placeholder="Track Title" className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs" onChange={e => setSplitData({...splitData, track: e.target.value})} />
                <input type="date" className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs" onChange={e => setSplitData({...splitData, date: e.target.value})} />
                <hr className="border-zinc-800"/>
                {splitData.parties.map((p, i) => (
                    <div key={i} className="space-y-2 bg-zinc-900 p-2 rounded">
                        <input placeholder="Name" className="w-full bg-black border border-zinc-800 p-1 rounded text-xs" value={p.name} onChange={e => {const n=[...splitData.parties]; n[i].name=e.target.value; setSplitData({...splitData, parties: n})}} />
                        <div className="flex gap-2">
                             <input placeholder="Role" className="w-full bg-black border border-zinc-800 p-1 rounded text-xs" value={p.role} onChange={e => {const n=[...splitData.parties]; n[i].role=e.target.value; setSplitData({...splitData, parties: n})}} />
                             <input placeholder="%" className="w-16 bg-black border border-zinc-800 p-1 rounded text-xs" value={p.share} onChange={e => {const n=[...splitData.parties]; n[i].share=e.target.value; setSplitData({...splitData, parties: n})}} />
                        </div>
                    </div>
                ))}
                <button onClick={addParty} className="w-full border border-dashed border-zinc-700 text-zinc-500 py-2 rounded text-xs hover:text-white hover:border-white">+ Add Person</button>
            </div>
            <div className="flex-1 bg-zinc-900 rounded-xl flex items-center justify-center p-8 overflow-y-auto">
                 <div ref={previewRef} className="bg-white text-black p-12 w-[600px] shadow-2xl font-serif">
                     <h1 className="text-3xl font-bold text-center mb-8 uppercase border-b-2 border-black pb-4">Split Sheet Agreement</h1>
                     <div className="mb-8">
                         <p><strong>Track Title:</strong> {splitData.track}</p>
                         <p><strong>Date:</strong> {splitData.date}</p>
                     </div>
                     <table className="w-full text-left mb-12 border-collapse">
                         <thead>
                             <tr className="border-b border-black">
                                 <th className="py-2">Legal Name</th>
                                 <th className="py-2">Role</th>
                                 <th className="py-2 text-right">Ownership</th>
                             </tr>
                         </thead>
                         <tbody>
                             {splitData.parties.map((p, i) => (
                                 <tr key={i} className="border-b border-gray-300">
                                     <td className="py-4">{p.name || '___________'}</td>
                                     <td className="py-4">{p.role}</td>
                                     <td className="py-4 text-right">{p.share}</td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                     <div className="mt-20 grid grid-cols-2 gap-12">
                         {splitData.parties.map((p, i) => (
                             <div key={i} className="border-t border-black pt-2">
                                 <p className="text-xs uppercase">Sign: {p.name}</p>
                             </div>
                         ))}
                     </div>
                 </div>
            </div>
        </div>
    );

    // --- TOOL: LICENSE GENERATOR ---
    const [licenseData, setLicenseData] = useState({
        producer: '', client: '', track: '', type: 'Exclusive Rights', price: '$500', royalties: '50%', date: new Date().toLocaleDateString()
    });

    const renderLicenseGenerator = () => (
        <div className="flex gap-8 h-full">
            <div className="w-80 space-y-4 overflow-y-auto pr-2 pb-20">
                <h3 className="text-xs font-bold text-zinc-500 uppercase">License Details</h3>
                <input placeholder="Track Title" className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs" value={licenseData.track} onChange={e => setLicenseData({...licenseData, track: e.target.value})} />
                <input placeholder="Producer Legal Name" className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs" value={licenseData.producer} onChange={e => setLicenseData({...licenseData, producer: e.target.value})} />
                <input placeholder="Client Legal Name" className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs" value={licenseData.client} onChange={e => setLicenseData({...licenseData, client: e.target.value})} />
                <select className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs" value={licenseData.type} onChange={e => setLicenseData({...licenseData, type: e.target.value})}>
                    <option>Non-Exclusive Lease</option>
                    <option>Premium Lease</option>
                    <option>Unlimited Lease</option>
                    <option>Exclusive Rights</option>
                </select>
                <div className="flex gap-2">
                    <input placeholder="Fee ($)" className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs" value={licenseData.price} onChange={e => setLicenseData({...licenseData, price: e.target.value})} />
                    <input placeholder="Royalty %" className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs" value={licenseData.royalties} onChange={e => setLicenseData({...licenseData, royalties: e.target.value})} />
                </div>
                <input type="date" className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs" value={licenseData.date} onChange={e => setLicenseData({...licenseData, date: e.target.value})} />
            </div>

            <div className="flex-1 bg-zinc-900 rounded-xl flex items-center justify-center p-8 overflow-y-auto">
                <div ref={previewRef} className="bg-white text-black p-12 w-[600px] shadow-2xl font-serif text-[10px] leading-relaxed">
                    <h1 className="text-2xl font-bold text-center mb-6 uppercase border-b-2 border-black pb-4">
                        {licenseData.type.toUpperCase()} AGREEMENT
                    </h1>
                    <p className="mb-4">
                        This Agreement is made on <strong>{licenseData.date}</strong> between <strong>{licenseData.producer || '[PRODUCER NAME]'}</strong> ("Licensor") and <strong>{licenseData.client || '[CLIENT NAME]'}</strong> ("Licensee").
                    </p>
                    <p className="mb-4">
                        <strong>1. Master Recording:</strong> The Licensor hereby grants the Licensee specific rights to the instrumental music track titled <strong>"{licenseData.track || 'UNTITLED'}"</strong>.
                    </p>
                    <p className="mb-4">
                        <strong>2. Rights Granted:</strong> Licensor grants Licensee a {licenseData.type.toLowerCase().includes('exclusive') ? 'exclusive' : 'non-exclusive'} license to use the Master Recording for the creation of a new song. {licenseData.type.includes('Exclusive') ? 'Licensee obtains full ownership rights.' : 'Licensor retains full ownership of the Master Recording.'}
                    </p>
                    <p className="mb-4">
                        <strong>3. Consideration:</strong> In consideration for the rights granted, Licensee shall pay to Licensor a fee of <strong>{licenseData.price}</strong>.
                    </p>
                    <p className="mb-4">
                        <strong>4. Royalties:</strong> Licensor shall be entitled to <strong>{licenseData.royalties}</strong> of all publishing and royalties generated by the new song.
                    </p>
                    <p className="mb-8">
                        <strong>5. Governing Law:</strong> This Agreement shall be governed by and construed in accordance with the laws of the applicable jurisdiction.
                    </p>

                    <div className="mt-12 flex justify-between gap-12">
                        <div className="flex-1 border-t border-black pt-2">
                            <p className="font-bold uppercase mb-4">Licensor</p>
                            <p>{licenseData.producer || '________________'}</p>
                        </div>
                        <div className="flex-1 border-t border-black pt-2 text-right">
                            <p className="font-bold uppercase mb-4">Licensee</p>
                            <p>{licenseData.client || '________________'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // --- TOOL: INVOICE BUILDER ---
    const [invoiceData, setInvoiceData] = useState({
        number: 'INV-001',
        from: '',
        to: '',
        date: new Date().toLocaleDateString(),
        items: [{ desc: 'Beat Lease', rate: 50, qty: 1 }],
        notes: 'Payment due within 30 days. PayPal: your@email.com'
    });

    const addItem = () => setInvoiceData({...invoiceData, items: [...invoiceData.items, { desc: '', rate: 0, qty: 1 }]});
    const removeItem = (idx: number) => setInvoiceData({...invoiceData, items: invoiceData.items.filter((_, i) => i !== idx)});
    const updateItem = (idx: number, field: string, val: any) => {
        const newItems = [...invoiceData.items];
        (newItems[idx] as any)[field] = val;
        setInvoiceData({...invoiceData, items: newItems});
    };

    const total = invoiceData.items.reduce((acc, item) => acc + (Number(item.rate) * Number(item.qty)), 0);

    const renderInvoiceBuilder = () => (
        <div className="flex gap-8 h-full">
            <div className="w-80 space-y-4 overflow-y-auto pr-2 pb-20">
                <h3 className="text-xs font-bold text-zinc-500 uppercase">Invoice Details</h3>
                <input placeholder="Invoice #" className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs" value={invoiceData.number} onChange={e => setInvoiceData({...invoiceData, number: e.target.value})} />
                <input placeholder="From (Your Business)" className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs" value={invoiceData.from} onChange={e => setInvoiceData({...invoiceData, from: e.target.value})} />
                <input placeholder="Bill To (Client)" className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs" value={invoiceData.to} onChange={e => setInvoiceData({...invoiceData, to: e.target.value})} />
                <input type="date" className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs" value={invoiceData.date} onChange={e => setInvoiceData({...invoiceData, date: e.target.value})} />
                
                <div className="border-t border-zinc-800 pt-4 space-y-2">
                    <label className="text-xs font-bold text-zinc-500">Items</label>
                    {invoiceData.items.map((item, i) => (
                        <div key={i} className="flex gap-2 items-center bg-zinc-900 p-2 rounded">
                            <div className="flex-1 space-y-1">
                                <input placeholder="Description" className="w-full bg-black border border-zinc-800 p-1 rounded text-xs" value={item.desc} onChange={e => updateItem(i, 'desc', e.target.value)} />
                                <div className="flex gap-2">
                                    <input placeholder="$" type="number" className="w-16 bg-black border border-zinc-800 p-1 rounded text-xs" value={item.rate} onChange={e => updateItem(i, 'rate', e.target.value)} />
                                    <input placeholder="Qty" type="number" className="w-12 bg-black border border-zinc-800 p-1 rounded text-xs" value={item.qty} onChange={e => updateItem(i, 'qty', e.target.value)} />
                                </div>
                            </div>
                            <button onClick={() => removeItem(i)} className="text-zinc-500 hover:text-red-500"><Trash2 size={14}/></button>
                        </div>
                    ))}
                    <button onClick={addItem} className="w-full border border-dashed border-zinc-700 text-zinc-500 py-2 rounded text-xs hover:text-white hover:border-white flex items-center justify-center gap-1">
                        <Plus size={12} /> Add Item
                    </button>
                </div>

                <textarea placeholder="Payment Notes / Terms" className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs h-20 resize-none" value={invoiceData.notes} onChange={e => setInvoiceData({...invoiceData, notes: e.target.value})} />
            </div>

            <div className="flex-1 bg-zinc-900 rounded-xl flex items-center justify-center p-8 overflow-y-auto">
                <div ref={previewRef} className="bg-white text-black p-12 w-[600px] shadow-2xl font-sans text-sm min-h-[600px] flex flex-col">
                    <div className="flex justify-between items-start mb-12 border-b-2 border-black pb-6">
                        <div>
                            <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">INVOICE</h1>
                            <p className="text-gray-500 font-mono text-xs">#{invoiceData.number}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold">{invoiceData.from || 'Your Business Name'}</p>
                            <p className="text-xs text-gray-500 mt-1">{invoiceData.date}</p>
                        </div>
                    </div>

                    <div className="mb-12">
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Bill To:</p>
                        <p className="font-bold text-lg">{invoiceData.to || 'Client Name'}</p>
                    </div>

                    <table className="w-full mb-8">
                        <thead>
                            <tr className="border-b border-black text-[10px] uppercase text-gray-500">
                                <th className="text-left py-2">Description</th>
                                <th className="text-right py-2">Rate</th>
                                <th className="text-right py-2">Qty</th>
                                <th className="text-right py-2">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoiceData.items.map((item, i) => (
                                <tr key={i} className="border-b border-gray-100">
                                    <td className="py-4 font-medium">{item.desc || 'Item'}</td>
                                    <td className="py-4 text-right">${Number(item.rate).toFixed(2)}</td>
                                    <td className="py-4 text-right">{item.qty}</td>
                                    <td className="py-4 text-right font-bold">${(Number(item.rate) * Number(item.qty)).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="flex justify-end mb-12">
                        <div className="w-48 border-t-2 border-black pt-4">
                            <div className="flex justify-between items-center text-xl font-black">
                                <span>TOTAL</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-gray-200">
                        <p className="text-[10px] uppercase font-bold text-gray-500 mb-2">Payment Instructions / Notes</p>
                        <p className="text-xs whitespace-pre-wrap">{invoiceData.notes}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    // --- RENDER MAIN ---
    return (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
            {/* Header */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#09090b]">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[var(--accent)] rounded-lg text-black"><Briefcase size={20} /></div>
                    <h1 className="text-lg font-black tracking-tight text-white">PRODUCER TOOLS</h1>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors">
                    <X size={24} />
                </button>
            </div>

            {/* Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-64 bg-[#121214] border-r border-white/5 flex flex-col p-2 space-y-1 overflow-y-auto">
                    {[
                        { id: 'receipt', label: 'Receipt Maker', icon: Receipt },
                        { id: 'hashtag', label: 'Hashtag Gen', icon: Hash },
                        { id: 'seo', label: 'YouTube SEO', icon: Search },
                        { id: 'price', label: 'Price Chart', icon: DollarSign },
                        { id: 'social', label: 'Social Captions', icon: Share2 },
                        { id: 'split', label: 'Split Sheet', icon: FileSignature },
                        { id: 'license', label: 'License Gen', icon: FileText },
                        { id: 'invoice', label: 'Invoice Builder', icon: FileText },
                        { id: 'thumb', label: 'Thumb Generator', icon: MonitorPlay },
                    ].map((tool) => (
                        <button 
                            key={tool.id}
                            onClick={() => setActiveTool(tool.id as ToolId)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all ${activeTool === tool.id ? 'bg-[var(--accent)] text-black' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <tool.icon size={16} /> {tool.label}
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-main)]">
                    <div className="flex-1 p-8 overflow-hidden">
                        {activeTool === 'receipt' && renderReceipt()}
                        {activeTool === 'hashtag' && renderHashtags()}
                        {activeTool === 'seo' && renderSEO()}
                        {activeTool === 'price' && renderPriceChart()}
                        {activeTool === 'social' && renderCaptions()}
                        {activeTool === 'split' && renderSplitSheet()}
                        {activeTool === 'license' && renderLicenseGenerator()}
                        {activeTool === 'invoice' && renderInvoiceBuilder()}
                        {activeTool === 'thumb' && renderThumbnailTool()}
                    </div>
                    
                    {/* Action Bar */}
                    <div className="h-16 border-t border-white/5 bg-[#121214] flex items-center justify-end px-8 gap-4">
                        {(activeTool === 'receipt' || activeTool === 'price' || activeTool === 'split' || activeTool === 'license' || activeTool === 'invoice') && (
                            <>
                                <button onClick={exportImage} disabled={isExporting} className="flex items-center gap-2 px-6 py-2 bg-zinc-800 text-white rounded-lg text-xs font-bold hover:bg-zinc-700 transition-colors">
                                    {isExporting ? <Loader2 className="animate-spin" size={14}/> : <ImageIcon size={14} />} EXPORT PNG
                                </button>
                                <button onClick={exportPDF} disabled={isExporting} className="flex items-center gap-2 px-6 py-2 bg-[var(--accent)] text-black rounded-lg text-xs font-bold hover:opacity-90 transition-colors">
                                    {isExporting ? <Loader2 className="animate-spin" size={14}/> : <Download size={14} />} EXPORT PDF
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProducerTools;