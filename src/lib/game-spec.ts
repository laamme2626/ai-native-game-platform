import { normalizeTags } from "@/lib/tags";
import {
  assertSupportedPrompt,
  GameType,
  hasRuntimeTemplate,
  isSupportedGameType,
  supportedGameTypeValues,
} from "@/lib/game-type-registry";

export type { GameType } from "@/lib/game-type-registry";

export type GameSpec = {
  schemaVersion: 1;
  type: GameType;
  title: string;
  description: string;
  theme: string;
  protagonist: string;
  visualStyle: string;
  playerGoal: string;
  adaptationNotes?: string;
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
  sideBattle?: {
    player?: {
      name?: string;
      maxHp?: number;
      moveSpeed?: number;
      attackDamage?: number;
    };
    enemy?: {
      name?: string;
      maxHp?: number;
      moveSpeed?: number;
      attackDamage?: number;
    };
    controls?: {
      left?: string[];
      right?: string[];
      attack?: string[];
      guard?: string[];
      restart?: string[];
    };
    winCondition?: "enemy_hp_zero";
    loseCondition?: "player_hp_zero";
    sceneTheme?: string;
    playerLabel?: string;
    enemyLabel?: string;
    playerHp?: number;
    enemyHp?: number;
    attackLabel?: string;
    defendLabel?: string;
  };
  runner?: {
    playerLabel: string;
    obstacleLabel: string;
    goalDistance: number;
    speed: number;
  };
  platformer?: {
    playerLabel: string;
    goalLabel: string;
    platformLabel: string;
    goalHeight: number;
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
    tags: ["魔法", "森林", "奇幻", "可爱", "简单", "3 分钟"],
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
    tags: ["赛博", "城市", "未来感", "中等", "3 分钟"],
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
    tags: ["海盗", "宝藏", "冒险", "中等", "5 分钟"],
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
    tags: ["校园", "考试", "解谜", "治愈", "简单", "3 分钟"],
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
    tags: ["太空", "飞船", "科幻", "未来感", "困难", "5 分钟"],
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
  tags: ["悬疑", "中等", "3 分钟"],
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
  return assertSupportedPrompt(prompt).type;
}

function pickPack(prompt: string) {
  const text = prompt.toLowerCase();
  if (/猫|cat|魔法|森林|forest/.test(text)) return packs[0];
  if (/赛博|霓虹|城市|cyber|city|黑客|无人机/.test(text)) return packs[1];
  if (/太空|飞船|space|ship|星舰|宇宙|空间站/.test(text)) return packs[4];
  if (/海盗|宝藏|pirate|treasure|甲板|风暴|藏宝/.test(text)) return packs[2];
  if (/校园|考试|school|exam|图书馆|社团/.test(text)) return packs[3];
  return fallbackPack;
}

function typeTags(type: GameType) {
  if (type === "quiz") return ["问答", "解谜", "中等", "3 分钟"];
  if (type === "clicker") return ["点击", "收集", "轻度动作", "简单", "1 分钟"];
  if (type === "memory") return ["记忆", "配对", "解谜", "简单", "3 分钟"];
  if (type === "dodge") return ["动作", "躲避", "生存", "困难", "1 分钟"];
  if (type === "escape_room") return ["密室逃脱", "逃脱", "解谜", "中等", "5 分钟"];
  if (type === "side_battle") return ["动作", "轻度动作", "冒险", "中等", "3 分钟"];
  if (type === "runner") return ["动作", "轻度动作", "躲避", "简单", "1 分钟"];
  if (type === "platformer") return ["动作", "轻度动作", "冒险", "中等", "3 分钟"];
  return ["互动剧情", "分支选择", "冒险", "3 分钟"];
}

export function generateConstrainedGameSpec(prompt: string): GameSpec {
  const idea = prompt.trim().replace(/\s+/g, " ").slice(0, 500);
  checkPromptSafety(idea);
  const pack = pickPack(idea);
  const detection = assertSupportedPrompt(idea);
  const type = detection.type;
  const base = baseSpec(type, pack, detection.adaptationNotes);
  return {
    ...base,
    tags: normalizeTags([...pack.tags, ...typeTags(type)]),
    quiz: type === "quiz" ? makeQuiz(pack) : undefined,
    clicker: type === "clicker" ? makeClicker(pack) : undefined,
    memory: type === "memory" ? makeMemory(pack) : undefined,
    dodge: type === "dodge" ? makeDodge(pack) : undefined,
    escapeRoom: type === "escape_room" ? makeEscapeRoom(pack) : undefined,
    sideBattle: type === "side_battle" ? makeSideBattle(pack) : undefined,
    runner: type === "runner" ? makeRunner(pack) : undefined,
    platformer: type === "platformer" ? makePlatformer(pack) : undefined,
  };
}

export function normalizeGameSpecForRuntime(spec: GameSpec): GameSpec {
  if (spec.type !== "side_battle") return spec;
  return {
    ...spec,
    sideBattle: normalizeSideBattleConfig(spec),
  };
}

function baseSpec(type: GameType, pack: ThemePack, adaptationNotes?: string): GameSpec {
  return {
    schemaVersion: 1,
    type,
    title: type === "choice_adventure" ? pack.title : `${pack.title}${typeTitle(type)}`,
    description: typeDescription(type, pack),
    theme: pack.key,
    protagonist: pack.protagonist,
    visualStyle: pack.visualStyle,
    playerGoal: pack.goal,
    adaptationNotes,
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
    side_battle: "横屏对战",
    runner: "跑酷挑战",
    platformer: "平台跳跃",
  };
  return names[type];
}

function typeDescription(type: GameType, pack: ThemePack) {
  const sceneLine = pack.scenes.join("、");
  const descriptions: Record<GameType, string> = {
    choice_adventure: `${pack.protagonist}将在${sceneLine}之间做出分支选择，用${pack.items[0]}推动故事走向不同结局。`,
    quiz: `围绕${pack.scenes[0]}到${pack.scenes[2]}的线索答题闯关，答对关键问题才能完成「${pack.goal}」。`,
    clicker: `在限时场地里追逐会移动的${pack.items[0]}，避开干扰物并用${pack.items[1]}打出连击。`,
    memory: `翻开主题卡牌寻找${pack.items[0]}、${pack.items[1]}与${pack.items[2]}的配对线索，在步数耗尽前完成记忆挑战。`,
    dodge: `操控${pack.protagonist}穿过动态障碍，坚持到倒计时结束并守住「${pack.goal}」的最后机会。`,
    escape_room: `调查${pack.scenes[2]}里的多个线索，整理道具关系后输入关键答案解锁出口。`,
    side_battle: `在横屏战斗场地里操控${pack.protagonist}移动、攻击和防御，击败守住${pack.scenes[2]}的对手。`,
    runner: `操控${pack.protagonist}一路奔跑，跳过或避开${pack.items[1]}，到达终点完成「${pack.goal}」。`,
    platformer: `操控${pack.protagonist}在平台之间跳跃，收集${pack.items[0]}并抵达${pack.scenes[2]}。`,
  };
  return descriptions[type];
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
    passScore: 3,
    questions: [
      {
        question: `哪一个道具最能帮助${pack.protagonist}启动冒险？`,
        options: [pack.items[0], "普通石头", "空盒子", "无字便签"],
        answerIndex: 0,
        explanation: `${pack.items[0]}是第一条关键线索。`,
      },
      {
        question: `这局游戏的最终目标是什么？`,
        options: ["原地等待", pack.goal, "放弃挑战", "隐藏所有线索"],
        answerIndex: 1,
        explanation: "目标来自用户创意和主题识别。",
      },
      {
        question: `最后一段挑战主要发生在哪里？`,
        options: [pack.scenes[2], pack.scenes[0], "停车场", "厨房"],
        answerIndex: 0,
        explanation: `${pack.scenes[2]}是最后挑战场景。`,
      },
      {
        question: `哪一个行动最符合当前主题？`,
        options: [pack.choices[2], "关闭页面", "随机猜测", "把道具全部丢掉"],
        answerIndex: 0,
        explanation: `「${pack.choices[2]}」会把道具和目标连接起来。`,
      },
      {
        question: `如果要获得更好的结局，应该重点关注什么？`,
        options: ["只看倒计时", pack.items[2], "忽略同伴", "重复同一个错误"],
        answerIndex: 1,
        explanation: `${pack.items[2]}通常藏着通向结局的补充信息。`,
      },
    ],
  };
}

