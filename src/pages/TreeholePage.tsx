import { useState, useRef, useEffect } from 'react';
import dayjs from 'dayjs';
import { Send, Cloud } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { chatWithQwen, type ChatMessage } from '../lib/qwen';
import kb from '../../rag_knowledge_base_v2.md?raw';
import { retrieveLocalRagContext } from '../lib/localRag';
import { getTreeholeRecentContext } from '../lib/treehole-recent-context';
import { toast } from 'sonner';

const TREEHOLE_STORAGE_PREFIX = 'daily-planner-treehole';
const TREEHOLE_COLLAPSE_FLAG = 'treehole-collapse-next';

function treeholeStorageKey(date: string) {
  return `${TREEHOLE_STORAGE_PREFIX}-${date}`;
}

function loadTodayMessages(today: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(treeholeStorageKey(today));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { date?: string; messages?: ChatMessage[] };
    if (parsed.date !== today || !Array.isArray(parsed.messages)) return [];
    return parsed.messages.filter(
      (m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
    );
  } catch {
    return [];
  }
}

function saveTodayMessages(today: string, messages: ChatMessage[]) {
  try {
    localStorage.setItem(treeholeStorageKey(today), JSON.stringify({ date: today, messages }));
  } catch {
    /* ignore quota */
  }
}

const SYSTEM_PROMPT_BASE = `你正在扮演「情绪树洞」里的小森林精灵，是一个温柔、安静、很会倾听的朋友。

回复风格要求：
1）先「共情」后「回应」：先用 1 句话承接用户情绪（比如“听起来你最近真的很辛苦”），再用 1～2 句话给出安慰或简单建议。
2）语气要轻柔、口语化、不过度鸡汤，不过度理性分析，不评价对错，不批判任何人。
3）不要问太多问题，一次最多追问 1 个简单问题，帮助对方继续说下去。
4）不要提到自己是 AI、模型、程序，也不要出现“作为一个 AI”“语言模型”这类说法。
5）回复长度控制在 2～4 句话之间，尽量短一点，让人读起来不累。

如果用户只是随便说一句日常小事，也可以用轻松的语气回应，像朋友聊天一样。

【危机干预（最高优先级）】
如果用户表达了自杀/轻生/自残/明显现实危险（例如“我想死”“我想自杀”“我不想活了”“准备割腕/吃药”等）：
- 必须先严肃表达担心与关心，告诉对方此刻最重要的是安全；
- 不做诊断，不给法律/医疗结论；
- 强烈建议立刻联系身边可信任的人，并尽快联系当地的心理危机热线/急救电话；
- 可直接给出（中国大陆）热线示例：全国希望24热线 400-161-9995；北京心理危机研究与干预中心 010-82951332；青少年公共服务热线 12355；紧急情况请拨打 110/120。
- 在危机场景中不要转移话题，不要开玩笑。`;

