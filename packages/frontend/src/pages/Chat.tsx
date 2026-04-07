import { useState, useRef, useEffect } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { useChatHistory, useSendMessage, useClearChat } from '../hooks/useChat.js';

export function ChatPage() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: messages = [], isLoading } = useChatHistory();
  const sendMutation = useSendMessage();
  const clearMutation = useClearChat();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sendMutation.isPending]);

  const handleSend = () => {
    const msg = input.trim();
    if (!msg || sendMutation.isPending) return;
    setInput('');
    sendMutation.mutate(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">DuckAI</h1>
        <button
          onClick={() => clearMutation.mutate()}
          disabled={clearMutation.isPending || messages.length === 0}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--danger)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          title="Limpar historico"
        >
          <Trash2 size={16} />
          <span className="hidden sm:inline">Limpar</span>
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pb-4 pr-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-[var(--text-muted)]">Carregando historico...</span>
          </div>
        ) : messages.length === 0 && !sendMutation.isPending ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <img src="/duck.svg" alt="DuckAI" className="w-16 h-16 opacity-50" />
            <p className="text-[var(--text-muted)] text-lg">Ola! Sou o DuckAI</p>
            <p className="text-[var(--text-muted)] text-sm max-w-md">
              Me pergunte sobre suas financas. Ex: "Quanto gastei esse mes?", "Resumo financeiro", "Quais meus orcamentos?"
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <ChatBubble key={msg.id} role={msg.role} content={msg.content} />
            ))}
            {sendMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-[var(--bg-tertiary)] rounded-2xl rounded-bl-sm px-4 py-3 max-w-[80%] border border-[var(--border-color)]">
                  <TypingDots />
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex gap-2 pt-3 border-t border-[var(--border-color)] shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pergunte sobre suas financas..."
          disabled={sendMutation.isPending}
          className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sendMutation.isPending}
          className="bg-[var(--accent)] text-black rounded-xl px-4 py-3 hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

function ChatBubble({ role, content }: { role: string; content: string }) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`rounded-2xl px-4 py-3 max-w-[80%] text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-[var(--accent)] text-black rounded-br-sm'
            : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-bl-sm border border-[var(--border-color)]'
        }`}
      >
        {content}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex gap-1 items-center py-1">
      <span className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce [animation-delay:0ms]" />
      <span className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce [animation-delay:150ms]" />
      <span className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce [animation-delay:300ms]" />
    </div>
  );
}
