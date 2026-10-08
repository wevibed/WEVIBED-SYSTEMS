# Status: what is verified and what is not

Last updated: 2026-10-06. Read this before trusting anything in the repo.

## Summary

The shared foundation, client config schema, scaffolding tools, CI workflows and templates 1-3
(retail, hardware, construction) are **written**. Nothing has been built with Vite, linted with the
project's own ESLint setup, or run in GitHub Actions. **No build is claimed to pass.**
The first green GitHub Actions run is what turns "written" into "verified".

## Verified locally (evidence: commands run in the sandbox)

| Check | Result | Limits |
|---|---|---|
| `node --test` (config, logic, tools) | 43 of 43 pass | Tests pure logic, validators, checks. Does not render React |
| `npm run check` (starters + shared source) | clean | Data and asset checks only |
| `npm run check:imports` | pass | Static: imports, named exports, undefined JSX identifiers |
| JSX transpile with bun, every .jsx file | pass | Syntax only, no bundling |
| ESLint (global v10, core rules, `no-undef`) | pass | NOT the repo's config: react and react-hooks plugins were not available |
| Workflow YAML (`ci.yml`, `deploy.yml`) | parses | Never executed by GitHub |
| `new-client` flow in the sandbox | works | Creates folder, placeholders, timer, runs checks |

## NOT verified

| Item | Why | How it becomes verified |
|---|---|---|
| `npm ci` / `npm install` | npm registry blocked in the sandbox. There is no `package-lock.json` yet | CI uploads a lockfile artifact; commit it |
| Vite production build, per template | Needs npm packages | CI `build` step |
| Tailwind output (CSS variables preset, content globs) | Same | CI build, then look at the site |
| ESLint with react and react-hooks rules | Plugins not installable | CI `lint` step |
| Runtime behaviour: routing, cart, search, lightbox, forms | Never rendered in a browser | `npm run dev` locally, then the phone checklist in WORKFLOW.md |
| Contact form `endpoint` mode | Needs a real endpoint | Test with a real Formspree/Web3Forms/Worker URL |
| Cloudflare Pages deploy | No Cloudflare access; workflow never run | First run of Deploy client, with approval |
| `verify-live` against a real site | No deployed site | Run after first deploy |

## Per template

| Template | Written | Starter placeholders | Built in CI | Browser-tested |
|---|---|---|---|---|
| retail | yes | yes | **NO** | **NO** |
| hardware | yes | yes | **NO** | **NO** |
| construction | yes | yes | **NO** | **NO** |
| services, food, beauty, hospitality, automotive, realestate, education | not started | | | |

Per your rule, none of these is "verified" until CI builds it.

## Forms audit (existing repos, inspected via public clone)

- The sassy-family forms are a WhatsApp handoff. They work if the visitor presses send, but nothing is recorded otherwise. Brand names were hardcoded per file.
- Ngenaz Builders and Macrowan Hardware have no contact form.
- New `EnquiryForm`: one shared implementation, business name from config, honeypot and field validation. Default is the WhatsApp handoff (a working alternative that needs no backend). Optional `endpoint` mode posts JSON and falls back to WhatsApp with an honest message on failure. **Endpoint mode is unverified.**

## Access limitations

- `giovannimens-wear` (private): not accessed.
- Cloudflare: no access of any kind. Nothing about the live infrastructure was inspected.
- GitHub push: none. The repo is delivered as a zip, not a git repository.
- npm, PyPI and github.com over HTTPS: blocked from the sandbox. I did not route around this.
- Existing client repos: only read via public clone. Nothing was modified, deployed or migrated.

## Assumptions

- Dependency versions copied from `ngenaz-builders/package-lock.json` (Vite 8.3.2, plugin-react 6.1.1, Tailwind 3.4.19). Declared ranges in `package.json` are `^8.2.0` / `^6.0.5` / `^3.4`. They have never been installed together here.
- Node 22 in CI.
- Each client is deployed to its own Cloudflare Pages project named by `deploy.cloudflareProject`.
- Custom domain DNS is done manually in Cloudflare.

## Unresolved issues and risks

1. First CI run may expose build errors that local checks cannot see (Vite 8 + plugin-react 6 config, Tailwind globs across packages, react-hooks lint rules).
2. No baseline delivery time exists. Use `npm run timing` on the next few sites, starting the clock at `agreed`.
3. `tools/leak-terms.json` must get each new client's name added, or the cross-client leak check will not protect that client.
4. Starter images are labelled placeholders. Real photos are the main remaining per-client effort.
5. `deploy.yml` needs a `production` environment with required reviewers, plus `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets. Use a token scoped to Pages edit only, not a global key.

## Your next steps

1. Create the empty GitHub repo and push the contents of the zip (or send me access when ready).
2. Let CI run. Download the `package-lock` artifact and commit it.
3. Paste or share any failed steps from the Actions summary; I will fix them and repeat until green.
4. Open each template with `npm run dev -- --starter <name>` and look at it on a phone.
5. Only after that: configure the `production` environment and Cloudflare secrets, then deploy a first test client to a new Pages project.
6. Time the next few real clients with `npm run timing`.
7. Then templates 4-6, then 7-10.
