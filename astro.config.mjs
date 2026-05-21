// @ts-check
import { defineConfig, fontProviders } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

import db from "@astrojs/db";

import react from "@astrojs/react";

import netlify from "@astrojs/netlify";

// https://astro.build/config
export default defineConfig({
  output: "server",
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: { "@": "/src" },
    },
  },

  fonts: [
    // https://docs.astro.build/en/guides/fonts/#using-fontsource
    {
      provider: fontProviders.fontsource(),
      name: "Roboto",
      cssVariable: "--font-roboto",
      weights: ["300 800"],
    },
  ],

  adapter: netlify(),
  integrations: [db(), react()],
});