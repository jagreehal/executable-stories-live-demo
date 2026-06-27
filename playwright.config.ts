import { createRequire } from "node:module";
import { defineConfig } from "@playwright/test";

const require = createRequire(import.meta.url);
const reporterPath = require.resolve("executable-stories-playwright/reporter");

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
        outputDir: "reports",
        outputName: "user-stories",
        rawRunPath: "reports/raw-run.json",
      },
    ],
  ],
});
