type RagChunk = {
  title: string;
  content: string;
  keywords: string[];
};

function normalize(s: string) {
  return (s || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[“”‘’"'`]/g, '')
    .trim();
}

function splitQueryTerms(q: string): string[] {
  const n = normalize(q);
  const rough = n
    .split(/[\s,，。；;、/|\\()（）【】\[\]{}<>!?！？:：\-—_]+/g)
    .map((t) => t.trim())
    .filter(Boolean);

  // 对中文做一个轻量补充：把连续中文片段也加入（2-5 字）
  const cnSegments = Array.from(n.matchAll(/[\u4e00-\u9fa5]{2,}/g)).map((m) => m[0]);
  const cnNgrams: string[] = [];
  for (const seg of cnSegments) {
    const maxLen = Math.min(5, seg.length);
    for (let len = 2; len <= maxLen; len++) {
      for (let i = 0; i + len <= seg.length; i++) cnNgrams.push(seg.slice(i, i + len));
    }
  }

  return Array.from(new Set([...rough, ...cnSegments, ...cnNgrams])).slice(0, 80);
}

function parseKnowledgeBase(md: string): RagChunk[] {
  const text = md || '';
  // 以条目为主进行切分；保留条目标题与内容
  const parts = text.split(/^###\s+/m);
  const chunks: RagChunk[] = [];

  for (let i = 1; i < parts.length; i++) {
    const block = parts[i].trim();
    if (!block) continue;
    const lines = block.split('\n');
    const title = lines[0]?.trim() || '未命名条目';
    const content = block;

    const kwLine =
      lines.find((l) => /关键词/.test(l)) ||
      lines.find((l) => /keyword/i.test(l)) ||
      '';
    const keywords = normalize(kwLine)
      .replace(/^-?\s*\*\*?关键词\*?\*?[:：]\s*/i, '')
      .split(/[、，,]/g)
      .map((k) => k.trim())
      .filter(Boolean);

    chunks.push({ title, content, keywords });
  }

  return chunks;
}

export function retrieveLocalRagContext(params: {
  query: string;
  knowledgeBaseMarkdown: string;
  topK?: number;
  maxCharsPerChunk?: number;
}) {
  const { query, knowledgeBaseMarkdown, topK = 3, maxCharsPerChunk = 800 } = params;
  const chunks = parseKnowledgeBase(knowledgeBaseMarkdown);
  const terms = splitQueryTerms(query);
  const qn = normalize(query);

  const scored = chunks
    .map((c) => {
      const hay = normalize(`${c.title}\n${c.keywords.join(',')}\n${c.content}`);
      let score = 0;

      // 关键词命中加权
      for (const kw of c.keywords) {
        if (kw && qn.includes(kw)) score += 8;
      }

      // 常规 term 命中
      for (const t of terms) {
        if (!t || t.length < 2) continue;
        if (hay.includes(t)) score += t.length >= 4 ? 3 : 1;
      }

      // 标题命中加权
      const titleN = normalize(c.title);
      if (titleN && qn && (titleN.includes(qn) || qn.includes(titleN))) score += 6;

      return { c, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  const picked = scored.map(({ c }, idx) => {
    const short = c.content.length > maxCharsPerChunk ? `${c.content.slice(0, maxCharsPerChunk)}…` : c.content;
    return `【片段 ${idx + 1}：${c.title}】\n${short}`;
  });

  return {
    matchedCount: scored.length,
    contextText: picked.join('\n\n'),
  };
}

