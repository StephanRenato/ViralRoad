import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Zap } from 'lucide-react';
import { User } from '../types';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const ChatWidget: React.FC<{ user: User }> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Olá, ${user.name || 'criador'}! Sou o Road Support AI. Como posso acelerar sua escala de conteúdo hoje?` }
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

    try {
      const response = await fetch('/api/ia-proxy', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: 'gemini-3-flash-preview',
          contents: [...messages, { role: 'user', text: userMessage }].map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
          })),
          config: {
            systemInstruction: `Você é o Agente de Suporte da VIRAL ROAD. Responda de forma concisa e técnica sobre escala de conteúdo.`,
            temperature: 0.7,
          }
        })
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'model', text: data.text || "Erro na Engine Road." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Erro de conexão." }]);
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
            <div className="p-6 bg-yellow-400 dark:bg-zinc-800 flex justify-between items-center border-b border-black/5 dark:border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black dark:bg-yellow-400 rounded-2xl flex items-center justify-center text-yellow-400 dark:text-black">
                  <Zap size={20} fill="currentColor" />
                </div>
                <h4 className="text-[10px] font-black uppercase text-black dark:text-white">Road Support</h4>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 text-black dark:text-white/50 hover:text-red-500"><X size={20} /></button>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-50 dark:bg-zinc-950/50">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-[11px] font-bold italic ${msg.role === 'user' ? 'bg-zinc-900 text-white' : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 border'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 border-t flex gap-2">
              <input type="text" placeholder="Pergunte..." className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-3 text-[11px] outline-none" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} />
              <button onClick={handleSendMessage} className="w-10 h-10 bg-yellow-400 text-black rounded-xl flex items-center justify-center"><Send size={16} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button whileHover={{ scale: 1.1 }} onClick={() => setIsOpen(!isOpen)} className="w-16 h-16 bg-yellow-400 text-black rounded-full flex items-center justify-center shadow-2xl border-4 border-white dark:border-zinc-900"><MessageSquare size={28} /></motion.button>
    </div>
  );
};