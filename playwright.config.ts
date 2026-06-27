import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";

const require = createRequire(import.meta.url);
const reporterPath = require.resolve("executable-stories-playwright/reporter");

// Anchor outputs to the project root. The reporter resolves rawRunPath relative
// to testDir (./tests), so a bare "reports/raw-run.json" lands in tests/reports
// and the `generate` step can't find it. An absolute path keeps raw-run.json
// under ./reports, where `pnpm generate` looks.
const projectRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.story.spec.ts",
  fullyParallel: false,
  workers: 1,
  // Record a video for every test and capture screenshots. The
  // executable-stories reporter persists these and (with featureVideo) promotes
  // the recording into an inline video doc entry — no manual wiring.
  use: {
    video: "on",
    screenshot: "on",
  },
  reporter: [
    ["list"],
    [
      reporterPath,
      {
        // Emit the machine contract; `pnpm generate` turns it into the bundled
        // HTML site (executable-stories format … --asset-mode copy).
        formats: ["markdown"],
        outputDir: join(projectRoot, "reports"),
        outputName: "user-stories",
        rawRunPath: join(projectRoot, "reports/raw-run.json"),
      },
    ],
  ],
});
