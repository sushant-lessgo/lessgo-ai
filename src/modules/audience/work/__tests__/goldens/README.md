# Work copy engine — golden artifacts

This directory holds the golden capture artifacts written by
`../captureGoldenWork.test.ts` when it is run with `CAPTURE=1`.

## What lands here (only after an authorized capture run)

- `kundius.home.json` — the strategy JSON + parsed HOME copy JSON captured from a
  real-LLM run off the Kundius fixture.
- `kundius.home.read.txt` — a human-readable rendered-strings dump for the
  founder to READ at the phase-4 quality gate.

## Status: NOT captured yet

No artifact is committed. The golden read is gated on TWO things (plan phase 4):

1. **Founder facts** — `../fixtures/kundiusBrief.ts` currently holds
   REPRESENTATIVE PLACEHOLDER values. The founder must replace them with
   Kundius's real Brief first.
2. **Capture authorization** — the `CAPTURE=1` run hits the live model and costs
   credits, so it is founder-run, not part of `npm run test:run`.

## Running the capture (founder-authorized only)

```bash
CAPTURE=1 npx vitest run captureGoldenWork
```

Without `CAPTURE=1` the capture test SKIPS cleanly (no network, no cost); only
the always-on fixture sanity checks run.
