import { spawn, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const parkDir = join(root, ".static-export-park");

const parkedItems = [
  { from: join(root, "src", "app", "api"), name: "api" },
  { from: join(root, "src", "app", "actions"), name: "actions" },
  { from: join(root, "middleware.ts"), name: "middleware.ts" },
];

const productionApi = "https://api-pika.hope-system.app/api";

function run(command, args, extraEnv) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: "inherit",
      shell: true,
      env: { ...process.env, ...extraEnv },
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} saiu com código ${code}`));
    });
  });
}

function movePath(from, to) {
  if (!existsSync(from)) return false;
  if (existsSync(to)) {
    rmSync(to, { recursive: true, force: true });
  }
  mkdirSync(dirname(to), { recursive: true });
  try {
    renameSync(from, to);
    return true;
  } catch {
    const moved = spawnSync(
      "cmd",
      ["/c", "move", "/Y", from, to],
      { stdio: "inherit", windowsHide: true },
    );
    if (moved.status === 0 && existsSync(to) && !existsSync(from)) {
      return true;
    }
    cpSync(from, to, { recursive: true });
    rmSync(from, { recursive: true, force: true });
    return existsSync(to) && !existsSync(from);
  }
}

function parkServerOnlyFiles() {
  mkdirSync(parkDir, { recursive: true });
  for (const item of parkedItems) {
    const dest = join(parkDir, item.name);
    if (!existsSync(item.from)) continue;
    if (!movePath(item.from, dest)) {
      throw new Error(`Não foi possível pausar ${item.name} para o export estático.`);
    }
    console.log(`Pausado para export estático: ${item.name}`);
  }
}

function restoreServerOnlyFiles() {
  if (!existsSync(parkDir)) return;
  for (const item of parkedItems) {
    const dest = join(parkDir, item.name);
    if (!existsSync(dest)) continue;
    if (existsSync(item.from)) continue;
    movePath(dest, item.from);
    console.log(`Reposto: ${item.name}`);
  }
  if (existsSync(parkDir) && readdirSync(parkDir).length === 0) {
    rmSync(parkDir, { recursive: true, force: true });
  }
}

async function main() {
  restoreServerOnlyFiles();
  parkServerOnlyFiles();

  try {
    await run("npx", ["next", "build"], {
      STATIC_EXPORT: "1",
      NEXT_PUBLIC_STATIC_EXPORT: "1",
      NEXT_PUBLIC_API_BASE_URL: productionApi,
      API_BASE_URL: productionApi,
      NODE_ENV: "production",
    });

    const outDir = join(root, "out");
    if (!existsSync(outDir)) {
      throw new Error("A pasta out/ não foi gerada.");
    }

    cpSync(join(root, "scripts", "cpanel", ".htaccess"), join(outDir, ".htaccess"));
    cpSync(join(root, "scripts", "cpanel", "api-proxy.php"), join(outDir, "api-proxy.php"));
    console.log("\nBuild estático pronto em out/");
    console.log(`API online: ${productionApi}`);
    console.log("Envie o conteúdo de out/ para o public_html do cPanel.");
  } finally {
    restoreServerOnlyFiles();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
