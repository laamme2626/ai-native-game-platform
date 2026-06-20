import Link from "next/link";

export function PageShell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  compact = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <section className={`relative mb-7 overflow-hidden rounded-[24px] border border-slate-800 bg-[linear-gradient(135deg,#111827_0%,#1e1b4b_58%,#1d4ed8_100%)] px-5 text-white shadow-xl shadow-slate-900/10 sm:px-8 ${compact ? "py-6" : "py-8 sm:py-10"}`}>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.06),transparent_62%)]" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
              {eyebrow}
            </p>
          ) : null}
          <h1 className={`${compact ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl"} max-w-4xl font-black tracking-tight text-balance`}>
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
    </section>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[24px] border border-white/70 bg-white/88 shadow-[0_18px_55px_rgba(15,23,42,.08)] backdrop-blur-xl ${className}`}>
      {children}
    </section>
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[28px] border border-slate-200/70 bg-white/78 shadow-[0_18px_50px_rgba(59,130,246,.10)] backdrop-blur-xl ${className}`}>
      {children}
    </section>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "blue" | "green" | "orange" | "red" | "purple" | "cyan";
}) {
  const tones = {
    neutral: "border-slate-200 bg-slate-100/90 text-slate-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    red: "border-red-200 bg-red-50 text-red-700",
    purple: "border-violet-200 bg-violet-50 text-violet-700",
    cyan: "border-cyan-200 bg-cyan-50 text-cyan-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-none ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: ButtonVariant;
  className?: string;
}) {
  return (
    <Link href={href} className={`${buttonClass(variant)} ${className}`}>
      {children}
    </Link>
  );
}

export type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost";

export function buttonClass(variant: ButtonVariant = "primary") {
  if (variant === "secondary") {
    return "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-bold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-slate-950";
  }
  if (variant === "outline") {
    return "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-300 bg-transparent px-4 py-2.5 text-center text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white hover:text-slate-950";
  }
  if (variant === "danger") {
    return "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-red-600 px-4 py-2.5 text-center text-sm font-bold text-white shadow-sm shadow-red-200 transition hover:-translate-y-0.5 hover:bg-red-700 hover:text-white";
  }
  if (variant === "ghost") {
    return "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-center text-sm font-bold text-slate-800 transition hover:bg-white hover:text-slate-950";
  }
  return "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-blue-600 px-4 py-2.5 text-center text-sm font-bold text-white shadow-sm shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:text-white";
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="grid place-items-center p-10 text-center">
      <div className="max-w-md">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-lg font-black text-white shadow-lg shadow-blue-200">
          AI
        </div>
        <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </Card>
  );
}

export function LoadingState({ text = "正在加载..." }: { text?: string }) {
  return (
    <Card className="grid min-h-56 place-items-center p-8 text-center">
      <div className="w-full max-w-sm">
        <div className="mx-auto mb-5 h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-lg shadow-blue-200" />
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-blue-500 to-violet-500" />
        </div>
        <p className="text-sm font-medium text-slate-600">{text}</p>
      </div>
    </Card>
  );
}

export function ErrorState({
  title = "加载失败",
  description,
  action,
}: {
  title?: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="border-red-200 bg-red-50/90 p-6">
      <h2 className="text-lg font-bold text-red-800">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-red-700">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  );
}
