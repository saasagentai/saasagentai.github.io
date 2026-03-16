import { defineConfig, loadEnv } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import { exec } from "node:child_process";
import pino from "pino";

const logger = pino();

const stripAnsi = (str: string) =>
  str.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    ""
  );

const LOG_MESSAGE_BOUNDARY = /\n(?=\[[A-Z][^\]]*\])/g;

const emitLog = (level: "info" | "warn" | "error", rawMessage: string) => {
  const cleaned = stripAnsi(rawMessage).replace(/\r\n/g, "\n");
  const parts = cleaned
    .split(LOG_MESSAGE_BOUNDARY)
    .map((part) => part.trimEnd())
    .filter((part) => part.trim().length > 0);

  if (parts.length === 0) {
    logger[level](cleaned.trimEnd());
    return;
  }

  for (const part of parts) {
    logger[level](part);
  }
};

const customLogger = {
  warnOnce: (msg: string) => emitLog("warn", msg),
  info: (msg: string) => emitLog("info", msg),
  warn: (msg: string) => emitLog("warn", msg),
  error: (msg: string) => emitLog("error", msg),
  hasErrorLogged: () => false,
  clearScreen: () => {},
  hasWarned: false,
};

function watchDependenciesPlugin() {
  return {
    name: "watch-dependencies",
    configureServer(server: any) {
      const filesToWatch = [path.resolve("package.json"), path.resolve("bun.lock")];
      server.watcher.add(filesToWatch);
      server.watcher.on("change", (filePath: string) => {
        if (filesToWatch.includes(filePath)) {
          exec("rm -f .eslintcache tsconfig.tsbuildinfo");
        }
      });
    },
  };
}

export default ({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd());
  return defineConfig({
    base: '/', // این خط برای saasagentai.github.io حیاتی است
    plugins: [
      react(), 
      watchDependenciesPlugin()
    ],
    build: {
      minify: true,
      outDir: 'dist',
      sourcemap: false,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  });
};
