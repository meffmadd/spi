/**
 * pi-spi extension — installs the sandboxed pi Docker CLI
 *
 * Commands:
 *   /spi init    — write default compose + symlink spi.sh to ~/.local/bin/spi
 *   /spi remove  — remove compose + symlink
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
  existsSync,
  mkdirSync,
  symlinkSync,
  unlinkSync,
  chmodSync,
  writeFileSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

// ── Paths ──────────────────────────────────────────────────────────

const HOME = homedir();
const COMPOSE_PATH = join(HOME, ".pi", "spi-compose.yaml");
const LOCAL_BIN_DIR = join(HOME, ".local", "bin");
const SPI_LINK = join(LOCAL_BIN_DIR, "spi");

// Resolve the install path of this package so we can symlink to bin/spi.sh.
// Works both when tested with `-e` and when installed via `pi install`.
const EXTENSION_DIR = dirname(fileURLToPath(import.meta.url));
const SPI_SH_SOURCE = join(EXTENSION_DIR, "..", "bin", "spi.sh");

// ── Templates ──────────────────────────────────────────────────────

function composeContent(): string {
  return `services:
  pi:
    image: ghcr.io/meffmadd/pi-agent-runtime:latest
    volumes:
      - \${PWD}:/workspace
      - \${HOME}/.pi:/root/.pi
    stdin_open: true
    tty: true
`;
}

// ── Helpers ────────────────────────────────────────────────────────

function ensureDir(path: string): void {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

function pathInPath(dir: string): boolean {
  const pathEnv = process.env.PATH ?? "";
  return pathEnv.split(":").includes(dir);
}

// ── /spi init ──────────────────────────────────────────────────────

async function spiInit(ctx: import("@earendil-works/pi-coding-agent").ExtensionCommandContext) {
  const lines: string[] = [];

  // 1. Write default compose
  if (existsSync(COMPOSE_PATH)) {
    lines.push(`Compose file already exists: ${COMPOSE_PATH}`);
  } else {
    ensureDir(join(HOME, ".pi"));
    writeFileSync(COMPOSE_PATH, composeContent(), { mode: 0o644 });
    lines.push(`Wrote: ${COMPOSE_PATH}`);
  }

  // 2. Symlink spi.sh
  if (existsSync(SPI_LINK)) {
    lines.push(`spi symlink already exists: ${SPI_LINK}`);
  } else {
    ensureDir(LOCAL_BIN_DIR);
    symlinkSync(SPI_SH_SOURCE, SPI_LINK);
    chmodSync(SPI_SH_SOURCE, 0o755);
    lines.push(`Symlinked: ${SPI_LINK} -> ${SPI_SH_SOURCE}`);
  }

  // 3. Check PATH
  if (!pathInPath(LOCAL_BIN_DIR)) {
    lines.push("");
    lines.push("WARNING: ~/.local/bin is not in your PATH.");
    lines.push("Add this to your shell rc file:");
    lines.push('  export PATH="$HOME/.local/bin:$PATH"');
  }

  ctx.ui.notify(lines.join("\n"), "info");
}

// ── /spi remove ────────────────────────────────────────────────────

async function spiRemove(ctx: import("@earendil-works/pi-coding-agent").ExtensionCommandContext) {
  const lines: string[] = [];

  // 1. Remove symlink
  if (existsSync(SPI_LINK)) {
    unlinkSync(SPI_LINK);
    lines.push(`Removed: ${SPI_LINK}`);
  } else {
    lines.push(`spi symlink not found: ${SPI_LINK}`);
  }

  // 2. Ask about compose file
  if (existsSync(COMPOSE_PATH)) {
    const remove = await ctx.ui.confirm(
      "pi-spi",
      `Remove compose file?\n${COMPOSE_PATH}`,
    );
    if (remove) {
      unlinkSync(COMPOSE_PATH);
      lines.push(`Removed: ${COMPOSE_PATH}`);
    } else {
      lines.push(`Kept: ${COMPOSE_PATH}`);
    }
  }

  ctx.ui.notify(lines.join("\n"), "info");
}

// ── Extension entry ────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  pi.registerCommand("spi", {
    description: "Manage sandboxed pi Docker setup",
    getArgumentCompletions: (prefix) => {
      const subs = ["init", "remove"];
      const filtered = subs.filter((s) => s.startsWith(prefix));
      return filtered.length > 0
        ? filtered.map((s) => ({ value: s, label: s }))
        : null;
    },
    handler: async (args, ctx) => {
      const sub = args.trim().split(/\s+/)[0];

      if (!sub) {
        ctx.ui.notify("Usage: /spi init | /spi remove", "info");
        return;
      }

      switch (sub) {
        case "init":
          await spiInit(ctx);
          break;
        case "remove":
          await spiRemove(ctx);
          break;
        default:
          ctx.ui.notify("Usage: /spi init | /spi remove", "info");
      }
    },
  });
}
