export const tagTaxonomy = [
  {
    group: "类型",
    tags: ["互动剧情", "分支选择", "问答", "解谜", "点击", "收集", "记忆", "配对", "动作", "躲避", "密室逃脱", "冒险", "生存", "轻度动作"],
  },
  {
    group: "题材",
    tags: ["魔法", "森林", "奇幻", "赛博", "城市", "校园", "考试", "太空", "飞船", "科幻", "海盗", "宝藏", "童话", "悬疑"],
  },
  {
    group: "风格",
    tags: ["可爱", "黑暗", "治愈", "搞笑", "像素", "未来感"],
  },
  {
    group: "难度",
    tags: ["简单", "中等", "困难"],
  },
  {
    group: "时长",
    tags: ["1 分钟", "3 分钟", "5 分钟"],
  },
];

export const allTaxonomyTags = tagTaxonomy.flatMap((group) => group.tags);

export function normalizeTags(tags: string[]) {
  return Array.from(
    new Set(tags.filter((tag) => allTaxonomyTags.includes(tag))),
  );
}

export function displayTags(tags: string, limit = 6) {
  return tags.split(",").filter(Boolean).slice(0, limit);
}
