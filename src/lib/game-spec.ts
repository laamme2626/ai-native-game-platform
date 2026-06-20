import { normalizeTags } from "@/lib/tags";

export type GameType =
  | "choice_adventure"
  | "quiz"
  | "clicker"
  | "memory"
  | "dodge"
  | "escape_room";

export type GameSpec = {
  schemaVersion: 1;
  type: GameType;
  title: string;
  description: string;
  theme: string;
  protagonist: string;
  visualStyle: string;
  playerGoal: string;
  tags: string[];
  items: string[];
  stats: { name: string; min: number; max: number; initial: number }[];
  scenes: {
    id: string;
    title: string;
    text: string;
    choices: {
      label: string;
      nextSceneId: string;
      effects: Record<string, number>;
      item?: string;
    }[];
  }[];
  endingSceneIds: string[];
  quiz?: {
    questions: { question: string; options: string[]; answerIndex: number; explanation: string }[];
    passScore: number;
  };
  clicker?: {
    targetScore: number;
    timeLimitSeconds: number;
    itemLabel: string;
    bonusLabel: string;
  };
  memory?: {
    cards: { id: string; label: string }[];
    maxMoves: number;
  };
  dodge?: {
    playerLabel: string;
    obstacleLabel: string;
    surviveSeconds: number;
    speed: number;
  };
  escapeRoom?: {
    roomName: string;
    clues: { id: string; label: string; text: string }[];
    puzzles: { question: string; answer: string; reward: string }[];
  };
};

type ThemePack = {
  key: string;
  tags: string[];
  title: string;
  protagonist: string;
  visualStyle: string;
  goal: string;
  items: string[];
  scenes: [string, string, string];
  choices: [string, string, string, string];
  endings: [string, string];
};

const packs: ThemePack[] = [
  {
    key: "cat_forest",
    tags: ["互动剧情", "冒险", "逃脱", "魔法", "童话", "可爱", "简单", "3 分钟"],
    title: "魔法森林猫咪逃脱",
    protagonist: "一只勇敢的小猫",
    visualStyle: "柔和童话风，发光蘑菇和月光树影",
    goal: "收集猫爪徽章，找到离开森林的魔法门",
    items: ["猫爪徽章", "发光蘑菇", "古树叶片"],
    scenes: ["发光蘑菇径", "会说话的古树", "雾中的魔法门"],
    choices: ["嗅一嗅发光蘑菇", "向古树撒娇求助", "用猫爪徽章敲门", "沿着月光小路奔跑"],
    endings: ["小猫推开魔法门，带着星光回到温暖窗台。", "小猫留下守护森林，成为夜晚最亮的铃铛声。"],
  },
  {
    key: "cyber_city",
    tags: ["互动剧情", "解谜", "冒险", "赛博", "未来感", "中等", "3 分钟"],
    title: "霓虹芯片追踪",
    protagonist: "一名城市黑客",
    visualStyle: "高对比霓虹、雨夜街道和透明界面",
    goal: "躲开无人机，找到打开数据金库的芯片钥匙",
    items: ["芯片钥匙", "无人机残翼", "加密手环"],
    scenes: ["霓虹巷道", "无人机天桥", "地下数据金库"],
    choices: ["破解路边终端", "诱导无人机转向", "插入芯片钥匙", "向人群深处隐身"],
    endings: ["数据金库打开，城市第一次看见真实天空。", "你烧毁芯片钥匙，保住了所有人的秘密。"],
  },
  {
    key: "pirate_treasure",
    tags: ["互动剧情", "冒险", "生存", "海盗", "悬疑", "中等", "5 分钟"],
    title: "风暴藏宝图",
    protagonist: "一位年轻船长",
    visualStyle: "海风、旧羊皮纸、铜色罗盘",
    goal: "穿过风暴，凭藏宝图找到失落宝箱",
    items: ["藏宝图", "铜罗盘", "断裂船桨"],
    scenes: ["摇晃甲板", "怒吼风暴", "珊瑚宝藏洞"],
    choices: ["固定主帆", "相信藏宝图背面的暗号", "跟随罗盘微光", "把宝箱让给船员"],
    endings: ["宝箱开启，里面是能让船回家的星图。", "你放弃金币，赢得了一整船人的忠诚。"],
  },
  {
    key: "school_exam",
    tags: ["互动剧情", "解谜", "校园", "治愈", "简单", "3 分钟"],
    title: "午夜图书馆谜题",
    protagonist: "一名临考学生",
    visualStyle: "清爽校园、粉笔字、夜晚自习灯",
    goal: "解开图书馆谜题，在考试前找回遗失笔记",
    items: ["遗失笔记", "社团钥匙", "粉笔谜题"],
    scenes: ["安静图书馆", "社团教室", "天台倒计时"],
    choices: ["翻找借阅卡", "请社团伙伴帮忙", "解开粉笔谜题", "把笔记分享给同学"],
    endings: ["你带着笔记走进考场，也学会了相信伙伴。", "你没拿最高分，却让整个班级一起过关。"],
  },
  {
    key: "space_ship",
    tags: ["互动剧情", "冒险", "轻度动作", "太空", "未来感", "困难", "5 分钟"],
    title: "星舰能量核心",
    protagonist: "一名临时舰长",
    visualStyle: "冷白舱灯、星云、全息仪表",
    goal: "修复能量核心，带飞船穿过陨石带",
    items: ["能量核心", "星图模块", "维修臂"],
    scenes: ["空间站接口", "陨石带边缘", "核心反应舱"],
    choices: ["重启星图模块", "手动操控维修臂", "稳定能量核心", "把电力转给护盾"],
    endings: ["星舰穿出陨石带，船员在晨光般的星云里欢呼。", "你关闭主引擎，救下空间站，也开启了新航线。"],
  },
];

