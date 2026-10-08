# Russia Public Health Event Information Monitor

**俄罗斯公共卫生事件公开信息观察站**

A public, open-source information-monitoring website focused on **one specific event**: the
2026 Russia-related "pneumonia of unknown cause / suspected plague" public-health event.

The project collects and structures publicly available information — in Russian, English
and Chinese — from official institutions (WHO, ECDC, Russian authorities), professional
international media, Russian local media, and public social-media sources.

It is designed to help readers quickly understand:

- what has been **confirmed**;
- what has only been **reported**;
- what remains **unconfirmed**;
- where public sources **disagree**;
- what information is still **unknown**;
- what developments are **worth watching next**.

> **Core principle:** help people notice changes in public information faster —
> not make them believe unverified conclusions earlier.

## What this project is NOT

- Not a medical-diagnosis, epidemic-forecasting or public-health decision system.
- It outputs **no disease probabilities, no infection probabilities, no predictions**.
- "Attention level" (L0–L3), "observation phase" (O0–O8) and "evidence confidence"
  (C0–C4) describe the *state of public information*, never the probability of any
  future event. The four status dimensions (phase / level / confidence / freshness)
  are always displayed separately and never merged.
- It does not infer political motives, rank countries or regions, or make group-based
  judgements. Disagreements between sources are shown as-is.

## Audience

The site is not promoted. Reading it requires directly accessing GitHub Pages, which
naturally selects for readers with basic independent-judgment habits and reduces the
risk of content being misread out of context.

## How it works

```
Public sources (RSS / official pages / public APIs)
        ↓  collector            (Python; compliant fetching, per-source failure isolation)
   raw items (append-only JSONL)
        ↓  processor            (normalize → 3-layer dedup → event matching → AI structuring → scoring)
   human review gate            (statuses and ratings are confirmed by maintainers; AI only proposes)
        ↓  generate             (atomic publish; a failed run never damages the previous dataset)
   data/public-data/*.json      (committed to git — full audit trail)
        ↓  frontend build       (React + TypeScript + Vite + Tailwind, data inlined at build time)
   GitHub Pages                 (static hosting; the same JSON is also served at /public-data/)
```

Key auditability properties:

- Every claim on the site traces back to a signal → source → original URL.
- Signals are stored append-only (`data/state/signals.jsonl`); corrections change
  status while preserving history, so readers can see *what was known at the time*.
- Rating changes (phase / level / confidence) are logged with reasons and source ids.

## Repository layout

```
frontend/    React static site (7 pages)
collector/   Python source collectors
processor/   Normalization, dedup, AI structuring, scoring, public-JSON generation
data/        public-data (published JSON), state (append-only stores), history (reference cases)
config/      sources.yaml (source registry), settings.yaml (weights, caps, banned phrases)
skills/      AI-agent maintenance skill (CLI-equivalent, agent-optional)
docs/        Self-hosting guide, data schema
```

Data structures are documented in **[docs/data-schema.md](docs/data-schema.md)**;
contribution guidelines in **[CONTRIBUTING.md](CONTRIBUTING.md)**.

## Local development

Requirements: Node ≥ 20, Python ≥ 3.11 (with [uv](https://docs.astral.sh/uv/)).

```bash
uv sync                     # Python deps (creates .venv)
cd frontend && npm install  # frontend deps
npm run dev                 # dev server at http://localhost:5173
```

Useful commands (see `Makefile` for the full list; every target has a plain-command
equivalent for environments without `make`):

```bash
uv run pytest                              # Python tests
uv run python -m processor.policy_check    # compliance gate (banned-phrase scan, caps, schema)
cd frontend && npm run build               # typecheck + production build
```

## Self-hosting

Anyone can run their own instance: fork the repository, configure secrets, enable
Actions — see **[docs/self-hosting.md](docs/self-hosting.md)**.

## Maintenance skill

`skills/russia-monitor/` contains an AI-agent skill (with plain-CLI equivalents) for
daily maintenance: `collect`, `review`, `update`, `publish`, `audit`, `status`.
See the skill's SKILL.md.

## License

Code is released under the MIT License. Collected content belongs to its original
sources; the site links to and attributes them and claims no ownership.
