
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Zap, Cpu, Loader2, User as UserIcon } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { User } from '../types';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const ChatWidget: React.FC<{ user: User }> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Olá, ${user.name}! Sou o Road Support AI. Como posso acelerar sua escala de conteúdo hoje?` }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    // Initialize GoogleGenAI right before usage
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [...messages, { role: 'user', text: userMessage }].map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })),
        config: {
          systemInstruction: `Você é o Agente de Suporte da VIRAL ROAD. 
          Seu objetivo é ajudar usuários (influenciadores, advogados, criadores) a usarem a plataforma.
          Funcionalidades da Viral Road:
          1. GERADOR: Cria roteiros, ganchos e estratégias.
          2. ACERVO: Salva os roteiros na nuvem.
          3. CALENDÁRIO: Organiza as postagens.
          4. HOOKS: Biblioteca de ganchos virais.
          Sempre responda de forma curta, técnica, motivadora e com o tom de um estrategista sênior. 
          Use termos como "Escala", "Retenção", "Conversão" e "Autoridade".`,
          temperature: 0.7,
        },
      });

      const aiText = response.text || "Desculpe, tive uma falha na conexão com a Road Engine. Pode repetir?";
      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (error) {
      console.error("Erro no chat de suporte:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Ocorreu um erro ao processar sua solicitação. Verifique sua conexão." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-24 lg:bottom-8 right-6 z-[9999]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-[350px] md:w-[400px] h-[500px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl"
          >
            {/* Header */}
            <div className="p-6 bg-yellow-400 dark:bg-zinc-800 flex justify-between items-center border-b border-black/5 dark:border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black dark:bg-yellow-400 rounded-2xl flex items-center justify-center text-yellow-400 dark:text-black">
                  <Zap size={20} fill="currentColor" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase text-black dark:text-white leading-none mb-1">Road Support</h4>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[8px] font-black uppercase text-black/60 dark:text-zinc-400">Online Strategy AI</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 text-black dark:text-white/50 hover:text-red-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Chat Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-zinc-50 dark:bg-zinc-950/50">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-[11px] font-bold italic leading-relaxed ${
                    msg.role === 'user' 
                    ? 'bg-zinc-900 dark:bg-zinc-800 text-white rounded-tr-none shadow-md' 
                    : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 border border-zinc-100 dark:border-zinc-800 rounded-tl-none shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl rounded-tl-none border border-zinc-100 dark:border-zinc-800 flex gap-1">
                    <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1 h-1 bg-yellow-400 rounded-full" />
                    <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1 h-1 bg-yellow-400 rounded-full" />
                    <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1 h-1 bg-yellow-400 rounded-full" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-zinc-900 border-t dark:border-zinc-800 flex gap-2 items-center">
              <input 
                type="text" 
                placeholder="Pergunte sobre sua estratégia..." 
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl p-3 text-[11px] font-bold italic outline-none focus:ring-2 focus:ring-yellow-400/20"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button 
                onClick={handleSendMessage}
                disabled={!input.trim() || isTyping}
                className="w-10 h-10 bg-yellow-400 text-black rounded-xl flex items-center justify-center shadow-lg shadow-yellow-400/20 active:scale-90 disabled:opacity-50 transition-all"
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-yellow-400 text-black rounded-full flex items-center justify-center shadow-2xl shadow-yellow-400/30 border-4 border-white dark:border-zinc-900 relative group"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={28} strokeWidth={3} />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageSquare size={28} strokeWidth={2.5} />
            </motion.div>
          )}
        </AnimatePresence>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[8px] font-black text-white">1</span>
        )}
      </motion.button>
    </div>
  );
};