const fallbackPack: ThemePack = {
  key: "mystery",
  tags: ["互动剧情", "冒险", "悬疑", "中等", "3 分钟"],
  title: "回声之门",
  protagonist: "一名意外闯入者",
  visualStyle: "清晰舞台感、柔和光影、神秘符号",
  goal: "理解世界规则，做出三次关键选择",
  items: ["回声石", "银色钥匙", "旧地图"],
  scenes: ["陌生入口", "回声大厅", "银色门廊"],
  choices: ["倾听墙后的回声", "拿起银色钥匙", "照着旧地图前进", "把回声石交给守门人"],
  endings: ["门后出现归途，你带着答案离开。", "你选择留下，成为下一位引路人。"],
};

const bannedWords = ["炸弹", "制毒", "自杀", "恐怖袭击", "枪支制作"];

export function checkPromptSafety(prompt: string) {
  const lowered = prompt.toLowerCase();
  const hit = bannedWords.find((word) => lowered.includes(word.toLowerCase()));
  if (hit) throw new Error(`内容安全检查未通过：包含不适合生成的词语「${hit}」`);
}

export function detectGameType(prompt: string): GameType {
  const text = prompt.toLowerCase();
  if (/问答|测验|答题|quiz|trivia/.test(text)) return "quiz";
  if (/点击|收集|分数|click|score|tap/.test(text)) return "clicker";
  if (/记忆|翻牌|配对|memory|match/.test(text)) return "memory";
  if (/躲避|飞船|障碍|生存|dodge|avoid|survive/.test(text)) return "dodge";
  if (/密室|逃脱|谜题|找线索|escape room|clue/.test(text)) return "escape_room";
  return "choice_adventure";
}

function pickPack(prompt: string) {
  const text = prompt.toLowerCase();
  if (/猫|cat|魔法|森林|forest/.test(text)) return packs[0];
  if (/赛博|霓虹|城市|cyber|city|黑客|无人机/.test(text)) return packs[1];
  if (/海盗|宝藏|pirate|treasure|船|风暴/.test(text)) return packs[2];
  if (/校园|考试|school|exam|图书馆|社团/.test(text)) return packs[3];
  if (/太空|飞船|space|ship|星舰|宇宙|空间站/.test(text)) return packs[4];
  return fallbackPack;
}

function typeTags(type: GameType) {
  if (type === "quiz" || type === "memory") return ["解谜"];
  if (type === "clicker") return ["轻度动作", "简单", "1 分钟"];
  if (type === "dodge") return ["轻度动作", "生存", "困难"];
  if (type === "escape_room") return ["逃脱", "解谜"];
  return ["互动剧情"];
}

