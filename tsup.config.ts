import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/extension.ts"],
    outDir: "out",
    sourcemap: "inline",
    external: [/^/],
    noExternal: [/^\./],
    clean: true
});
