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
    <Card className="overflow-hidden transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-950/10">
      <Link href={`/games/${game.id}`} className="block">
        <GameCover tags={tags} title={game.title} />
        <div className="p-5">
          <div className="mb-3 flex flex-wrap gap-2">
            {tags.slice(0, 4).map((tag) => (
              <Badge key={tag} tone="blue">
                {tag}
              </Badge>
            ))}
          </div>
          <h2 className="text-xl font-semibold text-slate-950">{game.title}</h2>
          <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-slate-600">
            {game.description}
          </p>
          <p className="mt-4 text-xs text-slate-500">
            作者：{game.owner.email}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            发布时间：
            {game.publishedAt ? new Date(game.publishedAt).toLocaleString("zh-CN") : "未发布"}
          </p>
        </div>
      </Link>
      <div className="border-t border-slate-100 p-5 pt-4">
        <GameMetricButtons
          gameId={game.id}
          playCount={game.playCount}
          likeCount={game.likeCount}
          favoriteCount={game.favoriteCount}
          isFavorite={isFavorite}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <ButtonLink href={`/play/${game.id}`}>开始游玩</ButtonLink>
          <ButtonLink href={`/games/${game.id}`} variant="secondary">
            查看详情
          </ButtonLink>
        </div>
      </div>
    </Card>
  );
}
