# executable-stories live demo

A real consumer repo that turns Playwright story tests into a hosted report with
the screenshots and the screen recording bundled in. It doubles as a smoke test
of the published packages.

## The flow

1. `playwright test` runs the story specs in `tests/`. The config records a
   video and screenshots for every test.
2. The `executable-stories-playwright` reporter persists those attachments,
   promotes the recording into an inline video entry (`featureVideo: true`), and
   writes `reports/raw-run.json`.
3. `executable-stories format reports/raw-run.json --format html --asset-mode copy`
   renders the HTML report and copies every referenced screenshot and video into
   `dist/assets/`, rewriting the paths so the site is self-contained.
4. Netlify serves `dist/`.

## Run it locally

```bash
pnpm install
pnpm exec playwright install --with-deps chromium
pnpm build      # test + generate → dist/
pnpm preview    # serve dist/ locally
```

## Go live on Netlify

1. Create a Netlify site and copy its API ID.
2. Create a Netlify personal access token.
3. Add two repository secrets in GitHub: `NETLIFY_AUTH_TOKEN` and
   `NETLIFY_SITE_ID`.
4. Push to `main`. `.github/workflows/deploy.yml` builds the report in CI and
   deploys `dist/`.

## Requires the media-bundling release

`--asset-mode copy` bundles media for the React HTML report as of
`executable-stories-formatters` shipping the fix in
[PR #266](https://github.com/jagreehal/executable-stories/pull/266). On the
currently published `0.17.0` the report still renders, but local screenshot and
video paths are not copied into `dist/`. Bump `executable-stories-formatters` to
the release that contains the fix, then the hosted media resolves.

Verify the first run: after `pnpm build`, open `dist/index.html` and confirm the
screenshot and video load, and that `dist/assets/` holds the copied files.
