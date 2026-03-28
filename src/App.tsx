import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Plus, 
  History, 
  Settings, 
  Wand2, 
  Eraser, 
  Image as ImageIcon, 
  Crop, 
  Maximize, 
  ShieldCheck, 
  Sparkles, 
  Undo2, 
  Redo2, 
  Download, 
  Check,
  ChevronRight,
  User,
  Zap,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { editImage } from './services/geminiService';

interface AdjustmentSliderProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  percent: string;
}

const AdjustmentSlider = ({ label, value, onChange, percent }: AdjustmentSliderProps) => (
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      <span className="text-[10px] font-bold text-blue-600">{percent}</span>
    </div>
    <div className="flex items-center gap-4">
      <input 
        type="range" 
        min="0" 
        max="100" 
        value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-600"
      />
      <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black opacity-50" />
      </div>
    </div>
  </div>
);

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/png');
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'new' | 'history'>('upload');
  
  // Adjustments
  const [brightness, setBrightness] = useState(82);
  const [contrast, setContrast] = useState(45);
  const [sharpness, setSharpness] = useState(12);

  // Resize Modal State
  const [isResizeModalOpen, setIsResizeModalOpen] = useState(false);
  const [resizeWidth, setResizeWidth] = useState(1080);
  const [resizeHeight, setResizeHeight] = useState(1080);

  // Crop Modal State
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropRatio, setCropRatio] = useState<number | null>(null); // null means free/original

  // Generate AI Modal State
  const [isGenerateAIModalOpen, setIsGenerateAIModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerateAIModalOpen(false);
    await processEdit(aiPrompt);
    setAiPrompt('');
  };

  const handleCrop = (ratio: number) => {
    if (!image) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      // Calculate crop dimensions for center crop
      if (width / height > ratio) {
        width = height * ratio;
      } else {
        height = width / ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const startX = (img.width - width) / 2;
        const startY = (img.height - height) / 2;
        ctx.drawImage(img, startX, startY, width, height, 0, 0, width, height);
        const croppedDataUrl = canvas.toDataURL(mimeType);
        setImage(croppedDataUrl);
        setHistory(prev => [...prev, croppedDataUrl]);
        setIsCropModalOpen(false);
      }
    };
    img.src = image;
  };

  const handleResize = () => {
    if (!image) return;
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = resizeWidth;
      canvas.height = resizeHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, resizeWidth, resizeHeight);
        const resizedDataUrl = canvas.toDataURL(mimeType);
        setImage(resizedDataUrl);
        setHistory(prev => [...prev, resizedDataUrl]);
        setIsResizeModalOpen(false);
      }
    };
    img.src = image;
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImage(result);
        setOriginalImage(result);
        setMimeType(file.type);
        setHistory([result]);
        
        // Set initial resize dimensions
        const img = new Image();
        img.onload = () => {
          setResizeWidth(img.width);
          setResizeHeight(img.height);
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const processEdit = async (prompt: string) => {
    if (!image) return;
    setIsProcessing(true);
    try {
      const result = await editImage(image, mimeType, prompt);
      setImage(result);
      setHistory(prev => [...prev, result]);
    } catch (error) {
      console.error("Editing failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const undo = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      setImage(newHistory[newHistory.length - 1]);
    }
  };

  const downloadImage = () => {
    if (!image) return;
    const link = document.createElement('a');
    link.href = image;
    link.download = `ai-edit-pro-${Date.now()}.png`;
    link.click();
  };

  const startNewProject = () => {
    setImage(null);
    setOriginalImage(null);
    setHistory([]);
    setBrightness(82);
    setContrast(45);
    setSharpness(12);
    fileInputRef.current?.click();
  };

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F8F9FB] text-gray-900 font-sans overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col z-50">
        <div className="p-8 flex items-center gap-2">
          <span className="text-2xl font-black tracking-tighter">AI Edit</span>
          <span className="bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">PRO</span>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-gray-400 hover:text-black hover:bg-gray-50`}
          >
            <Upload className="w-5 h-5" />
            <span className="text-sm">Upload</span>
          </button>
          <button 
            onClick={startNewProject}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-gray-400 hover:text-black hover:bg-gray-50`}
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm">New Project</span>
          </button>
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${isHistoryOpen ? 'bg-gray-50 text-black font-semibold' : 'text-gray-400 hover:text-black hover:bg-gray-50'}`}
          >
            <History className="w-5 h-5" />
            <span className="text-sm">History</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-50 space-y-4">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-4 px-4 py-3 text-gray-400 hover:text-black hover:bg-gray-50 transition-all rounded-xl"
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm">Settings</span>
          </button>
          
          <div className="flex items-center gap-3 px-4 py-2 border-t border-gray-50 pt-4">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
              <User className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">Alex Rivera</p>
              <p className="text-[10px] text-gray-400 truncate">Pro Studio Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Top Toolbar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-40">
          <div className="flex items-center gap-1">
            <button 
              onClick={() => processEdit("Auto-enhance this image.")}
              className="flex flex-col items-center justify-center px-4 py-1 hover:bg-gray-50 rounded-lg transition-all group"
            >
              <Wand2 className="w-4 h-4 text-gray-400 group-hover:text-black" />
              <span className="text-[9px] font-bold text-gray-400 group-hover:text-black mt-1 uppercase">Auto IA</span>
            </button>
            <button 
              onClick={() => processEdit("Remove the background.")}
              className="flex flex-col items-center justify-center px-4 py-1 hover:bg-gray-50 rounded-lg transition-all group"
            >
              <Eraser className="w-4 h-4 text-gray-400 group-hover:text-black" />
              <span className="text-[9px] font-bold text-gray-400 group-hover:text-black mt-1 uppercase">Remover</span>
            </button>
            <button 
              onClick={() => processEdit("Change the background to something creative.")}
              className="flex flex-col items-center justify-center px-4 py-1 bg-blue-50 rounded-lg transition-all"
            >
              <ImageIcon className="w-4 h-4 text-blue-600" />
              <span className="text-[9px] font-bold text-blue-600 mt-1 uppercase">AI BG</span>
            </button>
            <div className="w-[1px] h-6 bg-gray-100 mx-2" />
            <button 
              onClick={() => setIsCropModalOpen(true)}
              className="flex flex-col items-center justify-center px-4 py-1 hover:bg-gray-50 rounded-lg transition-all group"
            >
              <Crop className="w-4 h-4 text-gray-400 group-hover:text-black" />
              <span className="text-[9px] font-bold text-gray-400 group-hover:text-black mt-1 uppercase">Crop</span>
            </button>
            <button 
              onClick={() => setIsResizeModalOpen(true)}
              className="flex flex-col items-center justify-center px-4 py-1 hover:bg-gray-50 rounded-lg transition-all group"
            >
              <Maximize className="w-4 h-4 text-gray-400 group-hover:text-black" />
              <span className="text-[9px] font-bold text-gray-400 group-hover:text-black mt-1 uppercase">Resize</span>
            </button>
            <button 
              onClick={() => processEdit("Remove watermarks, logos, or text from this image.")}
              className="flex flex-col items-center justify-center px-4 py-1 hover:bg-gray-50 rounded-lg transition-all group"
            >
              <ShieldCheck className="w-4 h-4 text-gray-400 group-hover:text-black" />
              <span className="text-[9px] font-bold text-gray-400 group-hover:text-black mt-1 uppercase">No Watermark</span>
            </button>
            <div className="w-[1px] h-6 bg-gray-100 mx-2" />
            <button 
              onClick={() => processEdit("Apply a professional cinematic filter to this image.")}
              className="flex flex-col items-center justify-center px-4 py-1 hover:bg-gray-50 rounded-lg transition-all group"
            >
              <Sparkles className="w-4 h-4 text-gray-400 group-hover:text-black" />
              <span className="text-[9px] font-bold text-gray-400 group-hover:text-black mt-1 uppercase">Filters</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={undo} disabled={history.length <= 1} className="p-2 text-gray-300 hover:text-black disabled:opacity-30">
              <Undo2 className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-300 hover:text-black disabled:opacity-30">
              <Redo2 className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Image Canvas */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center p-12">
          {!image ? (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto border border-gray-50">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
              >
                Upload Image
              </button>
              <input type="file" ref={fileInputRef} onChange={handleUpload} accept="image/*" className="hidden" />
            </div>
          ) : (
            <div className="relative group">
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none z-10 opacity-20">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="border-[0.5px] border-white" />
                ))}
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/10"
              >
                <img 
                  src={image} 
                  alt="Canvas" 
                  className="max-w-full max-h-[70vh] object-contain"
                  style={{
                    filter: `brightness(${brightness}%) contrast(${contrast}%)`
                  }}
                />
                {isProcessing && (
                  <div className="absolute inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <footer className="h-20 bg-white border-t border-gray-100 flex items-center justify-center px-8 z-40">
          <div className="flex items-center gap-4">
            <button onClick={undo} className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-gray-400 hover:text-black uppercase tracking-wider">
              <Undo2 className="w-4 h-4" />
              Undo
            </button>
            <button className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-blue-700 transition-all">
              <Check className="w-4 h-4" />
              Apply
            </button>
            <button onClick={downloadImage} className="flex items-center gap-2 px-8 py-2.5 bg-[#0D6D4A] text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#0a5a3d] transition-all">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </footer>
      </main>

      {/* Right Sidebar - Tools & Tuning */}
      <aside className="w-80 bg-white border-l border-gray-100 flex flex-col z-50">
        <div className="p-8">
          <h2 className="text-xl font-bold">Tools & Tuning</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Image Adjustments</p>
        </div>

        <div className="flex-1 px-8 space-y-10 overflow-y-auto custom-scrollbar pb-8">
          <section className="space-y-6">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Composition</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setIsCropModalOpen(true)}
                className="flex flex-col items-center justify-center gap-3 p-4 bg-white border border-gray-50 rounded-xl hover:border-blue-100 transition-all group"
              >
                <Crop className="w-5 h-5 text-blue-600" />
                <span className="text-[10px] font-bold">Crop</span>
              </button>
              <button 
                onClick={() => setIsResizeModalOpen(true)}
                className="flex flex-col items-center justify-center gap-3 p-4 bg-white border border-gray-50 rounded-xl hover:border-blue-100 transition-all group"
              >
                <Maximize className="w-5 h-5 text-blue-600" />
                <span className="text-[10px] font-bold">Resize</span>
              </button>
            </div>
            <button 
              onClick={() => processEdit("Remove watermarks from this image.")}
              className="w-full flex items-center justify-between p-4 bg-white border border-gray-50 rounded-xl hover:border-blue-100 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-[10px] font-bold">Remove Watermark</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          </section>

          <section className="space-y-8">
            <AdjustmentSlider label="Brightness" value={brightness} onChange={setBrightness} percent={`${brightness}%`} />
            <AdjustmentSlider label="Contrast" value={contrast} onChange={setContrast} percent={`${contrast}%`} />
            <AdjustmentSlider label="Sharpness" value={sharpness} onChange={setSharpness} percent={`${sharpness}%`} />
          </section>
        </div>

        <div className="p-6">
          <button 
            onClick={() => setIsGenerateAIModalOpen(true)}
            disabled={!image || isProcessing}
            className="w-full py-4 bg-[#0061D5] text-white rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-[#0056bc] transition-all shadow-xl shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap className="w-5 h-5 fill-white" />
            Generate AI
          </button>
        </div>
      </aside>

      {/* Generate AI Modal */}
      <AnimatePresence>
        {isGenerateAIModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Zap className="w-5 h-5 text-blue-600 fill-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold">Generate with AI</h3>
                </div>
                <button onClick={() => setIsGenerateAIModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-500">Describe what you want to change or add to the image. Be specific for better results.</p>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g., 'Add a futuristic city in the background' or 'Change the sky to a sunset'"
                  className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all resize-none"
                  autoFocus
                />
                <div className="flex flex-wrap gap-2">
                  {['Cyberpunk style', 'Oil painting', 'Cinematic lighting', 'Add a llama'].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setAiPrompt(suggestion)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-[10px] font-bold text-gray-600 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setIsGenerateAIModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleGenerateAI}
                  disabled={!aiPrompt.trim()}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Generate
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {isHistoryOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Edit History</h3>
                <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar p-1">
                {history.map((step, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setImage(step);
                      setHistory(history.slice(0, index + 1));
                      setIsHistoryOpen(false);
                    }}
                    className="group relative aspect-square bg-gray-50 rounded-xl overflow-hidden border border-gray-100 hover:border-blue-600 transition-all"
                  >
                    <img src={step} alt={`Step ${index}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest">Restore</span>
                    </div>
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-1.5 py-0.5 rounded text-[8px] font-bold">
                      #{index + 1}
                    </div>
                  </button>
                ))}
                {history.length === 0 && (
                  <div className="col-span-3 py-12 text-center text-gray-400 text-sm">
                    No history available yet.
                  </div>
                )}
              </div>

              <button 
                onClick={() => setIsHistoryOpen(false)}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Settings</h3>
                <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">High Quality Export</p>
                    <p className="text-[10px] text-gray-400">Export images in maximum resolution</p>
                  </div>
                  <div className="w-10 h-5 bg-blue-600 rounded-full relative">
                    <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">Auto-Save</p>
                    <p className="text-[10px] text-gray-400">Save changes automatically to history</p>
                  </div>
                  <div className="w-10 h-5 bg-gray-200 rounded-full relative">
                    <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full" />
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-50">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">App Version</p>
                  <p className="text-xs font-medium text-gray-600">AI Edit Pro v2.4.0</p>
                </div>
              </div>

              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Crop Modal */}
      <AnimatePresence>
        {isCropModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Crop Image</h3>
                <button onClick={() => setIsCropModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Square (1:1)', ratio: 1 },
                  { label: 'Standard (4:3)', ratio: 4/3 },
                  { label: 'Wide (16:9)', ratio: 16/9 },
                  { label: 'Portrait (3:4)', ratio: 3/4 }
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handleCrop(preset.ratio)}
                    className="p-4 border border-gray-100 rounded-xl hover:border-blue-600 hover:bg-blue-50 transition-all text-center"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider">{preset.label}</span>
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setIsCropModalOpen(false)}
                className="w-full py-3 border border-gray-100 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resize Modal */}
      <AnimatePresence>
        {isResizeModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Resize Image</h3>
                <button onClick={() => setIsResizeModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Width (px)</label>
                  <input 
                    type="number" 
                    value={resizeWidth} 
                    onChange={(e) => setResizeWidth(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-blue-600 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Height (px)</label>
                  <input 
                    type="number" 
                    value={resizeHeight} 
                    onChange={(e) => setResizeHeight(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-blue-600 transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setIsResizeModalOpen(false)}
                  className="flex-1 py-3 border border-gray-100 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleResize}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                >
                  Resize
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #4B5563;
          cursor: pointer;
          margin-top: -4px;
        }
        input[type=range]::-webkit-slider-runnable-track {
          width: 100%;
          height: 4px;
          cursor: pointer;
          background: #E5E7EB;
          border-radius: 2px;
        }
      `}} />
    </div>
  );
}
