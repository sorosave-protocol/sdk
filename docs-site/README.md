# docs-site

This directory tracks the documentation site setup for GitHub Pages deployment.

## Source of truth

- Documentation content lives in `/docs`.
- VitePress configuration lives in `/docs/.vitepress/config.mjs`.
- CI/CD deployment is handled by `/.github/workflows/docs.yml`.

## Local commands

From repository root:

```bash
pnpm --dir docs install
pnpm --dir docs docs:dev
pnpm --dir docs docs:build
```

The production build output is generated at:

```text
docs/.vitepress/dist
```
