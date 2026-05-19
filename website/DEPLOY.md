# Deploy GroupPay website to GitHub Pages

This site is a static export from the `website/` folder. It publishes to:

**https://krecony.github.io/slop/**

(Repo name = URL path. If you rename the repo, update `NEXT_PUBLIC_BASE_PATH` in `package.json` → `build:pages` and in `.github/workflows/deploy-website.yml`.)

## What is already configured

- `next.config.ts` — static export (`output: "export"`), `basePath` for GitHub Pages
- `.github/workflows/deploy-website.yml` — builds on push to `main`/`master` and deploys
- Sound and asset paths respect `/slop` base path in production

## Steps you need to do (one time)

### 1. Push this code to GitHub

If you have not pushed yet:

```bash
cd /path/to/slop
git add website/ .github/workflows/deploy-website.yml
git commit -m "Add GitHub Pages deploy for website"
git push origin main
```

Use `master` instead of `main` if that is your default branch.

### 2. Enable GitHub Pages in the repo settings

1. Open **https://github.com/krecony/slop**
2. **Settings** → **Pages** (left sidebar)
3. Under **Build and deployment** → **Source**, choose **GitHub Actions** (not “Deploy from a branch”)
4. Save

### 3. Run the workflow

- After the push, open **Actions** → **Deploy website to GitHub Pages**
- Wait for the green checkmark (first deploy can take 2–5 minutes)
- Open **https://krecony.github.io/slop/**

To redeploy without a code change: **Actions** → workflow → **Run workflow**.

### 4. (Optional) Custom domain

In **Settings → Pages → Custom domain**, add your domain and DNS records at your registrar. GitHub’s docs: https://docs.github.com/en/pages/configuring-a-custom-domain

If you use a custom domain at the **root** (e.g. `grouppay.example.com`), set `NEXT_PUBLIC_BASE_PATH` to empty in the workflow and `build:pages` script, then redeploy.

## Local checks

```bash
cd website
npm run build:pages    # production-like build with /slop base path
npx serve out          # open http://localhost:3000/slop/
```

Normal local dev (no base path):

```bash
npm run dev
```

## Troubleshooting

| Problem | Fix |
|--------|-----|
| 404 on refresh or assets | Confirm Pages source is **GitHub Actions** and `NEXT_PUBLIC_BASE_PATH` matches repo name (`/slop`) |
| Workflow not running | Push must touch `website/**` or the workflow file; or run manually from Actions |
| Blank page | Browser console for 404s; verify `https://krecony.github.io/slop/` (trailing slash is OK) |
| Sounds missing | Ensure `website/public/sounds/*.mp3` are committed and pushed |
