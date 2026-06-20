export type GameSpec = {
  schemaVersion: 1;
  title: string;
  description: string;
  theme: string;
  protagonist: string;
  visualStyle: string;
  playerGoal: string;
  tags: string[];
  items: string[];
  stats: {
    name: string;
    min: number;
    max: number;
    initial: number;
  }[];
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
    tags: ["猫咪", "魔法森林", "治愈", "逃脱"],
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
    tags: ["赛博", "城市", "解谜", "未来"],
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
    tags: ["海盗", "宝藏", "冒险", "风暴"],
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
    tags: ["校园", "考试", "谜题", "青春"],
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
    tags: ["太空", "飞船", "科幻", "危机"],
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
  tags: ["互动剧情", "冒险", "AI Native"],
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

function cleanPrompt(prompt: string) {
  return prompt.trim().replace(/\s+/g, " ").slice(0, 500);
}

export function checkPromptSafety(prompt: string) {
  const lowered = prompt.toLowerCase();
  const hit = bannedWords.find((word) => lowered.includes(word.toLowerCase()));
  if (hit) {
    throw new Error(`内容安全检查未通过：包含不适合生成的词语「${hit}」`);
  }
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

function detectEndingCount(prompt: string) {
  const match = prompt.match(/(\d+)\s*(个)?\s*(结局|ending)/i);
  if (!match) return 2;
  return Math.max(1, Math.min(Number(match[1]), 3));
}

export function generateConstrainedGameSpec(prompt: string): GameSpec {
  const idea = cleanPrompt(prompt);
  checkPromptSafety(idea);
  const pack = pickPack(idea);
  const endingCount = detectEndingCount(idea);
  const endings = endingCount === 1 ? [pack.endings[0]] : pack.endings;

  return {
    schemaVersion: 1,
    title: pack.title,
    description: `${pack.protagonist}将在${pack.scenes.join("、")}中完成目标：${pack.goal}。`,
    theme: pack.key,
    protagonist: pack.protagonist,
    visualStyle: pack.visualStyle,
    playerGoal: pack.goal,
    tags: pack.tags,
    items: pack.items,
    stats: [
      { name: "专注", min: 0, max: 10, initial: 5 },
      { name: "勇气", min: 0, max: 10, initial: 5 },
      { name: "体力", min: 0, max: 10, initial: 6 },
    ],
    scenes: [
      {
        id: "start",
        title: pack.scenes[0],
        text: `${pack.protagonist}来到${pack.scenes[0]}。空气里藏着线索，第一个道具「${pack.items[0]}」正在等待被发现。`,
        choices: [
          {
            label: pack.choices[0],
            nextSceneId: "middle",
            effects: { 专注: 2, 体力: -1 },
            item: pack.items[0],
          },
          {
            label: pack.choices[1],
            nextSceneId: "ally",
            effects: { 勇气: 2 },
            item: pack.items[1],
          },
        ],
      },
      {
        id: "middle",
        title: pack.scenes[1],
        text: `${pack.scenes[1]}揭示了真正的规则：只有把「${pack.items[0]}」和「${pack.items[2]}」联系起来，才能接近目标。`,
        choices: [
          {
            label: pack.choices[2],
            nextSceneId: "good_end",
            effects: { 专注: 1, 勇气: 1 },
            item: pack.items[2],
          },
          {
            label: pack.choices[3],
            nextSceneId: endings.length > 1 ? "bittersweet_end" : "good_end",
            effects: { 体力: -2, 勇气: 2 },
          },
        ],
      },
      {
        id: "ally",
        title: `${pack.scenes[1]}的请求`,
        text: `一个意外盟友出现，希望你先信任它，再去${pack.scenes[2]}。这会更快，也更冒险。`,
        choices: [
          {
            label: "接受盟友的捷径",
            nextSceneId: "good_end",
            effects: { 勇气: 2, 体力: -1 },
          },
          {
            label: "保持谨慎，自己验证线索",
            nextSceneId: endings.length > 1 ? "bittersweet_end" : "good_end",
            effects: { 专注: 2, 勇气: -1 },
          },
        ],
      },
      {
        id: "good_end",
        title: "理想结局",
        text: endings[0],
        choices: [],
      },
      {
        id: "bittersweet_end",
        title: "代价结局",
        text: endings[1] ?? endings[0],
        choices: [],
      },
    ],
    endingSceneIds: endings.length > 1 ? ["good_end", "bittersweet_end"] : ["good_end"],
  };
}

export function validateGameSpec(spec: GameSpec) {
  if (spec.schemaVersion !== 1) throw new Error("不支持的 game_spec 版本");
  if (!spec.title || !spec.description) throw new Error("game_spec 缺少标题或简介");
  if (!spec.scenes.some((scene) => scene.id === "start")) {
    throw new Error("game_spec 必须包含 start 场景");
  }
  const sceneIds = new Set(spec.scenes.map((scene) => scene.id));
  for (const scene of spec.scenes) {
    for (const choice of scene.choices) {
      if (!sceneIds.has(choice.nextSceneId)) {
        throw new Error(`选项指向不存在的场景 ${choice.nextSceneId}`);
      }
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
    body {
      margin: 0;
      min-height: 100vh;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #172033;
      background: linear-gradient(135deg, #eef6ff 0%, #fff7ed 48%, #f4f8f3 100%);
      display: grid;
      place-items: center;
      padding: 24px;
    }
    main {
      width: min(900px, 100%);
      background: rgba(255,255,255,0.94);
      border: 1px solid #d8e2ef;
      border-radius: 10px;
      box-shadow: 0 24px 70px rgba(15, 23, 42, 0.14);
      padding: clamp(20px, 4vw, 44px);
    }
    h1, h2, p { margin-top: 0; }
    h1 { font-size: clamp(28px, 5vw, 46px); line-height: 1.08; margin-bottom: 12px; }
    h2 { font-size: clamp(22px, 3vw, 32px); }
    .meta { color: #526174; line-height: 1.7; }
    .asset { margin: 18px 0; padding: 12px; border: 1px dashed #9ab0c9; border-radius: 8px; color: #334155; }
    .stats, .items { display: flex; flex-wrap: wrap; gap: 10px; margin: 20px 0; }
    .stat, .item { border: 1px solid #dbe3ef; background: #f8fafc; border-radius: 8px; padding: 10px 12px; min-width: 104px; }
    .choices { display: grid; gap: 12px; margin-top: 24px; }
    button {
      appearance: none;
      border: 1px solid #2563eb;
      border-radius: 8px;
      background: #2563eb;
      color: white;
      padding: 13px 16px;
      font: inherit;
      cursor: pointer;
      text-align: left;
    }
    button:hover { background: #1d4ed8; }
    .restart { margin-top: 20px; background: white; color: #172033; border-color: #94a3b8; }
  </style>
</head>
<body>
  <main>
    <h1 id="game-title"></h1>
    <p id="game-description" class="meta"></p>
    <div id="asset"></div>
    <section class="items" id="items"></section>
    <section class="stats" id="stats"></section>
    <section id="scene"></section>
  </main>
  <script>
    const payload = ${serialized};
    const spec = payload.spec;
    const assetUrl = payload.assetUrl;
    const stats = Object.fromEntries(spec.stats.map((stat) => [stat.name, stat.initial]));
    const collected = new Set();
    let currentSceneId = "start";

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function renderStats() {
      document.getElementById("stats").innerHTML = spec.stats.map((stat) => {
        const value = stats[stat.name];
        return '<div class="stat"><strong>' + stat.name + '</strong><br />' + value + ' / ' + stat.max + '</div>';
      }).join("");
      document.getElementById("items").innerHTML = spec.items.map((item) => {
        return '<div class="item">' + (collected.has(item) ? '已获得 ' : '未获得 ') + item + '</div>';
      }).join("");
    }

    function applyEffects(choice) {
      for (const [name, delta] of Object.entries(choice.effects || {})) {
        const def = spec.stats.find((stat) => stat.name === name);
        if (def) stats[name] = clamp((stats[name] || 0) + delta, def.min, def.max);
      }
      if (choice.item) collected.add(choice.item);
    }

    function go(choice) {
      applyEffects(choice);
      currentSceneId = choice.nextSceneId;
      render();
    }

    function restart() {
      for (const stat of spec.stats) stats[stat.name] = stat.initial;
      collected.clear();
      currentSceneId = "start";
      render();
    }

    function render() {
      document.getElementById("game-title").textContent = spec.title;
      document.getElementById("game-description").textContent = spec.description + ' 目标：' + spec.playerGoal;
      document.getElementById("asset").innerHTML = assetUrl ? '<div class="asset">本局使用上传素材：' + assetUrl + '</div>' : '';
      renderStats();
      const scene = spec.scenes.find((item) => item.id === currentSceneId);
      const choices = scene.choices.map((choice, index) => '<button data-choice="' + index + '">' + choice.label + '</button>').join("");
      document.getElementById("scene").innerHTML =
        '<h2>' + scene.title + '</h2><p class="meta">' + scene.text + '</p><div class="choices">' + choices + '</div>' +
        (scene.choices.length ? "" : '<button class="restart" data-restart="true">重新开始</button>');
      document.querySelectorAll("[data-choice]").forEach((button) => {
        button.addEventListener("click", () => go(scene.choices[Number(button.dataset.choice)]));
      });
      const restartButton = document.querySelector("[data-restart]");
      if (restartButton) restartButton.addEventListener("click", restart);
    }

    render();
  </script>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