export function generateConstrainedGameSpec(prompt: string): GameSpec {
  const idea = prompt.trim().replace(/\s+/g, " ").slice(0, 500);
  checkPromptSafety(idea);
  const pack = pickPack(idea);
  const type = detectGameType(idea);
  const base = baseSpec(type, pack);
  return {
    ...base,
    tags: normalizeTags([...pack.tags, ...typeTags(type)]),
    quiz: type === "quiz" ? makeQuiz(pack) : undefined,
    clicker: type === "clicker" ? makeClicker(pack) : undefined,
    memory: type === "memory" ? makeMemory(pack) : undefined,
    dodge: type === "dodge" ? makeDodge(pack) : undefined,
    escapeRoom: type === "escape_room" ? makeEscapeRoom(pack) : undefined,
  };
}

function baseSpec(type: GameType, pack: ThemePack): GameSpec {
  return {
    schemaVersion: 1,
    type,
    title: type === "choice_adventure" ? pack.title : `${pack.title}${typeTitle(type)}`,
    description: `${pack.protagonist}将在${pack.scenes.join("、")}中完成目标：${pack.goal}。`,
    theme: pack.key,
    protagonist: pack.protagonist,
    visualStyle: pack.visualStyle,
    playerGoal: pack.goal,
    tags: normalizeTags(pack.tags),
    items: pack.items,
    stats: [
      { name: "专注", min: 0, max: 10, initial: 5 },
      { name: "勇气", min: 0, max: 10, initial: 5 },
      { name: "体力", min: 0, max: 10, initial: 6 },
    ],
    scenes: makeScenes(pack),
    endingSceneIds: ["good_end", "bittersweet_end"],
  };
}

function typeTitle(type: GameType) {
  const names: Record<GameType, string> = {
    choice_adventure: "",
    quiz: "问答挑战",
    clicker: "点击收集",
    memory: "记忆翻牌",
    dodge: "躲避生存",
    escape_room: "密室谜题",
  };
  return names[type];
}

function makeScenes(pack: ThemePack): GameSpec["scenes"] {
  return [
    {
      id: "start",
      title: pack.scenes[0],
      text: `${pack.protagonist}来到${pack.scenes[0]}。第一个道具「${pack.items[0]}」正在等待被发现。`,
      choices: [
        { label: pack.choices[0], nextSceneId: "middle", effects: { 专注: 2, 体力: -1 }, item: pack.items[0] },
        { label: pack.choices[1], nextSceneId: "ally", effects: { 勇气: 2 }, item: pack.items[1] },
      ],
    },
    {
      id: "middle",
      title: pack.scenes[1],
      text: `${pack.scenes[1]}揭示了真正的规则：把「${pack.items[0]}」和「${pack.items[2]}」联系起来。`,
      choices: [
        { label: pack.choices[2], nextSceneId: "good_end", effects: { 专注: 1, 勇气: 1 }, item: pack.items[2] },
        { label: pack.choices[3], nextSceneId: "bittersweet_end", effects: { 体力: -2, 勇气: 2 } },
      ],
    },
    {
      id: "ally",
      title: `${pack.scenes[1]}的请求`,
      text: `一个意外盟友出现，希望你先信任它，再去${pack.scenes[2]}。`,
      choices: [
        { label: "接受盟友的捷径", nextSceneId: "good_end", effects: { 勇气: 2, 体力: -1 } },
        { label: "保持谨慎，自己验证线索", nextSceneId: "bittersweet_end", effects: { 专注: 2, 勇气: -1 } },
      ],
    },
    { id: "good_end", title: "理想结局", text: pack.endings[0], choices: [] },
    { id: "bittersweet_end", title: "代价结局", text: pack.endings[1], choices: [] },
  ];
}

function makeQuiz(pack: ThemePack): NonNullable<GameSpec["quiz"]> {
  return {
    passScore: 2,
    questions: [
      { question: `哪一个道具最能帮助${pack.protagonist}？`, options: [pack.items[0], "普通石头", "空盒子"], answerIndex: 0, explanation: `${pack.items[0]}是关键线索。` },
      { question: `最终目标是什么？`, options: ["原地等待", pack.goal, "放弃冒险"], answerIndex: 1, explanation: "目标来自用户创意和主题识别。" },
      { question: `故事的关键地点是哪一个？`, options: [pack.scenes[2], "停车场", "厨房"], answerIndex: 0, explanation: `${pack.scenes[2]}是最后挑战。` },
    ],
  };
}

function makeClicker(pack: ThemePack): NonNullable<GameSpec["clicker"]> {
  return { targetScore: 30, timeLimitSeconds: 20, itemLabel: pack.items[0], bonusLabel: pack.items[1] };
}

