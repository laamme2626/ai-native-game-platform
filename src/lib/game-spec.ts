export type GameSpec = {
  schemaVersion: 1;
  title: string;
  description: string;
  theme: string;
  playerGoal: string;
  stats: {
    name: string;
    min: number;
    max: number;
    initial: number;
  }[];
  scenes: {
    id: string;
    title: string;
    text: string;
    choices: {
      label: string;
      nextSceneId: string;
      effects: Record<string, number>;
    }[];
  }[];
  endingSceneIds: string[];
};

const statNames = ["focus", "trust", "energy"];

function cleanPrompt(prompt: string) {
  return prompt.trim().replace(/\s+/g, " ").slice(0, 180);
}

function titleFromPrompt(prompt: string) {
  const cleaned = cleanPrompt(prompt);
  const words = cleaned.split(" ").filter(Boolean);
  if (words.length <= 5) return cleaned || "Untitled Adventure";
  return words.slice(0, 5).join(" ");
}

export function generateConstrainedGameSpec(prompt: string): GameSpec {
  const idea = cleanPrompt(prompt) || "a mysterious interactive story";
  const title = titleFromPrompt(idea);

  return {
    schemaVersion: 1,
    title,
    description: `An AI-native interactive story about ${idea}.`,
    theme: "interactive fiction",
    playerGoal: "Make three meaningful choices and reach a satisfying ending.",
    stats: statNames.map((name) => ({
      name,
      min: 0,
      max: 10,
      initial: name === "energy" ? 6 : 5,
    })),
    scenes: [
      {
        id: "start",
        title: "Opening Signal",
        text: `You step into ${idea}. The world reacts as if it has been waiting for your first decision.`,
        choices: [
          {
            label: "Observe carefully",
            nextSceneId: "investigate",
            effects: { focus: 2, energy: -1 },
          },
          {
            label: "Trust the first ally you meet",
            nextSceneId: "alliance",
            effects: { trust: 2 },
          },
        ],
      },
      {
        id: "investigate",
        title: "Hidden Pattern",
        text: "Details align into a pattern. One clue points toward a quiet route, another toward immediate action.",
        choices: [
          {
            label: "Follow the quiet route",
            nextSceneId: "resolve",
            effects: { focus: 1, trust: 1 },
          },
          {
            label: "Force the moment open",
            nextSceneId: "costly_win",
            effects: { energy: -2, focus: 1 },
          },
        ],
      },
      {
        id: "alliance",
        title: "Shared Risk",
        text: "Your ally offers a shortcut but asks you to commit before every risk is known.",
        choices: [
          {
            label: "Commit together",
            nextSceneId: "resolve",
            effects: { trust: 2, energy: -1 },
          },
          {
            label: "Keep control alone",
            nextSceneId: "costly_win",
            effects: { trust: -1, focus: 2 },
          },
        ],
      },
      {
        id: "resolve",
        title: "Clean Resolution",
        text: "The world changes because you balanced attention with trust. The ending feels earned.",
        choices: [],
      },
      {
        id: "costly_win",
        title: "Costly Victory",
        text: "You succeed, but the story remembers what it took from you. A future chapter is waiting.",
        choices: [],
      },
    ],
    endingSceneIds: ["resolve", "costly_win"],
  };
}

export function validateGameSpec(spec: GameSpec) {
  if (spec.schemaVersion !== 1) throw new Error("Unsupported spec version");
  if (!spec.title || !spec.description) throw new Error("Spec lacks metadata");
  if (!spec.scenes.some((scene) => scene.id === "start")) {
    throw new Error("Spec requires a start scene");
  }
  const sceneIds = new Set(spec.scenes.map((scene) => scene.id));
  for (const scene of spec.scenes) {
    for (const choice of scene.choices) {
      if (!sceneIds.has(choice.nextSceneId)) {
        throw new Error(`Choice points to missing scene ${choice.nextSceneId}`);
      }
    }
  }
}

export function renderGameHtml(spec: GameSpec) {
  const serialized = JSON.stringify(spec).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(spec.title)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #111827;
      background: #f8fafc;
      display: grid;
      place-items: center;
      padding: 24px;
    }
    main {
      width: min(860px, 100%);
      background: #ffffff;
      border: 1px solid #dbe3ef;
      border-radius: 8px;
      box-shadow: 0 24px 70px rgba(15, 23, 42, 0.12);
      padding: clamp(20px, 4vw, 44px);
    }
    h1, h2, p { margin-top: 0; }
    h1 { font-size: clamp(28px, 5vw, 48px); line-height: 1; }
    h2 { font-size: clamp(22px, 3vw, 32px); }
    .stats { display: flex; flex-wrap: wrap; gap: 10px; margin: 24px 0; }
    .stat { border: 1px solid #dbe3ef; border-radius: 8px; padding: 10px 12px; min-width: 120px; }
    .choices { display: grid; gap: 12px; margin-top: 24px; }
    button {
      appearance: none;
      border: 1px solid #111827;
      border-radius: 8px;
      background: #111827;
      color: white;
      padding: 13px 16px;
      font: inherit;
      cursor: pointer;
      text-align: left;
    }
    button:hover { background: #334155; }
    .restart { margin-top: 20px; background: white; color: #111827; }
  </style>
</head>
<body>
  <main>
    <h1 id="game-title"></h1>
    <p id="game-description"></p>
    <section class="stats" id="stats"></section>
    <section id="scene"></section>
  </main>
  <script>
    const spec = ${serialized};
    const stats = Object.fromEntries(spec.stats.map((stat) => [stat.name, stat.initial]));
    let currentSceneId = "start";

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function renderStats() {
      document.getElementById("stats").innerHTML = spec.stats.map((stat) => {
        const value = stats[stat.name];
        return '<div class="stat"><strong>' + stat.name + '</strong><br />' + value + ' / ' + stat.max + '</div>';
      }).join("");
    }

    function applyEffects(effects) {
      for (const [name, delta] of Object.entries(effects || {})) {
        const def = spec.stats.find((stat) => stat.name === name);
        if (def) stats[name] = clamp((stats[name] || 0) + delta, def.min, def.max);
      }
    }

    function go(choice) {
      applyEffects(choice.effects);
      currentSceneId = choice.nextSceneId;
      render();
    }

    function restart() {
      for (const stat of spec.stats) stats[stat.name] = stat.initial;
      currentSceneId = "start";
      render();
    }

    function render() {
      document.getElementById("game-title").textContent = spec.title;
      document.getElementById("game-description").textContent = spec.description;
      renderStats();
      const scene = spec.scenes.find((item) => item.id === currentSceneId);
      const choices = scene.choices.map((choice, index) => '<button data-choice="' + index + '">' + choice.label + '</button>').join("");
      document.getElementById("scene").innerHTML =
        '<h2>' + scene.title + '</h2><p>' + scene.text + '</p><div class="choices">' + choices + '</div>' +
        (scene.choices.length ? "" : '<button class="restart" data-restart="true">Restart</button>');
      document.querySelectorAll("[data-choice]").forEach((button) => {
        button.addEventListener("click", () => go(scene.choices[Number(button.dataset.choice)]));
      });
      const restartButton = document.querySelector("[data-restart]");
      if (restartButton) restartButton.addEventListener("click", restart);
    }

    render();
  </script>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
