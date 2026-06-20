export const tagTaxonomy = [
  {
    group: "类型",
    tags: ["互动剧情", "解谜", "冒险", "逃脱", "生存", "轻度动作"],
  },
  {
    group: "题材",
    tags: ["魔法", "赛博", "校园", "太空", "海盗", "童话", "悬疑"],
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
