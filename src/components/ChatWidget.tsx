import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Zap, Paperclip, Image as ImageIcon, Mic, Loader2, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface Message {
  role: 'user' | 'model';
  text: string;
  attachment?: {
    data: string;
    mimeType: string;
  };
}

export const ChatWidget: React.FC<{ user: User }> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Olá, ${user.name || 'criador'}! Sou o Road Support AI. Como posso acelerar sua escala de conteúdo hoje?` }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [attachment, setAttachment] = useState<{ data: string, mimeType: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment({
          data: (reader.result as string).split(',')[1],
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && !attachment) || isTyping) return;

    const userMessage = input.trim();
    const currentAttachment = attachment;
    
    setInput('');
    setAttachment(null);
    setMessages(prev => [...prev, { 
      role: 'user', 
      text: userMessage || (currentAttachment?.mimeType.startsWith('image') ? '[Imagem]' : '[Arquivo]'),
      attachment: currentAttachment || undefined
    }]);
    setIsTyping(true);

    try {
      const contents = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      // Adiciona a mensagem atual com anexo se houver
      const currentParts: any[] = [{ text: userMessage }];
      if (currentAttachment) {
        currentParts.push({
          inlineData: {
            data: currentAttachment.data,
            mimeType: currentAttachment.mimeType
          }
        });
      }
      contents.push({ role: 'user', parts: currentParts });

      const response = await fetch('/api/ia-proxy', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: 'gemini-3-flash-preview',
          contents,
          config: {
            systemInstruction: `Você é o Agente de Suporte Avançado da VIRAL ROAD. 
            Responda de forma prestativa, inteligente e adaptada ao tom do usuário (${user.name}).
            
            CONHECIMENTO DO SISTEMA:
            - Road Gerador: Fábrica de roteiros (Blueprints) de alta performance.
            - Road Performance: Auditoria neural de métricas reais (Instagram, TikTok, etc).
            - Road Acervo: Onde ficam salvos todos os seus tesouros de conteúdo.
            - Road Calendário: Sua linha do tempo estratégica.
            - Road Hooks: Gatilhos mentais para retenção máxima.
            
            DIRETRIZES:
            1. Se o usuário parecer frustrado, seja empático. Se estiver animado, seja enérgico.
            2. Se ele perguntar sobre algo que não sabe, admita e sugira falar com um especialista.
            3. ESPECIALISTA HUMANO: Se o usuário quiser falar com Stephan Silva (CEO/Especialista), forneça este link: https://wa.me/message/FIHKA4ZOQIXCN1.
            4. Você entende imagens e áudios. Analise-os se enviados.
            5. Responda em no máximo 1 minuto (simulado pela interface).`,
            temperature: 0.8,
          }
        })
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'model', text: data.text || "A Engine Road encontrou uma instabilidade momentânea." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Erro de conexão com a Cloud Road." }]);
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
                  <div className={`max-w-[80%] p-4 rounded-2xl text-[11px] font-bold italic ${msg.role === 'user' ? 'bg-zinc-900 text-white shadow-lg' : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 shadow-sm'}`}>
                    {msg.text}
                    {msg.text.includes('https://wa.me') && (
                      <a href="https://wa.me/message/FIHKA4ZOQIXCN1" target="_blank" rel="noopener noreferrer" className="block mt-2 p-2 bg-green-500 text-white rounded-xl text-center not-italic hover:bg-green-600 transition-colors">
                        Falar com Stephan no WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex gap-1">
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-2">
              {attachment && (
                <div className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-800 p-2 rounded-xl">
                  <span className="text-[9px] font-black uppercase text-zinc-500 truncate max-w-[200px]">Anexo Pronto</span>
                  <button onClick={() => setAttachment(null)} className="text-red-500"><X size={14} /></button>
                </div>
              )}
              <div className="flex gap-2">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-xl flex items-center justify-center hover:text-yellow-400 transition-colors"
                >
                  <Paperclip size={18} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*,audio/*"
                />
                <input 
                  type="text" 
                  placeholder="Pergunte sobre o sistema..." 
                  className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-3 text-[11px] font-bold outline-none focus:ring-1 focus:ring-yellow-400/30" 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} 
                />
                <button onClick={handleSendMessage} disabled={isTyping} className="w-10 h-10 bg-yellow-400 text-black rounded-xl flex items-center justify-center shadow-lg active:scale-95 disabled:opacity-50">
                  {isTyping ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button whileHover={{ scale: 1.1 }} onClick={() => setIsOpen(!isOpen)} className="w-16 h-16 bg-yellow-400 text-black rounded-full flex items-center justify-center shadow-2xl border-4 border-white dark:border-zinc-900"><MessageSquare size={28} /></motion.button>
    </div>
  );
};