import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useSettingsStore } from '../stores/settingsStore';
import { chatWithQwen, type ChatMessage } from '../lib/qwen';
import { toast } from 'sonner';

const SYSTEM_PROMPT = `你是「情绪树洞」里的一位温暖、倾听型助手。用户可能会在这里倾诉心情、压力或烦恼。请用简短、共情、支持性的语言回应，不要说教，不要给过长建议。可以适当用一两句安慰或鼓励，或简单追问，帮助用户梳理情绪。回复尽量控制在 2～4 句话内。`;

export function TreeholePage() {
  const qwenApiKey = useSettingsStore((s) => s.qwenApiKey);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    if (!qwenApiKey) {
      toast.error('请先在设置中填写千问 API Key');
      return;
    }
    setInput('');
    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    try {
      const reply = await chatWithQwen(qwenApiKey, [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
        userMsg,
      ]);
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '请求失败');
      setMessages((m) => m.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4 flex items-center gap-2 text-gray-700 dark:text-gray-300">
        <MessageCircle className="h-5 w-5" />
        <span className="font-medium">情绪树洞</span>
      </div>
      {!qwenApiKey && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          请先在「设置」中填写千问 API Key 后再使用对话功能。
        </div>
      )}
      <div
        ref={listRef}
        className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
      >
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            随便说点什么吧，我会在这里听。
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-[rgb(var(--accent))] text-white'
                  : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-500 dark:bg-gray-700 dark:text-gray-400">
              正在回复…
            </div>
          </div>
        )}
      </div>
      <div className="mt-4 flex gap-2">
        <Input
          placeholder="输入想说的话..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          disabled={loading}
          className="flex-1"
        />
        <Button onClick={send} disabled={loading || !input.trim()} size="icon" aria-label="发送">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
