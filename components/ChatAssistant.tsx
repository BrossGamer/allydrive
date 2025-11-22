import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Mic, MicOff, Volume2, Minimize2 } from 'lucide-react';
import { Message } from '../types';
import { sendMessageToGemini } from '../services/geminiService';

interface ChatAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_PROMPTS = [
  "Onde estou?",
  "Tem radar?",
  "Como estacionar?",
  "Estou tenso"
];

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Oi! Sou a Alice. Estou aqui para te ajudar. Vamos lá?',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Speech Setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.lang = 'pt-BR';
        recognitionRef.current.interimResults = false;
        recognitionRef.current.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
            handleSend(transcript); 
        };
        recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); 
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 1.05; 
        const voices = window.speechSynthesis.getVoices();
        const ptVoice = voices.find(v => v.lang === 'pt-BR' && (v.name.includes('Google') || v.name.includes('Female')));
        if (ptVoice) utterance.voice = ptVoice;
        window.speechSynthesis.speak(utterance);
    }
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;
    
    // Stop listening if active
    if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
    }

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const apiHistory = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
    const responseText = await sendMessageToGemini(text, apiHistory);
    const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: responseText || "Ops, não entendi.", timestamp: Date.now() };

    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
    speakResponse(responseText);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 h-[60vh] md:absolute md:bottom-6 md:right-6 md:left-auto md:w-[380px] md:h-[550px] glass-panel rounded-t-[32px] md:rounded-[32px] shadow-2xl z-[60] flex flex-col transition-all duration-300 animate-float-up border border-white/10 overflow-hidden">
      
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-ally-primary to-purple-700 rounded-full flex items-center justify-center shadow-lg">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg leading-none">Alice</h3>
            <p className="text-xs text-ally-secondary font-medium mt-0.5">Online</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70">
          <Minimize2 size={20} />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && (
               <button onClick={() => speakResponse(msg.text)} className="mr-2 mt-1 text-white/40 hover:text-ally-secondary self-start">
                  <Volume2 size={14} />
               </button>
            )}
            <div className={`max-w-[85%] p-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-ally-primary text-white rounded-tr-sm font-medium shadow-lg shadow-ally-primary/20' 
                : 'bg-white/10 text-gray-100 rounded-tl-sm border border-white/5 backdrop-blur-md'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="bg-white/10 p-4 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
                    <div className="w-2 h-2 bg-ally-secondary rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-ally-secondary rounded-full animate-bounce delay-75" />
                    <div className="w-2 h-2 bg-ally-secondary rounded-full animate-bounce delay-150" />
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-950/40 backdrop-blur-md pb-safe">
        {messages.length < 4 && (
            <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar mask-linear">
                {QUICK_PROMPTS.map((prompt, idx) => (
                    <button 
                        key={idx}
                        onClick={() => handleSend(prompt)}
                        className="whitespace-nowrap px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-medium text-gray-300 transition-all hover:scale-105"
                    >
                        {prompt}
                    </button>
                ))}
            </div>
        )}
        
        <div className="flex gap-2 items-center bg-slate-900/80 border border-white/10 rounded-full p-1.5 pr-1.5 pl-4 focus-within:border-ally-primary/50 transition-colors">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Digite ou fale..."
                className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-gray-500"
              />
              <button 
                onClick={() => isListening ? recognitionRef.current?.stop() : recognitionRef.current?.start()}
                className={`p-2.5 rounded-full transition-all ${isListening ? 'bg-ally-danger text-white animate-pulse' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
              >
                 {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <button 
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className="bg-ally-primary text-white p-2.5 rounded-full hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95"
              >
                <Send size={18} />
              </button>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;