import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  integrations: [react()],
  base: "/arcade",
  output: "static",
  build: {
    format: "directory",
  },
});
