export function GameCover({ tags, title }: { tags: string[]; title: string }) {
  const text = tags.join(",");
  const isCyber = /赛博|城市|未来感/.test(text);
  const isMagic = /魔法|森林|奇幻|童话|可爱/.test(text);
  const isPirate = /海盗|宝藏/.test(text);
  const isSpace = /太空|飞船|科幻/.test(text);
  const isSchool = /校园|考试/.test(text);
  const isDodge = /躲避|动作|生存/.test(text);
  const visual = isCyber
    ? ["from-slate-950 via-fuchsia-900 to-cyan-500", "霓虹"]
    : isMagic
      ? ["from-emerald-900 via-lime-500 to-amber-200", "魔法"]
      : isPirate
        ? ["from-amber-950 via-orange-700 to-sky-300", "宝藏"]
        : isSpace
          ? ["from-indigo-950 via-blue-800 to-cyan-300", "星舰"]
          : isSchool
            ? ["from-sky-700 via-blue-200 to-amber-100", "校园"]
            : isDodge
              ? ["from-slate-900 via-blue-700 to-orange-400", "闪避"]
              : ["from-blue-900 via-indigo-500 to-emerald-300", "AI"];

  return (
    <div className={`relative h-40 overflow-hidden bg-gradient-to-br ${visual[0]}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35),transparent_28%),radial-gradient(circle_at_76%_35%,rgba(255,255,255,0.18),transparent_24%)]" />
      <div className="absolute left-4 top-4 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
        {visual[1]}
      </div>
      <div className="absolute bottom-4 left-4 right-4">
        <p className="line-clamp-2 text-xl font-semibold leading-tight text-white drop-shadow">
          {title}
        </p>
      </div>
    </div>
  );
}
