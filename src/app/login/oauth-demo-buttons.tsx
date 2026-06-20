"use client";

import { useState } from "react";
import { buttonClass } from "@/components/ui";

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
          className={buttonClass("secondary")}
        >
          GitHub 登录
        </button>
        <button
          type="button"
          onClick={() =>
            setMessage("Google 登录 Demo 暂未接入，文档已说明 OAuth 回调和账号绑定设计。")
          }
          className={buttonClass("secondary")}
        >
          Google 登录
        </button>
      </div>
      {message ? (
        <p className="rounded-2xl border border-blue-200 bg-blue-50 p-3 text-sm font-medium text-blue-800">
          {message}
        </p>
      ) : null}
    </section>
  );
}
