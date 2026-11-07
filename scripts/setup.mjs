import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const MIN_NODE = [20, 9, 0];

const run = (cmd, args) =>
  spawnSync(cmd, args, { cwd: root, encoding: "utf8", shell: false });

const heading = (msg) => console.log(`\n${msg}`);
const ok = (msg) => console.log(`  OK   ${msg}`);
const skip = (msg) => console.log(`  --   ${msg}`);
const warn = (msg) => console.log(`  !!   ${msg}`);

let problems = 0;

heading("Entorno de Node");
// Next.js 16 exige Node 20.9 o superior.
const nodeVersion = process.versions.node.split(".").map(Number);
const tooOld = nodeVersion.some((part, i) => {
  if (part > MIN_NODE[i]) return false;
  return part < MIN_NODE[i];
});

if (tooOld) {
  warn(`Node ${process.versions.node} es demasiado antiguo. Next.js 16 pide 20.9 o superior.`);
  problems += 1;
} else {
  ok(`Node ${process.versions.node}`);
}

heading("Git: plantilla de commits");
// Se usa `--local` a proposito: sin el, git escribiria en la config global del
// usuario si el script se corre fuera de un repositorio.
const git = run("git", ["--version"]);

if (git.status !== 0) {
  warn("git no esta disponible en el PATH. Instala Git y vuelve a correr este script.");
  problems += 1;
} else if (!existsSync(join(root, ".gitmessage"))) {
  warn("No se encontro .gitmessage en la raiz del repositorio.");
  problems += 1;
} else {
  const result = run("git", ["config", "--local", "commit.template", ".gitmessage"]);

  if (result.status === 0) {
    ok("commit.template = .gitmessage");
  } else {
    warn(`No se pudo configurar: ${result.stderr.trim()}`);
    problems += 1;
  }
}

heading("Variables de entorno");
// La aplicacion Next.js vive en frontend/: la plantilla y el .env.local real
// tienen que estar junto a next.config.ts para que Next las lea.
const envExample = join(root, "frontend", ".env.example");
const envLocal = join(root, "frontend", ".env.local");

if (!existsSync(envExample)) {
  warn("No se encontro frontend/.env.example.");
} else if (existsSync(envLocal)) {
  skip("frontend/.env.local ya existe, no se modifica");
} else {
  copyFileSync(envExample, envLocal);
  ok("frontend/.env.local creado desde frontend/.env.example (reemplaza los valores de ejemplo)");
}

// Docker Compose lee sus variables de interpolacion desde el `.env` de la
// RAIZ del repositorio, no desde frontend/.env.local. Sin este archivo,
// `docker compose build` no recibe los valores de Supabase y la imagen sale
// con el proyecto de ejemplo incrustado en el bundle del navegador.
const envRoot = join(root, ".env");

if (!existsSync(envExample)) {
  warn("No se encontro frontend/.env.example, no se puede crear el .env de la raiz.");
} else if (existsSync(envRoot)) {
  skip(".env de la raiz ya existe, no se modifica");
} else {
  copyFileSync(envExample, envRoot);
  ok(".env de la raiz creado desde frontend/.env.example (lo usa docker compose)");
}

heading("Hooks de pre-commit");
const preCommit = run("pre-commit", ["--version"]);

if (preCommit.status !== 0) {
  warn("pre-commit no esta instalado. Para activarlo: pip install pre-commit && pre-commit install");
} else {
  const install = run("pre-commit", ["install"]);

  if (install.status === 0) {
    ok("hooks instalados");
  } else {
    warn(`No se pudieron instalar los hooks: ${install.stderr.trim()}`);
  }
}

console.log();

if (problems > 0) {
  console.log(`Listo con ${problems} aviso(s). Revisa lo marcado arriba.`);
  process.exitCode = 1;
} else {
  console.log("Listo. Puedes commitear con la plantilla activa.");
}
