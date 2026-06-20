"use client";

import { useState } from "react";

export default function OAuthDemoButtons() {
  const [message, setMessage] = useState("");
  return (
    <section className="mt-5 grid gap-3">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() =>
            setMessage("GitHub 登录 Demo 暂未接入，文档已说明 OAuth 回调和账号绑定设计。")
          }
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 hover:bg-slate-50"
        >
          GitHub 登录
        </button>
        <button
          type="button"
          onClick={() =>
            setMessage("Google 登录 Demo 暂未接入，文档已说明 OAuth 回调和账号绑定设计。")
          }
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 hover:bg-slate-50"
        >
          Google 登录
        </button>
      </div>
      {message ? (
        <p className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          {message}
        </p>
      ) : null}
    </section>
  );
}
