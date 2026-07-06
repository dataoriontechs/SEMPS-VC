import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { MessageSquare, Send, Sparkles, AlertCircle, Bot, User } from 'lucide-react';

export default function AiAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: 'Olá! Sou o Assistente Virtual da SEMPS Vera Cruz/BA. Estou aqui 24h por dia para tirar suas dúvidas sobre o CadÚnico, Bolsa Família, Cursos de Capacitação, benefícios municipais e agendamentos. Como posso lhe ajudar hoje?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  const suggestionQuestions = [
    'Como posso agendar o CadÚnico?',
    'Quais documentos preciso levar para o CRAS?',
    'Como funciona o Bolsa Família Municipal?',
    'Como me inscrevo nas oficinas de capacitação?'
  ];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    setError('');
    const userMessage: Message = {
      id: 'msg-' + Math.random().toString(36).substr(2, 9),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Send chat history to backend proxy
      const history = [...messages, userMessage];

      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar conversa.');
      }

      const replyMessage: Message = {
        id: 'msg-' + Math.random().toString(36).substr(2, 9),
        sender: 'assistant',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, replyMessage]);
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar à inteligência artificial.');
      setMessages((prev) => [
        ...prev,
        {
          id: 'msg-error',
          sender: 'assistant',
          text: 'Desculpe, estou com dificuldades técnicas temporárias para responder à sua dúvida. Por favor, tente novamente em alguns instantes.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-[32px] border border-brand-green-light shadow-xl flex flex-col h-[600px] overflow-hidden animate-fade-in">
      {/* Chat Header */}
      <div className="bg-brand-green-dark p-4 text-white flex items-center justify-between border-b border-brand-green-light">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-xl text-yellow-300">
            <Sparkles className="w-5 h-5 fill-yellow-300" />
          </div>
          <div>
            <h2 className="font-display font-semibold italic text-sm">Assistente de IA da SEMPS</h2>
            <p className="text-[10px] text-brand-cream-dark font-light">Disponível 24h • Dúvidas Institucionais</p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-brand-green/30 border border-brand-green-light/20 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse mr-1"></span> Ativo
        </div>
      </div>

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-brand-cream/30">
        {messages.map((msg) => {
          const isAssistant = msg.sender === 'assistant';
          return (
            <div 
              key={msg.id} 
              className={`flex gap-3 max-w-[85%] ${isAssistant ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
            >
              {/* Icon */}
              <div className={`p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0 ${isAssistant ? 'bg-brand-green-light text-brand-green-dark border border-brand-green-light' : 'bg-brand-cream text-brand-green-dark border border-brand-green-light'}`}>
                {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Balloon */}
              <div className="space-y-1">
                <div className={`p-4 rounded-2xl text-xs leading-relaxed ${isAssistant ? 'bg-white border border-brand-green-light text-brand-green-dark rounded-tl-xs shadow-xs' : 'bg-brand-green text-white rounded-tr-xs shadow-sm'}`}>
                  {msg.text}
                </div>
                <p className={`text-[9px] text-[#5a5a40]/70 font-mono ${isAssistant ? 'text-left' : 'text-right'}`}>
                  {msg.timestamp}
                </p>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 max-w-[80%] mr-auto">
            <div className="p-2 rounded-full h-8 w-8 bg-brand-green-light text-brand-green-dark flex items-center justify-center animate-pulse border border-brand-green-light">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-brand-green-light p-4 rounded-2xl rounded-tl-xs flex items-center gap-1.5 text-xs text-[#5a5a40] font-light">
              <span>Digitando resposta</span>
              <span className="flex gap-0.5 mt-1">
                <span className="w-1 h-1 bg-brand-green rounded-full animate-bounce delay-100"></span>
                <span className="w-1 h-1 bg-brand-green rounded-full animate-bounce delay-200"></span>
                <span className="w-1 h-1 bg-brand-green rounded-full animate-bounce delay-300"></span>
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-150 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={chatEndRef}></div>
      </div>

      {/* Sugeridos & Input Row */}
      <div className="p-4 bg-white border-t border-brand-green-light/40 space-y-3">
        {/* Helper suggestions questions */}
        {messages.length === 1 && (
          <div className="space-y-1">
            <p className="text-[10px] text-brand-green-dark font-bold uppercase tracking-wider">Perguntas Frequentes:</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestionQuestions.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(question)}
                  className="bg-brand-cream hover:bg-brand-green-light/30 text-[10px] text-brand-green-dark border border-brand-green-light px-3 py-1.5 rounded-full transition"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua dúvida sobre os serviços da SEMPS..."
            disabled={loading}
            className="flex-1 border border-brand-green-light px-4 py-3 rounded-xl focus:outline-none focus:border-brand-green text-xs bg-brand-cream/10"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-brand-green hover:bg-brand-green-dark disabled:opacity-40 text-white p-3.5 rounded-full transition shadow-md shrink-0 flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
