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
    ? ["from-slate-950 via-fuchsia-900 to-cyan-500", "霓虹", "CY"]
    : isMagic
      ? ["from-emerald-900 via-lime-500 to-amber-200", "魔法", "MG"]
      : isPirate
        ? ["from-amber-950 via-orange-700 to-sky-300", "宝藏", "TR"]
        : isSpace
          ? ["from-indigo-950 via-blue-800 to-cyan-300", "星舰", "SP"]
          : isSchool
            ? ["from-sky-700 via-blue-200 to-amber-100", "校园", "SC"]
            : isDodge
              ? ["from-slate-900 via-blue-700 to-orange-400", "闪避", "DG"]
              : isQuiz
                ? ["from-violet-950 via-violet-700 to-fuchsia-300", "问答", "QZ"]
                : isClick
                  ? ["from-blue-950 via-blue-600 to-emerald-300", "收集", "CK"]
                  : isMemory
                    ? ["from-indigo-950 via-sky-700 to-amber-200", "记忆", "MM"]
                    : isEscape
                      ? ["from-stone-950 via-slate-700 to-orange-300", "密室", "EX"]
                      : ["from-blue-900 via-indigo-500 to-emerald-300", "AI", "AI"];

  return (
    <div className={`relative aspect-[16/9] overflow-hidden bg-gradient-to-br ${visual[0]}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_20%,rgba(255,255,255,0.42),transparent_20%),radial-gradient(circle_at_82%_20%,rgba(255,255,255,0.18),transparent_24%),linear-gradient(180deg,transparent_30%,rgba(2,6,23,.72))]" />
      <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full border border-white/20 bg-white/10 backdrop-blur-md" />
      <div className="absolute bottom-5 right-5 text-6xl font-black tracking-tighter text-white/18">
        {visual[2]}
      </div>
      <div className="absolute left-4 top-4 rounded-full bg-white/18 px-3 py-1 text-xs font-black text-white ring-1 ring-white/20 backdrop-blur">
        {visual[1]}
      </div>
      <div className="absolute bottom-4 left-4 right-4">
        <p className="line-clamp-2 text-2xl font-black leading-tight text-white drop-shadow">
          {title}
        </p>
      </div>
    </div>
  );
}