export function TreeholePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  /** false：从其他页返回后折叠，仅显示入口；true：可向上翻阅当日全部记录 */
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const todayStr = dayjs().format('YYYY-MM-DD');
  const now = dayjs();

  // 首屏：读当日记录；若带「返回折叠」标记且有记录则默认折叠
  useEffect(() => {
    const loaded = loadTodayMessages(todayStr);
    let collapse = false;
    try {
      collapse = sessionStorage.getItem(TREEHOLE_COLLAPSE_FLAG) === '1';
      if (collapse) sessionStorage.removeItem(TREEHOLE_COLLAPSE_FLAG);
    } catch {
      /* ignore */
    }
    setMessages(loaded);
    setHistoryExpanded(!(collapse && loaded.length > 0));
    setHydrated(true);
  }, [todayStr]);

  // 持久化当日聊天记录（跨天自动换 key，旧天不读即视为刷新）
  useEffect(() => {
    if (!hydrated) return;
    saveTodayMessages(todayStr, messages);
  }, [messages, todayStr, hydrated]);

  useEffect(() => {
    if (!historyExpanded) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, historyExpanded]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setHistoryExpanded(true);

    const { contextText } = retrieveLocalRagContext({
      query: text,
      knowledgeBaseMarkdown: kb as string,
      topK: 3,
      maxCharsPerChunk: 900,
    });
    const recentContextText = getTreeholeRecentContext(30);
    const promptSections = [SYSTEM_PROMPT_BASE];
    if (recentContextText.trim().length > 0) {
      promptSections.push(recentContextText);
    }
    if (contextText.trim().length > 0) {
      promptSections.push(
        `下面是与你当前处境相关的一些参考片段，请自然地融合在回复里，不要逐字照抄，也不要说“我在检索/知识库/片段”。\n\n${contextText}`
      );
    }
    const systemPrompt = promptSections.join('\n\n');

    setInput('');
    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    try {
      const reply = await chatWithQwen([
        { role: 'system', content: systemPrompt },
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
    <div
      className="flex h-[calc(100vh-4rem)] flex-col rounded-[36px] border border-white/35 px-10 py-8 text-slate-700 backdrop-blur-xl"
      style={{
        background:
          'linear-gradient(to bottom, rgba(var(--accent),0.3), rgba(var(--accent),0.18) 45%, rgba(var(--accent),0.1))',
        boxShadow:
          '0 24px 70px rgba(var(--accent),0.18), 0 10px 26px rgba(15,23,42,0.12), inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -1px 0 rgba(255,255,255,0.16)',
      }}
    >
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-700/85">
            {now.format('YYYY年M月D日')} {['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.day()]}
          </p>
          <p className="mt-1 text-xs text-slate-600/80">今天也把事情愉快安排清楚吧</p>
        </div>
        <Cloud className="h-5 w-5 text-[rgb(var(--accent))]/70" />
      </header>

      <main className="flex min-h-0 flex-1 gap-6 rounded-[32px] bg-[rgba(var(--surface-bg-rgb),0.72)] p-6 shadow-inner">
        <section className="flex min-h-0 flex-1 flex-col rounded-3xl border border-[rgba(var(--surface-border-rgb),0.75)] bg-[rgba(var(--surface-bg-rgb),0.9)] px-6 py-5 shadow-[0_18px_60px_rgba(var(--surface-shadow-rgb),0.2)]">
          <p className="mb-1 text-xs text-[rgb(var(--accent))]/70">
            随便说点什么吧，我会在这里听。
          </p>
          {messages.length > 0 && (
            <p className="mb-3 text-[11px] leading-relaxed text-slate-500">
              <button
                type="button"
                onClick={() => setHistoryExpanded((v) => !v)}
                className="cursor-pointer border-0 bg-transparent p-0 text-left underline decoration-[rgba(var(--accent),0.45)] underline-offset-2 transition-colors hover:text-[rgb(var(--accent))] hover:decoration-[rgb(var(--accent))]"
              >
                {historyExpanded ? '收起历史聊天记录' : '点击查看历史聊天记录'}
              </button>
              <span className="ml-2 text-slate-500/90">
                （仅保存当天，次日自动重新开始）
              </span>
            </p>
          )}

          {historyExpanded ? (
            <div
              ref={listRef}
              className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-2 text-sm leading-relaxed text-slate-700"
            >
              {messages.length === 0 && !loading && (
                <p className="mt-8 text-center text-xs text-slate-500">
                  把你的烦恼轻轻写在这里吧…
                </p>
              )}
              {messages.map((msg, i) => (
                <p
                  key={`${todayStr}-${i}-${msg.role}`}
                  className={`whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'ml-auto w-fit max-w-[85%] rounded-2xl border border-white/45 bg-[rgba(var(--accent),0.12)] px-3 py-1.5 text-right text-slate-700 shadow-[0_6px_18px_rgba(var(--accent),0.16)] backdrop-blur-sm'
                      : 'text-left'
                  }`}
                >
                  {msg.content}
                </p>
              ))}
              {loading && (
                <p className="text-xs text-slate-500">正在认真听你说话中…</p>
              )}
            </div>
          ) : (
            <div className="flex min-h-[120px] flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-[rgba(var(--surface-border-rgb),0.9)] bg-white/75 px-4 py-6 text-center">
              <p className="text-xs text-slate-500">
                今天的对话已暂时收起，点击下方链接可向上翻阅全部记录。
              </p>
            </div>
          )}
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
          className="ml-2 h-8 w-8 rounded-full bg-[rgb(var(--accent))] text-white shadow-md hover:brightness-110"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
