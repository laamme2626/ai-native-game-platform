import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="mx-auto max-w-md px-5 py-12">
      <h1 className="text-3xl font-semibold">Login</h1>
      {params.error ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {params.error}
        </p>
      ) : null}
      <form
        action="/api/auth/login"
        method="post"
        className="mt-6 grid gap-4 rounded-lg border border-slate-200 bg-white p-5"
      >
        <label className="grid gap-2 text-sm font-medium">
          Email
          <input
            name="email"
            type="email"
            required
            className="rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Password
          <input
            name="password"
            type="password"
            required
            className="rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
        <button className="rounded-md bg-slate-900 px-4 py-3 text-white">
          Login
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        No account?{" "}
        <Link href="/register" className="font-medium text-slate-900">
          Register
        </Link>
      </p>
    </main>
  );
}
