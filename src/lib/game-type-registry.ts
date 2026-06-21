export type GameType =
  | "choice_adventure"
  | "quiz"
  | "clicker"
  | "memory"
  | "dodge"
  | "escape_room"
  | "side_battle"
  | "runner"
  | "platformer";

export type SupportedGameType = {
  type: GameType;
  label: string;
  runtimeTemplate: string;
};

export type UnsupportedGameTypePayload = {
  code: "UNSUPPORTED_GAME_TYPE";
  detectedType: string;
  message: string;
  supportedTypes: string[];
};

export type GameTypeDetection =
  | { supported: true; type: GameType; detectedType: string; adaptationNotes?: string }
  | ({ supported: false } & UnsupportedGameTypePayload);

export class UnsupportedGameTypeError extends Error {
  code = "UNSUPPORTED_GAME_TYPE" as const;
  detectedType: string;
  supportedTypes: string[];

  constructor(payload: UnsupportedGameTypePayload) {
    super(payload.message);
    this.name = "UnsupportedGameTypeError";
    this.detectedType = payload.detectedType;
    this.supportedTypes = payload.supportedTypes;
  }

  toPayload(): UnsupportedGameTypePayload {
    return {
      code: this.code,
      detectedType: this.detectedType,
      message: this.message,
      supportedTypes: this.supportedTypes,
    };
  }
}

export const supportedGameTypes: SupportedGameType[] = [
  { type: "choice_adventure", label: "互动剧情", runtimeTemplate: "choice" },
  { type: "quiz", label: "问答闯关", runtimeTemplate: "quiz" },
  { type: "clicker", label: "点击收集", runtimeTemplate: "clicker" },
  { type: "memory", label: "记忆翻牌", runtimeTemplate: "memory" },
  { type: "dodge", label: "躲避生存", runtimeTemplate: "dodge" },
  { type: "escape_room", label: "密室逃脱", runtimeTemplate: "escape_room" },
  { type: "side_battle", label: "横屏对战", runtimeTemplate: "side_battle" },
  { type: "runner", label: "跑酷", runtimeTemplate: "runner" },
  { type: "platformer", label: "平台跳跃", runtimeTemplate: "platformer" },
];

export const supportedGameTypeLabels = supportedGameTypes.map((item) => item.label);
export const supportedGameTypeValues = supportedGameTypes.map((item) => item.type);

export function isSupportedGameType(type: string): type is GameType {
  return supportedGameTypeValues.includes(type as GameType);
}

export function hasRuntimeTemplate(type: string) {
  return supportedGameTypes.some((item) => item.type === type && item.runtimeTemplate);
}

export function unsupportedGameTypePayload(detectedType: string): UnsupportedGameTypePayload {
  return {
    code: "UNSUPPORTED_GAME_TYPE",
    detectedType,
    message: `当前 Demo 暂不支持「${detectedType}」玩法。`,
    supportedTypes: supportedGameTypeLabels,
  };
}

export function assertSupportedPrompt(prompt: string): Extract<GameTypeDetection, { supported: true }> {
  const detection = detectRequestedGameType(prompt);
  if (!detection.supported) {
    throw new UnsupportedGameTypeError(detection);
  }
  return detection;
}

export function detectRequestedGameType(prompt: string): GameTypeDetection {
  const text = prompt.trim().toLowerCase();
  const unsupportedHits = explicitUnsupportedTypes(text);
  if (unsupportedHits.length > 0) {
    return { supported: false, ...unsupportedGameTypePayload(unsupportedHits.join(" / ")) };
  }

  if (/(横屏|横版|2d|2D).*(对战|战斗|攻击|防御)|对战|battle|fighter|hp|血量|攻击|防御|史莱姆/.test(text)) {
    return { supported: true, type: "side_battle", detectedType: "横屏 2D 对战" };
  }
  if (/问答|测验|答题|quiz|trivia/.test(text)) {
    return { supported: true, type: "quiz", detectedType: "问答闯关" };
  }
  if (/点击|收集|分数|click|score|tap/.test(text)) {
    return { supported: true, type: "clicker", detectedType: "点击收集" };
  }
  if (/记忆|翻牌|配对|memory|match/.test(text)) {
    return { supported: true, type: "memory", detectedType: "记忆翻牌" };
  }
  if (/密室|逃脱|谜题|找线索|escape room|clue/.test(text)) {
    return { supported: true, type: "escape_room", detectedType: "密室逃脱" };
  }
  if (/平台跳跃|platformer|platform/.test(text)) {
    return { supported: true, type: "platformer", detectedType: "平台跳跃" };
  }
  if (/跑酷|横版跑酷|runner|奔跑/.test(text)) {
    return { supported: true, type: "runner", detectedType: "跑酷" };
  }
  if (/赛车.*(躲避|障碍)|躲避.*赛车/.test(text)) {
    return {
      supported: true,
      type: "dodge",
      detectedType: "赛车躲避障碍",
      adaptationNotes: "已将赛车创意降级为轻量躲避生存模板：玩家操控车辆躲避障碍，不包含真实物理、开放地图或车辆改装。",
    };
  }
  if (/躲避|飞船|障碍|生存|dodge|avoid|survive/.test(text)) {
    return { supported: true, type: "dodge", detectedType: "躲避生存" };
  }

  return { supported: true, type: "choice_adventure", detectedType: "互动剧情" };
}

function explicitUnsupportedTypes(text: string) {
  const hits: string[] = [];
  const rules: { label: string; pattern: RegExp }[] = [
    { label: "3D 开放世界", pattern: /3d|3D|开放世界|open world/ },
    { label: "多人在线 MMO", pattern: /多人在线|多人匹配|mmo|MMO|online multiplayer|massively multiplayer/ },
    { label: "复杂 RTS", pattern: /复杂.*rts|即时战略|rts|RTS|基地建设.*战斗/ },
    { label: "大型赛车模拟", pattern: /大型赛车|赛车模拟|真实物理|车辆改装|开放地图.*赛车/ },
    { label: "音游节奏谱面", pattern: /音游|节奏谱面|谱面|rhythm game|music game/ },
    { label: "卡牌构筑战斗", pattern: /卡牌构筑|构筑卡组|deckbuilding|deck-building/ },
    { label: "沙盒建造", pattern: /沙盒建造|sandbox|自由建造/ },
    { label: "复杂经营模拟", pattern: /复杂经营|经营模拟|management sim|tycoon/ },
  ];

  for (const rule of rules) {
    if (rule.pattern.test(text)) hits.push(rule.label);
  }
  return hits;
}
