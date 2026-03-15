const QUOTES = [
  '把今天过好，明天不会差。',
  '小步快跑，持续迭代。',
  '完成比完美更重要。',
  '先做最难的那件事。',
  '专注当下，一件一件来。',
  '少即是多，做少但做透。',
  '今天的一小步，是明天的一大步。',
  '计划你的工作，执行你的计划。',
  '清空待办，才能轻装前行。',
  '把大目标拆成小任务，就不难了。',
  '每天进步 1%，一年后是 37 倍。',
  '行动是治愈拖延的良药。',
  '少想多做，结果会说话。',
  '今日事今日毕。',
  '专注 25 分钟，休息 5 分钟。',
  '写下它，就更容易完成它。',
  '优先级不是「都重要」，而是「先做谁」。',
  '完成一项，再开始下一项。',
  '休息好，才能跑得远。',
  '小事做完，心里就静了。',
];

export function getDailyQuote(): string {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const diff = Date.now() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return QUOTES[dayOfYear % QUOTES.length];
}