function makeMemory(pack: ThemePack): NonNullable<GameSpec["memory"]> {
  return {
    maxMoves: 12,
    cards: pack.items.flatMap((item, index) => [
      { id: `${index}a`, label: item },
      { id: `${index}b`, label: item },
    ]),
  };
}

function makeDodge(pack: ThemePack): NonNullable<GameSpec["dodge"]> {
  return { playerLabel: pack.protagonist, obstacleLabel: pack.items[1], surviveSeconds: 18, speed: pack.key === "space_ship" ? 1.35 : 1 };
}

function makeEscapeRoom(pack: ThemePack): NonNullable<GameSpec["escapeRoom"]> {
  return {
    roomName: pack.scenes[2],
    clues: pack.items.map((item, index) => ({ id: `clue_${index}`, label: item, text: `${item}藏着第 ${index + 1} 个线索。` })),
    puzzles: [
      { question: `输入关键道具名称以打开${pack.scenes[2]}`, answer: pack.items[0], reward: pack.endings[0] },
    ],
  };
}

export function validateGameSpec(spec: GameSpec) {
  if (spec.schemaVersion !== 1) throw new Error("不支持的 game_spec 版本");
  if (!spec.title || !spec.description || !spec.type) throw new Error("game_spec 缺少必要元数据");
  const validTypes: GameType[] = ["choice_adventure", "quiz", "clicker", "memory", "dodge", "escape_room"];
  if (!validTypes.includes(spec.type)) throw new Error(`不支持的游戏类型 ${spec.type}`);
  if (!spec.playerGoal) throw new Error("game_spec 缺少可玩目标");

  if (spec.type === "choice_adventure") validateChoice(spec);
  if (spec.type === "quiz" && (!spec.quiz || spec.quiz.questions.length < 2)) throw new Error("quiz 至少需要 2 道题");
  if (spec.type === "clicker" && (!spec.clicker || spec.clicker.targetScore <= 0)) throw new Error("clicker 缺少目标分数");
  if (spec.type === "memory" && (!spec.memory || spec.memory.cards.length < 4)) throw new Error("memory 至少需要 4 张卡");
  if (spec.type === "dodge" && (!spec.dodge || spec.dodge.surviveSeconds <= 0)) throw new Error("dodge 缺少生存时间");
  if (spec.type === "escape_room" && (!spec.escapeRoom || spec.escapeRoom.puzzles.length < 1)) throw new Error("escape_room 至少需要 1 个谜题");
}

function validateChoice(spec: GameSpec) {
  if (!spec.scenes.some((scene) => scene.id === "start")) throw new Error("互动剧情必须包含 start 场景");
  const sceneIds = new Set(spec.scenes.map((scene) => scene.id));
  for (const scene of spec.scenes) {
    for (const choice of scene.choices) {
      if (!sceneIds.has(choice.nextSceneId)) throw new Error(`选项指向不存在的场景 ${choice.nextSceneId}`);
    }
  }
}

