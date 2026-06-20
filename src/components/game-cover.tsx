export function GameCover({ tags, title }: { tags: string[]; title: string }) {
  const text = tags.join(",");
  const isCyber = /赛博|城市|未来感/.test(text);
  const isMagic = /魔法|森林|奇幻|童话|可爱/.test(text);
  const isPirate = /海盗|宝藏/.test(text);
  const isSpace = /太空|飞船|科幻/.test(text);
  const isSchool = /校园|考试/.test(text);
  const isDodge = /躲避|动作|生存/.test(text);
  const isQuiz = /问答/.test(text);
  const isClick = /点击|收集/.test(text);
  const isMemory = /记忆|配对/.test(text);
  const isEscape = /密室|逃脱/.test(text);
  const visual = isCyber
    ? ["from-slate-900 via-blue-800 to-cyan-500", "霓虹"]
    : isMagic
      ? ["from-emerald-900 via-teal-700 to-amber-300", "魔法"]
      : isPirate
        ? ["from-amber-900 via-orange-700 to-sky-300", "宝藏"]
        : isSpace
          ? ["from-indigo-950 via-blue-800 to-cyan-300", "星舰"]
          : isSchool
            ? ["from-sky-700 via-blue-300 to-amber-100", "校园"]
            : isDodge
              ? ["from-slate-900 via-blue-700 to-orange-400", "闪避"]
              : isQuiz
                ? ["from-violet-950 via-violet-700 to-fuchsia-300", "问答"]
                : isClick
                  ? ["from-blue-950 via-blue-600 to-emerald-300", "收集"]
                  : isMemory
                    ? ["from-indigo-950 via-sky-700 to-amber-200", "记忆"]
                    : isEscape
                      ? ["from-stone-950 via-slate-700 to-orange-300", "密室"]
                      : ["from-blue-900 via-indigo-600 to-emerald-300", "AI 生成"];

  return (
    <div className={`relative h-36 overflow-hidden bg-gradient-to-br ${visual[0]} sm:h-40`}>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,.08),rgba(15,23,42,.55))]" />
      <div className="absolute right-4 top-4 h-16 w-24 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm" />
      <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-slate-900 shadow-sm ring-1 ring-white/60">
        {visual[1]}
      </div>
      <div className="absolute bottom-4 left-4 right-4">
        <p className="line-clamp-2 text-xl font-black leading-tight text-white drop-shadow-sm">
          {title}
        </p>
      </div>
    </div>
  );
}
