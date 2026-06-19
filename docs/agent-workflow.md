# Agent Workflow

The MVP Agent is deterministic and constrained for reliable two-day delivery.
It does not call an external LLM yet; the boundary is `src/lib/agent.ts` and can
be replaced by a real model call later.

## Steps

1. Load a queued job.
2. Mark it `running`.
3. Write an Agent log with prompt metadata.
4. Generate a constrained `game_spec.json` from the prompt.
5. Validate required schema rules:
   - schema version is `1`
   - metadata exists
   - a `start` scene exists
   - every choice points to an existing scene
6. Render `manifest.json`.
7. Render a single-file HTML interactive story.
8. Save generated files through storage service.
9. Update `Game` URLs and mark the job `succeeded`.

## Generated Files

```text
public/generated/games/{gameId}/game_spec.json
public/generated/games/{gameId}/manifest.json
public/generated/games/{gameId}/index.html
```

## Future LLM Integration

Keep the same validation step. A model should output only the constrained spec,
never arbitrary executable code. The HTML renderer should stay owned by the app
until sandboxing, moderation, and asset scanning are stronger.