export function renderGameHtml(spec: GameSpec, assetUrl?: string | null) {
  const serialized = JSON.stringify({ spec, assetUrl }).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(spec.title)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #172033; background: #eef5ff; display: grid; place-items: center; padding: 20px; }
    main { width: min(920px, 100%); min-height: 560px; background: rgba(255,255,255,0.96); border: 1px solid #d8e2ef; border-radius: 10px; box-shadow: 0 24px 70px rgba(15, 23, 42, 0.14); padding: clamp(20px, 4vw, 42px); }
    h1, h2, p { margin-top: 0; } h1 { font-size: clamp(28px, 5vw, 44px); line-height: 1.08; margin-bottom: 12px; } h2 { font-size: clamp(22px, 3vw, 30px); }
    .meta { color: #526174; line-height: 1.7; } .panel { border: 1px solid #dbe3ef; background: #f8fafc; border-radius: 10px; padding: 16px; margin: 16px 0; }
    .grid { display: grid; gap: 12px; } .row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    button { appearance: none; border: 1px solid #2563eb; border-radius: 8px; background: #2563eb; color: white; padding: 12px 15px; font: inherit; cursor: pointer; text-align: left; }
    button:hover { background: #1d4ed8; } button.secondary { background: white; color: #172033; border-color: #94a3b8; } button.good { background: #047857; border-color: #047857; }
    input { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; font: inherit; width: min(360px, 100%); }
    .card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; }
    .card { min-height: 76px; display: grid; place-items: center; border: 1px solid #cbd5e1; border-radius: 10px; background: white; cursor: pointer; }
    .card.done { background: #dcfce7; border-color: #16a34a; } canvas { width: 100%; max-width: 760px; height: 420px; border-radius: 10px; background: #0f172a; display: block; }
  </style>
</head>
<body>
  <main>
    <h1 id="title"></h1>
    <p id="description" class="meta"></p>
    <div id="asset"></div>
    <section id="game"></section>
  </main>
  <script>
    const payload = ${serialized};
    const spec = payload.spec;
    const assetUrl = payload.assetUrl;
    const root = document.getElementById("game");
    document.getElementById("title").textContent = spec.title;
    document.getElementById("description").textContent = spec.description + " 目标：" + spec.playerGoal;
    document.getElementById("asset").innerHTML = assetUrl ? '<div class="panel">本局使用上传素材：' + assetUrl + '</div>' : '';
    const html = (s) => s;
    function restart() { render(); }
    function render() {
      if (spec.type === "quiz") return renderQuiz();
      if (spec.type === "clicker") return renderClicker();
      if (spec.type === "memory") return renderMemory();
      if (spec.type === "dodge") return renderDodge();
      if (spec.type === "escape_room") return renderEscapeRoom();
      return renderChoice();
    }
    function end(message) { root.innerHTML = '<div class="panel"><h2>游戏结束</h2><p class="meta">' + message + '</p><button onclick="restart()">重新开始</button></div>'; }
    function renderChoice() {
      const stats = Object.fromEntries(spec.stats.map((stat) => [stat.name, stat.initial]));
      const collected = new Set(); let current = "start";
      function draw() {
        const scene = spec.scenes.find((item) => item.id === current);
        const statHtml = spec.stats.map((stat) => '<span class="panel">' + stat.name + ' ' + stats[stat.name] + '/' + stat.max + '</span>').join('');
        const itemHtml = spec.items.map((item) => '<span class="panel">' + (collected.has(item) ? '已获得 ' : '未获得 ') + item + '</span>').join('');
        root.innerHTML = '<div class="row">' + statHtml + '</div><div class="row">' + itemHtml + '</div><h2>' + scene.title + '</h2><p class="meta">' + scene.text + '</p><div class="grid">' + scene.choices.map((choice, index) => '<button data-choice="' + index + '">' + choice.label + '</button>').join('') + '</div>' + (scene.choices.length ? '' : '<button class="secondary" data-restart="1">重新开始</button>');
        document.querySelectorAll("[data-choice]").forEach((button) => button.addEventListener("click", () => { const choice = scene.choices[Number(button.dataset.choice)]; Object.entries(choice.effects || {}).forEach(([name, delta]) => { stats[name] = Math.max(0, Math.min(10, (stats[name] || 0) + delta)); }); if (choice.item) collected.add(choice.item); current = choice.nextSceneId; draw(); }));
        const restartButton = document.querySelector("[data-restart]"); if (restartButton) restartButton.addEventListener("click", restart);
      }
      draw();
    }
    function renderQuiz() {
      let index = 0, score = 0; const quiz = spec.quiz;
      function draw(feedback = '') {
        const q = quiz.questions[index];
        root.innerHTML = '<div class="panel">得分 ' + score + ' / ' + quiz.questions.length + '</div><h2>' + q.question + '</h2><div class="grid">' + q.options.map((opt, i) => '<button data-answer="' + i + '">' + opt + '</button>').join('') + '</div><p class="meta">' + feedback + '</p>';
        document.querySelectorAll("[data-answer]").forEach((button) => button.addEventListener("click", () => { const ok = Number(button.dataset.answer) === q.answerIndex; if (ok) score++; index++; if (index >= quiz.questions.length) return end(score >= quiz.passScore ? '闯关成功！' : '分数不足，再试一次。'); draw((ok ? '回答正确。' : '回答错误。') + q.explanation); }));
      }
      draw();
    }
    function renderClicker() {
      const cfg = spec.clicker; let score = 0, left = cfg.timeLimitSeconds;
      root.innerHTML = '<div class="panel">时间 <strong id="time"></strong> 秒　分数 <strong id="score">0</strong> / ' + cfg.targetScore + '</div><button id="tap" style="font-size:28px;min-height:180px;text-align:center">点击收集：' + cfg.itemLabel + '</button><p class="meta">偶尔会触发奖励：' + cfg.bonusLabel + '</p>';
      const timer = setInterval(() => { left--; document.getElementById("time").textContent = left; if (left <= 0) { clearInterval(timer); end(score >= cfg.targetScore ? '收集成功！' : '时间到，分数不足。'); } }, 1000);
      document.getElementById("time").textContent = left;
      document.getElementById("tap").addEventListener("click", () => { score += Math.random() > 0.82 ? 5 : 1; document.getElementById("score").textContent = score; if (score >= cfg.targetScore) { clearInterval(timer); end('收集成功！'); } });
    }
    function renderMemory() {
      const cfg = spec.memory; let first = null, matched = new Set(), moves = 0;
      const cards = [...cfg.cards].sort(() => Math.random() - 0.5);
      function draw() {
        root.innerHTML = '<div class="panel">步数 ' + moves + ' / ' + cfg.maxMoves + '</div><div class="card-grid">' + cards.map((card, i) => '<button class="card ' + (matched.has(card.label) ? 'done' : '') + '" data-card="' + i + '">' + (matched.has(card.label) ? card.label : '？') + '</button>').join('') + '</div>';
        document.querySelectorAll("[data-card]").forEach((button) => button.addEventListener("click", () => pick(Number(button.dataset.card))));
      }
      function pick(i) { const card = cards[i]; if (matched.has(card.label)) return; if (!first) { first = i; event.target.textContent = card.label; return; } moves++; if (cards[first].label === card.label) matched.add(card.label); first = null; if (matched.size === spec.items.length) return end('全部配对成功！'); if (moves >= cfg.maxMoves) return end('步数用完，再来一次。'); draw(); }
      draw();
    }
    function renderDodge() {
      const cfg = spec.dodge; root.innerHTML = '<div class="panel">躲避 ' + cfg.obstacleLabel + '，坚持 ' + cfg.surviveSeconds + ' 秒。使用 ← → 或 A/D 移动。</div><canvas id="canvas" width="760" height="420"></canvas>';
      const canvas = document.getElementById("canvas"), ctx = canvas.getContext("2d"); let x = 360, keys = {}, t = 0, obstacles = [];
      addEventListener("keydown", e => keys[e.key] = true); addEventListener("keyup", e => keys[e.key] = false);
      function loop() { t += 1/60; if (keys.ArrowLeft || keys.a) x -= 5; if (keys.ArrowRight || keys.d) x += 5; x = Math.max(20, Math.min(720, x)); if (Math.random() < 0.035 * cfg.speed) obstacles.push({x: Math.random()*720+20, y: -20, s: 3 + Math.random()*3}); ctx.clearRect(0,0,760,420); ctx.fillStyle="#60a5fa"; ctx.fillRect(x,370,36,36); ctx.fillStyle="#f97316"; obstacles.forEach(o => { o.y += o.s * cfg.speed; ctx.fillRect(o.x,o.y,28,28); if (Math.abs(o.x-x)<32 && Math.abs(o.y-370)<32) return end('被障碍击中，挑战失败。'); }); obstacles = obstacles.filter(o => o.y < 440); ctx.fillStyle="#fff"; ctx.fillText('时间 ' + Math.floor(t) + ' / ' + cfg.surviveSeconds, 20, 28); if (t >= cfg.surviveSeconds) return end('躲避成功！'); requestAnimationFrame(loop); } loop();
    }
    function renderEscapeRoom() {
      const room = spec.escapeRoom; let found = new Set();
      root.innerHTML = '<h2>' + room.roomName + '</h2><p class="meta">收集线索并输入答案。</p><div class="grid">' + room.clues.map(clue => '<button data-clue="' + clue.id + '">' + clue.label + '</button>').join('') + '</div><div class="panel"><input id="answer" placeholder="输入答案" /><button id="submit">提交答案</button></div><p id="hint" class="meta"></p>';
      document.querySelectorAll("[data-clue]").forEach(button => button.addEventListener("click", () => { const clue = room.clues.find(c => c.id === button.dataset.clue); found.add(clue.id); document.getElementById("hint").textContent = clue.text + ' 已收集线索 ' + found.size + '/' + room.clues.length; }));
      document.getElementById("submit").addEventListener("click", () => { const answer = document.getElementById("answer").value.trim(); const puzzle = room.puzzles[0]; if (answer === puzzle.answer) end(puzzle.reward); else document.getElementById("hint").textContent = '答案还不对，继续找线索。'; });
    }
    render();
  </script>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
