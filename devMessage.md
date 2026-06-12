Surface-attribute strategy conflict: phase-11 migrated all templates to a generic `data-surface`; meridian kept per-template attrs 
(`data-hearth-surface`/`data-meridian-surface`) via a new `tmpl.surfaceAttr` field. Which do we keep?

❯ 1. Generic data-surface (Recommended)
     Drop meridian's surfaceAttr field; rename Meridian CSS data-meridian-surface→data-surface. Hearth+Lex already migrated. Simpler contract, one file change in meridian
     module.
  2. Per-template surfaceAttr
     Keep meridian's surfaceAttr field on TemplateModule; revert Hearth/Lex CSS back to template-specific attrs. More isolation but more reverts.
  3. Type something.


  The worktrees contain non-source scratch files. How should I handle them in the commits?

❯ 1. Exclude scratch, commit docs
     Skip .devserver.log, screenshot PNG, .claude/settings.local.json. Commit plan/arch docs (nsoPlan.md, phase11aArchitectureGaps.md) + dev*.md changes with code.
  2. Commit only source code
     Commit only src/ + public/ code changes. Leave ALL .md docs, logs, screenshots, settings uncommitted in working tree.
  3. Commit everything
     Commit all changed/untracked files including logs, screenshot, settings.local.json.
  4. Type something.