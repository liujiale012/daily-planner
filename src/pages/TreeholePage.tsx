import { useState, useRef, useEffect } from 'react';
import dayjs from 'dayjs';
import { Send, Cloud, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useSettingsStore } from '../stores/settingsStore';
import { chatWithQwen, type ChatMessage } from '../lib/qwen';
import { toast } from 'sonner';

const SYSTEM_PROMPT = `你正在扮演「情绪树洞」里的小森林精灵，是一个温柔、安静、很会倾听的朋友。

回复风格要求：
1）先「共情」后「回应」：先用 1 句话承接用户情绪（比如“听起来你最近真的很辛苦”），再用 1～2 句话给出安慰或简单建议。
2）语气要轻柔、口语化、不过度鸡汤，不过度理性分析，不评价对错，不批判任何人。
3）不要问太多问题，一次最多追问 1 个简单问题，帮助对方继续说下去。
4）不要提到自己是 AI、模型、程序，也不要出现“作为一个 AI”“语言模型”这类说法。
5）回复长度控制在 2～4 句话之间，尽量短一点，让人读起来不累。

如果用户只是随便说一句日常小事，也可以用轻松的语气回应，像朋友聊天一样。`;

export function TreeholePage() {
  const qwenApiKey = useSettingsStore((s) => s.qwenApiKey);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const now = dayjs();

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
      ], 'qwen3-max');
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '请求失败');
      setMessages((m) => m.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col rounded-[36px] bg-gradient-to-b from-[#ffd7b8] via-[#ffe6cf] to-[#ffd1e3] px-10 py-8 text-[#73412d]">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm opacity-80">
            {now.format('YYYY年M月D日')} {['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.day()]}
          </p>
          <p className="mt-1 text-xs opacity-70">今天也把事情愉快安排清楚吧</p>
        </div>
        <Cloud className="h-5 w-5 opacity-70" />
      </header>

      {!qwenApiKey && (
        <div className="mb-3 flex items-center gap-2 rounded-full bg-white/70 px-4 py-1 text-xs text-amber-700 shadow-sm">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>请先在「设置」中填写千问 API Key 后再使用对话功能。</span>
        </div>
      )}

      <main className="flex flex-1 gap-6 rounded-[32px] bg-[#fff9ee]/80 p-6 shadow-inner">
        <section className="flex-1 rounded-3xl border border-[#f4e2c5] bg-[#fffaf1] px-6 py-5 shadow-[0_18px_60px_rgba(190,140,90,0.18)]">
          <p className="mb-3 text-xs text-[#c9a985]">
            随便说点什么吧，我会在这里听。
          </p>
          <div
            ref={listRef}
            className="h-full space-y-3 overflow-y-auto pr-2 text-sm leading-relaxed text-[#80543b]"
          >
            {messages.length === 0 && !loading && (
              <p className="mt-8 text-center text-xs text-[#c9a985]">
                把你的烦恼轻轻写在这里吧…
              </p>
            )}
            {messages.map((msg, i) => (
              <p
                key={i}
                className={`whitespace-pre-wrap ${
                  msg.role === 'user' ? 'text-right text-[#a96d4b]' : 'text-left'
                }`}
              >
                {msg.content}
              </p>
            ))}
            {loading && (
              <p className="text-xs text-[#c9a985]">正在认真听你说话中…</p>
            )}
          </div>
        </section>

        <aside className="hidden w-52 flex-shrink-0 items-stretch justify-center lg:flex">
          <div className="relative flex h-full w-full flex-col overflow-hidden rounded-3xl bg-gradient-to-t from-[#ffc7d9] via-[#ffe7b9] to-[#ffe6f0] p-4 shadow-[0_18px_60px_rgba(190,140,120,0.3)]">
            <div className="relative flex flex-1 items-start justify-center">
              {/* 这里不再放静态表情，只展示气泡动画 */}
              {/* 像气泡一样从说明卡片上方冒出的治愈表情 */}
              <span
                className="treehole-bubble text-2xl"
                style={{ left: '25%', bottom: '40px', animationDelay: '0s' }}
              >
                😊
              </span>
              <span
                className="treehole-bubble text-2xl"
                style={{ left: '55%', bottom: '40px', animationDelay: '0.8s' }}
              >
                🌈
              </span>
              <span
                className="treehole-bubble text-2xl"
                style={{ left: '40%', bottom: '40px', animationDelay: '1.6s' }}
              >
                🌙
              </span>
              <span
                className="treehole-bubble text-2xl"
                style={{ left: '35%', bottom: '40px', animationDelay: '2.4s' }}
              >
                💫
              </span>
              <span
                className="treehole-bubble text-2xl"
                style={{ left: '65%', bottom: '40px', animationDelay: '3.2s' }}
              >
                💖
              </span>
            </div>
            {/* 下半部分：情绪树洞说明卡片，作为气泡起点 */}
            <div className="relative mt-auto rounded-2xl bg-white/80 px-3 py-2 text-xs text-[#a26345] shadow">
              <p className="font-medium">情绪树洞</p>
              <p className="mt-1 text-[11px] opacity-80">
                无论开心难过，我都会在这里听你说。
              </p>
            </div>
          </div>
        </aside>
      </main>

      <div className="mt-4 flex items-center rounded-full bg-white/80 px-4 py-2 shadow-md">
        <Input
          placeholder="把你的烦恼告诉我吧…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          disabled={loading}
          className="border-none bg-transparent text-sm shadow-none focus-visible:ring-0"
        />
        <Button
          onClick={send}
          disabled={loading || !input.trim()}
          size="icon"
          aria-label="发送"
          className="ml-2 h-8 w-8 rounded-full bg-[#ff9fb5] text-white shadow-md hover:bg-[#ff87a4]"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
