import Link from "next/link";
import GameMetricButtons from "@/components/game-metric-buttons";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { displayTags } from "@/lib/tags";
import { GameCover } from "@/components/game-cover";

type GameCardData = {
  id: string;
  title: string;
  description: string;
  tags: string;
  playCount: number;
  likeCount: number;
  favoriteCount: number;
  publishedAt: Date | null;
  owner: { email: string };
};

export function GameCard({
  game,
  isFavorite = false,
}: {
  game: GameCardData;
  isFavorite?: boolean;
}) {
  const tags = displayTags(game.tags, 5);

  return (
    <Card className="group overflow-hidden bg-slate-950 text-white transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-950/20">
      <Link href={`/games/${game.id}`} className="block">
        <GameCover tags={tags} title={game.title} />
        <div className="p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap gap-2">
            {tags.slice(0, 4).map((tag, index) => (
              <Badge key={tag} tone={index === 0 ? "cyan" : "neutral"}>
                {tag}
              </Badge>
            ))}
          </div>
          <h2 className="line-clamp-1 text-xl font-black tracking-tight text-white">
            {game.title}
          </h2>
          <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-slate-300">
            {game.description}
          </p>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs text-slate-400">
            <span className="truncate">作者：{game.owner.email}</span>
            <span className="shrink-0">
              {game.publishedAt ? new Date(game.publishedAt).toLocaleDateString("zh-CN") : "未发布"}
            </span>
          </div>
        </div>
      </Link>
      <div className="border-t border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <GameMetricButtons
          gameId={game.id}
          playCount={game.playCount}
          likeCount={game.likeCount}
          favoriteCount={game.favoriteCount}
          isFavorite={isFavorite}
          dark
        />
        <div className="mt-4 grid grid-cols-2 gap-2">
          <ButtonLink href={`/play/${game.id}`} className="w-full">
            开始游玩
          </ButtonLink>
          <ButtonLink href={`/games/${game.id}`} variant="secondary" className="w-full border-white/15 bg-white/10 text-white hover:bg-white/15">
            详情
          </ButtonLink>
        </div>
      </div>
    </Card>
  );
}