function makeClicker(pack: ThemePack): NonNullable<GameSpec["clicker"]> {
  return { targetScore: 45, timeLimitSeconds: 30, itemLabel: pack.items[0], bonusLabel: pack.items[1] };
}

function makeMemory(pack: ThemePack): NonNullable<GameSpec["memory"]> {
  return {
    maxMoves: 18,
    cards: [...pack.items, pack.scenes[0]].flatMap((item, index) => [
      { id: `${index}a`, label: item },
      { id: `${index}b`, label: item },
    ]),
  };
}

function makeDodge(pack: ThemePack): NonNullable<GameSpec["dodge"]> {
  return { playerLabel: pack.protagonist, obstacleLabel: pack.items[1], surviveSeconds: 30, speed: pack.key === "space_ship" ? 1.15 : 1 };
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

function makeSideBattle(pack: ThemePack): NonNullable<GameSpec["sideBattle"]> {
  return {
    player: {
      name: pack.key === "cat_forest" ? "小猫骑士" : pack.protagonist,
      maxHp: 100,
      moveSpeed: 260,
      attackDamage: 12,
    },
    enemy: {
      name: pack.key === "cat_forest" ? "史莱姆守卫" : `${pack.items[1]}守卫`,
      maxHp: 120,
      moveSpeed: 110,
      attackDamage: 10,
    },
    controls: {
      left: ["a", "ArrowLeft"],
      right: ["d", "ArrowRight"],
      attack: ["j"],
      guard: ["k"],
      restart: ["r"],
    },
    winCondition: "enemy_hp_zero",
    loseCondition: "player_hp_zero",
    sceneTheme: pack.key === "cat_forest" ? "月光森林" : pack.scenes[0],
  };
}

function makeRunner(pack: ThemePack): NonNullable<GameSpec["runner"]> {
  return {
    playerLabel: pack.protagonist,
    obstacleLabel: pack.items[1],
    goalDistance: 360,
    speed: pack.key === "cyber_city" ? 1.15 : 1,
  };
}

function makePlatformer(pack: ThemePack): NonNullable<GameSpec["platformer"]> {
  return {
    playerLabel: pack.protagonist,
    goalLabel: pack.items[0],
    platformLabel: pack.scenes[1],
    goalHeight: 4,
  };
}

export function validateGameSpec(spec: GameSpec, sourcePrompt = "") {
  const normalizedSpec = normalizeGameSpecForRuntime(spec);
  if (spec.schemaVersion !== 1) throw new Error("不支持的 game_spec 版本");
  if (!spec.title || !spec.description || !spec.type) throw new Error("game_spec 缺少必要元数据");
  if (!isSupportedGameType(spec.type)) throw new Error(`不支持的游戏类型 ${spec.type}`);
  if (!hasRuntimeTemplate(spec.type)) throw new Error(`缺少 runtime template：${spec.type}`);
  if (!spec.playerGoal) throw new Error("game_spec 缺少可玩目标");

  if (spec.type === "choice_adventure") validateChoice(spec);
  if (spec.type === "quiz" && (!spec.quiz || spec.quiz.questions.length < 5)) throw new Error("quiz 至少需要 5 道题");
  if (spec.type === "clicker" && (!spec.clicker || spec.clicker.targetScore <= 0)) throw new Error("clicker 缺少目标分数");
  if (spec.type === "memory" && (!spec.memory || spec.memory.cards.length < 4)) throw new Error("memory 至少需要 4 张卡");
  if (spec.type === "dodge" && (!spec.dodge || spec.dodge.surviveSeconds <= 0)) throw new Error("dodge 缺少生存时间");
  if (spec.type === "escape_room" && (!spec.escapeRoom || spec.escapeRoom.puzzles.length < 1)) throw new Error("escape_room 至少需要 1 个谜题");
  if (spec.type === "side_battle") validateSideBattle(normalizedSpec);
  if (spec.type === "runner" && (!spec.runner || spec.runner.goalDistance <= 0)) throw new Error("runner 缺少跑酷距离");
  if (spec.type === "platformer" && (!spec.platformer || spec.platformer.goalHeight <= 0)) throw new Error("platformer 缺少平台目标");
  validateTypeRuntimeMatch(normalizedSpec, sourcePrompt);
}

export function supportedGameTypePromptText() {
  return supportedGameTypeValues.join("、");
}

function validateTypeRuntimeMatch(spec: GameSpec, sourcePrompt: string) {
  const content = `${sourcePrompt} ${spec.title} ${spec.description} ${spec.playerGoal}`;
  if (spec.type === "dodge" && /(横屏|横版|2d|2D).*(对战|战斗|攻击|防御)|对战|battle|fighter|hp|血量/.test(content)) {
    throw new Error("QA Validator：dodge 类型不能承载横屏对战内容");
  }
  if (spec.type === "dodge" && /(赛车|车辆|race|racing)/i.test(content) && !spec.adaptationNotes) {
    throw new Error("QA Validator：赛车需求降级为 dodge 时必须写 adaptationNotes");
  }
  if (spec.type === "clicker" && /(音游|节奏谱面|rhythm)/i.test(content)) {
    throw new Error("QA Validator：clicker 类型不能承载音游谱面内容");
  }
  if (!JSON.stringify(spec).includes("undefined")) return;
  throw new Error("QA Validator：game_spec 不允许出现 undefined");
}

function validateSideBattle(spec: GameSpec) {
  const cfg = normalizeSideBattleConfig(spec);
  if (!cfg.player.name || !cfg.enemy.name) throw new Error("side_battle 必须包含玩家和敌人名称");
  if (cfg.player.maxHp <= 0 || cfg.enemy.maxHp <= 0) throw new Error("side_battle 必须包含有效 HP");
  if (cfg.player.attackDamage <= 0 || cfg.enemy.attackDamage <= 0) throw new Error("side_battle 必须包含有效攻击伤害");
  if (!cfg.controls.left.length || !cfg.controls.right.length || !cfg.controls.attack.length || !cfg.controls.guard.length) {
    throw new Error("side_battle 必须包含移动、攻击、防御 controls");
  }
}

function normalizeSideBattleConfig(spec: GameSpec) {
  const cfg = spec.sideBattle ?? {};
  const player = cfg.player ?? {};
  const enemy = cfg.enemy ?? {};
  const controls = cfg.controls ?? {};
  return {
    player: {
      name: stringOrFallback(player.name ?? cfg.playerLabel, "玩家"),
      maxHp: positiveNumber(player.maxHp ?? cfg.playerHp, 100),
      moveSpeed: positiveNumber(player.moveSpeed, 260),
      attackDamage: positiveNumber(player.attackDamage, 12),
    },
    enemy: {
      name: stringOrFallback(enemy.name ?? cfg.enemyLabel, "敌人"),
      maxHp: positiveNumber(enemy.maxHp ?? cfg.enemyHp, 120),
      moveSpeed: positiveNumber(enemy.moveSpeed, 110),
      attackDamage: positiveNumber(enemy.attackDamage, 10),
    },
    controls: {
      left: nonEmptyStringArray(controls.left, ["a", "ArrowLeft"]),
      right: nonEmptyStringArray(controls.right, ["d", "ArrowRight"]),
      attack: nonEmptyStringArray(controls.attack, ["j"]),
      guard: nonEmptyStringArray(controls.guard, ["k"]),
      restart: nonEmptyStringArray(controls.restart, ["r"]),
    },
    winCondition: cfg.winCondition ?? "enemy_hp_zero",
    loseCondition: cfg.loseCondition ?? "player_hp_zero",
    sceneTheme: stringOrFallback(cfg.sceneTheme, "训练场"),
  };
}

function stringOrFallback(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function positiveNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

function nonEmptyStringArray(value: unknown, fallback: string[]) {
  return Array.isArray(value) && value.some((item) => typeof item === "string" && item.trim())
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : fallback;
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
    .playfield { position: relative; min-height: 330px; overflow: hidden; border: 1px solid #cbd5e1; border-radius: 12px; background: linear-gradient(135deg, #eff6ff, #f8fafc 52%, #ecfeff); }
    .token { position: absolute; min-width: 92px; min-height: 52px; display: grid; place-items: center; border-radius: 999px; font-weight: 700; box-shadow: 0 12px 28px rgba(15,23,42,.16); transition: transform .12s ease; }
    .token:hover { transform: scale(1.05); }
    .token.target { background: #2563eb; border-color: #2563eb; color: white; }
    .token.bonus { background: #047857; border-color: #047857; color: white; }
    .token.decoy { background: #fff7ed; border-color: #fb923c; color: #9a3412; }
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
      if (spec.type === "side_battle") return renderSideBattle();
      if (spec.type === "runner") return renderRunner();
      if (spec.type === "platformer") return renderPlatformer();
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
      const cfg = spec.clicker; let score = 0, left = cfg.timeLimitSeconds, combo = 1, running = true;
      root.innerHTML = '<div class="panel row"><span>倒计时 <strong id="time">' + left + '</strong> 秒</span><span>分数 <strong id="score">0</strong> / ' + cfg.targetScore + '</span><span>连击 x<strong id="combo">1</strong></span></div><div id="field" class="playfield" aria-label="点击收集场地"></div><p id="feedback" class="meta">点击蓝色目标收集得分，绿色奖励加分，橙色干扰物会扣分并重置连击。</p>';
      const field = document.getElementById("field");
      const timer = setInterval(() => { left--; document.getElementById("time").textContent = left; if (left <= 0) { running = false; clearInterval(timer); end(score >= cfg.targetScore ? '目标达成，收集成功！' : '时间到，分数不足。'); } }, 1000);
      function sync(msg) { document.getElementById("score").textContent = score; document.getElementById("combo").textContent = combo; document.getElementById("feedback").textContent = msg; }
      function place(button) { button.style.left = Math.round(Math.random() * 74 + 3) + '%'; button.style.top = Math.round(Math.random() * 70 + 8) + '%'; }
      function spawn() {
        if (!running) return;
        field.innerHTML = '';
        [
          { kind: 'target', label: cfg.itemLabel, points: combo },
          { kind: 'bonus', label: cfg.bonusLabel, points: combo + 2 },
          { kind: 'decoy', label: '干扰物', points: -4 },
        ].forEach((token) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'token ' + token.kind;
          button.textContent = token.kind === 'decoy' ? token.label : '+' + token.points + ' ' + token.label;
          place(button);
          button.addEventListener('click', () => {
            if (!running) return;
            if (token.points > 0) {
              score += token.points;
              combo = Math.min(6, combo + 1);
              sync('收集到 ' + token.label + '，目标重新出现。');
            } else {
              score = Math.max(0, score + token.points);
              combo = 1;
              sync('点到干扰物，扣 4 分并重置连击。');
            }
            if (score >= cfg.targetScore) { running = false; clearInterval(timer); return end('目标达成，收集成功！'); }
            spawn();
          });
          field.appendChild(button);
        });
      }
      spawn();
    }
    function renderMemory() {
      const cfg = spec.memory; let first = null, lock = false, matched = new Set(), moves = 0;
      const cards = [...cfg.cards].sort(() => Math.random() - 0.5);
      function draw(open = new Set()) {
        root.innerHTML = '<div class="panel">步数 ' + moves + ' / ' + cfg.maxMoves + '　已配对 ' + matched.size + ' / ' + (cards.length / 2) + '</div><div class="card-grid">' + cards.map((card, i) => '<button class="card ' + (matched.has(card.label) ? 'done' : '') + '" data-card="' + i + '">' + (matched.has(card.label) || open.has(i) ? card.label : '？') + '</button>').join('') + '</div>';
        document.querySelectorAll("[data-card]").forEach((button) => button.addEventListener("click", () => pick(Number(button.dataset.card))));
      }
      function pick(i) {
        if (lock || matched.has(cards[i].label) || first === i) return;
        if (first === null) { first = i; draw(new Set([i])); return; }
        moves++; const second = i; const open = new Set([first, second]); draw(open);
        if (cards[first].label === cards[second].label) { matched.add(cards[i].label); first = null; if (matched.size === cards.length / 2) return window.setTimeout(() => end('全部配对成功！'), 350); return window.setTimeout(() => draw(), 350); }
        lock = true; window.setTimeout(() => { first = null; lock = false; if (moves >= cfg.maxMoves) return end('步数用完，再来一次。'); draw(); }, 700);
      }
      draw();
    }
    function renderDodge() {
      const cfg = spec.dodge;
      root.innerHTML = '<div class="panel"><h2>躲避挑战</h2><p class="meta">操控蓝色角色块，躲开从上方落下的 ' + cfg.obstacleLabel + '，坚持 ' + cfg.surviveSeconds + ' 秒获胜。</p><button id="start">开始游戏</button></div><canvas id="canvas" width="760" height="360"></canvas>';
      const canvas = document.getElementById("canvas"), ctx = canvas.getContext("2d"); let x = 360, keys = {}, t = 0, running = false, obstacles = [], lastSpawn = 0;
      addEventListener("keydown", e => keys[e.key] = true); addEventListener("keyup", e => keys[e.key] = false);
      document.getElementById("start").addEventListener("click", () => { running = true; t = 0; obstacles = []; lastSpawn = 0; loop(); });
      function loop() {
        if (!running) return; t += 1/60; const difficulty = 1 + t / cfg.surviveSeconds;
        if (keys.ArrowLeft || keys.a) x -= 5.6; if (keys.ArrowRight || keys.d) x += 5.6; x = Math.max(18, Math.min(706, x));
        if (t - lastSpawn > Math.max(0.38, 1.1 - difficulty * 0.22)) { lastSpawn = t; obstacles.push({x: Math.random()*700+20, y: -24, s: (2.1 + Math.random()*1.4) * difficulty * cfg.speed}); }
        ctx.clearRect(0,0,760,360); ctx.fillStyle="#0f172a"; ctx.fillRect(0,0,760,360);
        ctx.fillStyle="#60a5fa"; ctx.fillRect(x,310,36,36);
        ctx.fillStyle="#fb923c"; let hit = false; obstacles.forEach(o => { o.y += o.s; ctx.fillRect(o.x,o.y,26,26); if (Math.abs(o.x-x)<30 && Math.abs(o.y-310)<30) hit = true; });
        if (hit) { running = false; return end('被障碍击中，挑战失败。'); }
        obstacles = obstacles.filter(o => o.y < 380); ctx.fillStyle="#fff"; ctx.font="16px sans-serif"; ctx.fillText('存活 ' + Math.floor(t) + ' / ' + cfg.surviveSeconds + ' 秒', 18, 28);
        if (t >= cfg.surviveSeconds) { running = false; return end('存活成功，完成挑战！'); }
        requestAnimationFrame(loop);
      }
    }
    function renderEscapeRoom() {
      const room = spec.escapeRoom; let found = new Set();
      function draw(message = '点击房间中的线索，收集足够信息后输入答案。') {
        root.innerHTML = '<h2>' + room.roomName + '</h2><p class="meta">' + message + '</p><div class="card-grid">' + room.clues.map(clue => '<button class="card ' + (found.has(clue.id) ? 'done' : '') + '" data-clue="' + clue.id + '">' + clue.label + '</button>').join('') + '</div><div class="panel"><strong>已发现线索：</strong><span id="inventory">' + (found.size ? room.clues.filter(c => found.has(c.id)).map(c => c.label).join('、') : '暂无') + '</span></div><div class="panel"><input id="answer" placeholder="输入关键物品名称" /><button id="submit">解锁出口</button></div>';
        document.querySelectorAll("[data-clue]").forEach(button => button.addEventListener("click", () => { const clue = room.clues.find(c => c.id === button.dataset.clue); found.add(clue.id); draw(clue.text + ' 已收集线索 ' + found.size + '/' + room.clues.length); }));
        document.getElementById("submit").addEventListener("click", () => { const answer = document.getElementById("answer").value.trim(); const puzzle = room.puzzles[0]; if (found.size < 3) return draw('线索还不够，至少需要找到 3 个线索。'); if (answer === puzzle.answer) end(puzzle.reward); else draw('答案还不对，检查物品栏中的关键线索。'); });
      }
      draw();
    }
    function renderSideBattle() {
      const cfg = normalizeSideBattle(spec.sideBattle);
      root.innerHTML = '<div class="panel"><h2>横屏对战</h2><p class="meta">点击开始后游戏区域会获得焦点。A/D 或方向键移动，J 攻击，K 防御，R 重开。击败 ' + cfg.enemy.name + ' 获胜。</p><div class="row"><button id="start">开始对战</button><button class="secondary" id="restart">重新开始</button><span id="battle-status" class="meta">等待开始</span></div></div><canvas id="canvas" tabindex="0" aria-label="横屏对战游戏区域" width="760" height="360"></canvas>';
      const canvas = document.getElementById("canvas"), ctx = canvas.getContext("2d"), status = document.getElementById("battle-status");
      const keys = {};
      const state = { playerX: 120, enemyX: 600, playerHp: cfg.player.maxHp, enemyHp: cfg.enemy.maxHp, running: false, ended: false, playerCooldown: 0, enemyCooldown: 0, hitFlash: 0, playerFlash: 0, lastTime: 0, message: "点击开始对战" };
      function keyId(value) { return String(value || "").toLowerCase(); }
      function uses(list, key) { return list.map(keyId).includes(keyId(key)); }
      function onKeyDown(e) { keys[keyId(e.key)] = true; if (uses(cfg.controls.restart, e.key)) { e.preventDefault(); reset(true); } if (["arrowleft","arrowright"," ","j","k","r"].includes(keyId(e.key))) e.preventDefault(); }
      function onKeyUp(e) { keys[keyId(e.key)] = false; if (["arrowleft","arrowright"," ","j","k","r"].includes(keyId(e.key))) e.preventDefault(); }
      canvas.addEventListener("keydown", onKeyDown);
      canvas.addEventListener("keyup", onKeyUp);
      canvas.addEventListener("click", () => canvas.focus());
      document.getElementById("start").addEventListener("click", () => reset(true));
      document.getElementById("restart").addEventListener("click", () => reset(true));
      function reset(start) {
        Object.keys(keys).forEach(key => keys[key] = false);
        state.playerX = 120; state.enemyX = 600; state.playerHp = cfg.player.maxHp; state.enemyHp = cfg.enemy.maxHp;
        state.running = !!start; state.ended = false; state.playerCooldown = 0; state.enemyCooldown = 0; state.hitFlash = 0; state.playerFlash = 0; state.lastTime = 0;
        state.message = start ? "战斗中：靠近后按 J 攻击，按 K 防御。" : "点击开始对战";
        canvas.focus(); draw();
        if (start) requestAnimationFrame(loop);
      }
      function isPressed(list) { return list.some(key => keys[keyId(key)]); }
      function hpBar(x, y, w, hp, max, color, label) {
        ctx.fillStyle="#e2e8f0"; ctx.fillRect(x,y,w,16); ctx.fillStyle=color; ctx.fillRect(x,y,Math.max(0,w*hp/max),16); ctx.strokeStyle="#334155"; ctx.strokeRect(x,y,w,16);
        ctx.fillStyle="#0f172a"; ctx.font="14px sans-serif"; ctx.fillText(label + " " + Math.max(0, Math.ceil(hp)) + "/" + max, x, y - 7);
      }
      function fighter(x, label, color, flash, facing) {
        ctx.fillStyle = flash > 0 ? "#fde047" : color; ctx.fillRect(x,238,48,72);
        ctx.fillStyle="#0f172a"; ctx.font="14px sans-serif"; ctx.fillText(label.slice(0,10), Math.max(8, x - 18), 228);
        ctx.fillStyle="#facc15"; ctx.fillRect(facing > 0 ? x + 42 : x - 18, 265, 24, 8);
      }
      function draw() {
        ctx.clearRect(0,0,760,360);
        ctx.fillStyle="#dbeafe"; ctx.fillRect(0,0,760,360);
        ctx.fillStyle="#bfdbfe"; ctx.fillRect(0,58,760,252);
        ctx.fillStyle="#64748b"; ctx.fillRect(0,310,760,18);
        ctx.fillStyle="#1e293b"; ctx.font="16px sans-serif"; ctx.fillText(cfg.sceneTheme, 340, 44);
        hpBar(28,30,230,state.playerHp,cfg.player.maxHp,"#2563eb",cfg.player.name);
        hpBar(502,30,230,state.enemyHp,cfg.enemy.maxHp,"#dc2626",cfg.enemy.name);
        fighter(state.playerX, cfg.player.name, "#2563eb", state.playerFlash, 1);
        fighter(state.enemyX, cfg.enemy.name, "#dc2626", state.hitFlash, -1);
        if (isPressed(cfg.controls.guard) && state.running) { ctx.strokeStyle="#22c55e"; ctx.lineWidth=4; ctx.strokeRect(state.playerX-8,230,64,90); }
        ctx.fillStyle="#0f172a"; ctx.font="15px sans-serif"; ctx.fillText(state.message, 24, 350);
        status.textContent = state.message;
      }
      function finish(message) { state.running = false; state.ended = true; state.message = message + " 按 R 或点击重新开始。"; draw(); }
      function loop(now) {
        if (!state.running || state.ended) return;
        const dt = Math.min(0.033, state.lastTime ? (now - state.lastTime) / 1000 : 0.016); state.lastTime = now;
        const playerDir = (isPressed(cfg.controls.right) ? 1 : 0) - (isPressed(cfg.controls.left) ? 1 : 0);
        state.playerX = Math.max(20, Math.min(692, state.playerX + playerDir * cfg.player.moveSpeed * dt));
        const distance = Math.abs(state.enemyX - state.playerX);
        if (distance > 68) state.enemyX += (state.enemyX > state.playerX ? -1 : 1) * cfg.enemy.moveSpeed * dt;
        state.enemyX = Math.max(20, Math.min(692, state.enemyX));
        state.playerCooldown = Math.max(0, state.playerCooldown - dt); state.enemyCooldown = Math.max(0, state.enemyCooldown - dt);
        state.hitFlash = Math.max(0, state.hitFlash - dt); state.playerFlash = Math.max(0, state.playerFlash - dt);
        if (isPressed(cfg.controls.attack) && state.playerCooldown <= 0) {
          state.playerCooldown = 0.38;
          if (distance < 92) { state.enemyHp = Math.max(0, state.enemyHp - cfg.player.attackDamage); state.enemyX += state.enemyX > state.playerX ? 14 : -14; state.hitFlash = 0.18; state.message = "命中 " + cfg.enemy.name + "，造成 " + cfg.player.attackDamage + " 点伤害。"; }
          else state.message = "攻击落空，靠近敌人再出手。";
        }
        if (state.enemyCooldown <= 0 && distance < 78) {
          state.enemyCooldown = 0.8;
          const guarding = isPressed(cfg.controls.guard);
          const damage = guarding ? Math.ceil(cfg.enemy.attackDamage * 0.35) : cfg.enemy.attackDamage;
          state.playerHp = Math.max(0, state.playerHp - damage); state.playerFlash = 0.18;
          state.message = guarding ? "防御成功，受到 " + damage + " 点伤害。" : cfg.enemy.name + " 命中你，受到 " + damage + " 点伤害。";
        }
        if (state.enemyHp <= 0) return finish("胜利！你击败了 " + cfg.enemy.name + "。");
        if (state.playerHp <= 0) return finish("失败，" + cfg.player.name + " HP 归零。");
        draw(); requestAnimationFrame(loop);
      }
      function normalizeSideBattle(raw) {
        raw = raw || {}; const player = raw.player || {}; const enemy = raw.enemy || {}; const controls = raw.controls || {};
        const text = (value, fallback) => typeof value === "string" && value.trim() ? value.trim() : fallback;
        const num = (value, fallback) => typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
        const arr = (value, fallback) => Array.isArray(value) && value.length ? value : fallback;
        return {
          player: { name: text(player.name || raw.playerLabel, "玩家"), maxHp: num(player.maxHp || raw.playerHp, 100), moveSpeed: num(player.moveSpeed, 260), attackDamage: num(player.attackDamage, 12) },
          enemy: { name: text(enemy.name || raw.enemyLabel, "敌人"), maxHp: num(enemy.maxHp || raw.enemyHp, 120), moveSpeed: num(enemy.moveSpeed, 110), attackDamage: num(enemy.attackDamage, 10) },
          controls: { left: arr(controls.left, ["a","ArrowLeft"]), right: arr(controls.right, ["d","ArrowRight"]), attack: arr(controls.attack, ["j"]), guard: arr(controls.guard, ["k"]), restart: arr(controls.restart, ["r"]) },
          sceneTheme: text(raw.sceneTheme, "训练场")
        };
      }
      reset(false);
    }
    function renderRunner() {
      const cfg = spec.runner;
      root.innerHTML = '<div class="panel"><h2>跑酷挑战</h2><p class="meta">按空格跳跃，避开 ' + cfg.obstacleLabel + '，跑满 ' + cfg.goalDistance + ' 米。</p><button id="start">开始跑酷</button></div><canvas id="canvas" width="760" height="360"></canvas>';
      const canvas = document.getElementById("canvas"), ctx = canvas.getContext("2d");
      let y = 280, vy = 0, distance = 0, running = false, obstacles = [], lastSpawn = 0, keys = {};
      addEventListener("keydown", e => keys[e.key] = true); addEventListener("keyup", e => keys[e.key] = false);
      document.getElementById("start").addEventListener("click", () => { y = 280; vy = 0; distance = 0; obstacles = []; lastSpawn = 0; running = true; loop(); });
      function loop() {
        if (!running) return;
        distance += 1.4 * cfg.speed; lastSpawn += 1;
        if ((keys[" "] || keys.ArrowUp) && y >= 280) vy = -10.5;
        vy += 0.55; y = Math.min(280, y + vy);
        if (lastSpawn > 70) { obstacles.push({x: 780, w: 26 + Math.random()*24}); lastSpawn = 0; }
        ctx.clearRect(0,0,760,360); ctx.fillStyle="#eff6ff"; ctx.fillRect(0,0,760,360); ctx.fillStyle="#334155"; ctx.fillRect(0,318,760,18);
        ctx.fillStyle="#2563eb"; ctx.fillRect(88,y,36,38);
        ctx.fillStyle="#f97316"; let hit = false; obstacles.forEach(o => { o.x -= 5 * cfg.speed; ctx.fillRect(o.x,292,o.w,26); if (o.x < 124 && o.x + o.w > 88 && y + 38 > 292) hit = true; });
        obstacles = obstacles.filter(o => o.x > -80);
        ctx.fillStyle="#0f172a"; ctx.font="16px sans-serif"; ctx.fillText('距离 ' + Math.floor(distance) + ' / ' + cfg.goalDistance + ' 米', 18, 28);
        if (hit) { running = false; return end('撞上障碍，跑酷失败。'); }
        if (distance >= cfg.goalDistance) { running = false; return end('抵达终点，跑酷成功！'); }
        requestAnimationFrame(loop);
      }
    }
    function renderPlatformer() {
      const cfg = spec.platformer;
      root.innerHTML = '<div class="panel"><h2>平台跳跃</h2><p class="meta">A/D 移动，空格跳跃，抵达最高平台收集 ' + cfg.goalLabel + '。</p><button id="start">开始跳跃</button></div><canvas id="canvas" width="760" height="360"></canvas>';
      const canvas = document.getElementById("canvas"), ctx = canvas.getContext("2d");
      const platforms = [{x:40,y:318,w:680},{x:150,y:258,w:140},{x:360,y:206,w:150},{x:560,y:154,w:120},{x:320,y:98,w:150}];
      let x = 70, y = 278, vy = 0, running = false, keys = {};
      addEventListener("keydown", e => keys[e.key.toLowerCase()] = true); addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);
      document.getElementById("start").addEventListener("click", () => { x = 70; y = 278; vy = 0; running = true; loop(); });
      function loop() {
        if (!running) return;
        if (keys.a || keys.arrowleft) x -= 4; if (keys.d || keys.arrowright) x += 4; x = Math.max(0, Math.min(724, x));
        vy += 0.5; y += vy;
        let onGround = false;
        platforms.forEach(p => { if (x + 32 > p.x && x < p.x + p.w && y + 34 >= p.y && y + 34 <= p.y + 16 && vy >= 0) { y = p.y - 34; vy = 0; onGround = true; } });
        if ((keys[" "] || keys.arrowup) && onGround) vy = -10;
        if (y > 380) { running = false; return end('掉出平台，再试一次。'); }
        ctx.clearRect(0,0,760,360); ctx.fillStyle="#f8fafc"; ctx.fillRect(0,0,760,360); ctx.fillStyle="#64748b"; platforms.forEach(p => ctx.fillRect(p.x,p.y,p.w,14));
        ctx.fillStyle="#2563eb"; ctx.fillRect(x,y,32,34); ctx.fillStyle="#facc15"; ctx.fillRect(360,70,34,24);
        ctx.fillStyle="#0f172a"; ctx.font="16px sans-serif"; ctx.fillText('目标：收集 ' + cfg.goalLabel, 18, 28);
        if (x + 32 > 360 && x < 394 && y < 98) { running = false; return end('收集到 ' + cfg.goalLabel + '，平台跳跃成功！'); }
        requestAnimationFrame(loop);
      }
    }
    render();
  </script>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
