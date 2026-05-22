# pi-agent-runtime

Sandboxed pi coding agent in Docker.

## Quick start

```bash
spi                         # interactive mode from any directory
spi "do something"          # one-shot prompt
```

`spi` is a shell function in `~/.zshrc`:
```bash
spi() {
  command -v docker >/dev/null 2>&1 || { echo "spi: docker not found"; return 1; }
  local file
  if [[ -f "$PWD/.pi/sandbox-compose.yaml" ]]; then
    file="$PWD/.pi/sandbox-compose.yaml"
  else
    file="$HOME/.pi/sandbox-compose.yaml"
  fi
  docker compose -f "$file" run --rm pi "$@"
}
```

## Compose files — two-tier, exclusive

| File | Priority | Used when |
|------|----------|-----------|
| `.pi/sandbox-compose.yaml` (project) | High | File exists in `$PWD` — takes over entirely |
| `~/.pi/sandbox-compose.yaml` (global) | Fallback | No project file — used from any directory |

They **do not merge**. If the project has its own compose file, the global one is ignored entirely.

### Global compose

`~/.pi/sandbox-compose.yaml` — minimal base, works from any project:

```yaml
services:
  pi:
    build:
      context: /Users/matthiasmatt/Documents/playground/pi-agent-runtime
    image: pi-agent-runtime
    volumes:
      - ${PWD}:/workspace
      - /tmp:/tmp
      - /Users/matthiasmatt/.pi:/root/.pi
    stdin_open: true
    tty: true
```

### Project compose

`.pi/sandbox-compose.yaml` — full copy of global plus project-specific mounts:

```yaml
services:
  pi:
    build:
      context: /Users/matthiasmatt/Documents/playground/pi-agent-runtime
    image: pi-agent-runtime
    volumes:
      - ${PWD}:/workspace
      - /tmp:/tmp
      - /Users/matthiasmatt/.pi:/root/.pi
      - /Users/matthiasmatt/Documents/playground/pi-deny:/root/Documents/playground/pi-deny
    stdin_open: true
    tty: true
```

## Image

Built from `node:26.2.0-trixie-slim` with `fd-find`, `ripgrep`, and pi installed globally.

**Dockerfile:** `./Dockerfile`
**Image tag:** `pi-agent-runtime`

Rebuild when the Dockerfile changes:
```bash
docker build -t pi-agent-runtime .
```

## Sandbox mounts

| Host | Container | Purpose |
|------|-----------|---------|
| `$PWD` | `/workspace` | Current project (working dir) |
| `/tmp` | `/tmp` | Shared temp files |
| `~/.pi` | `/root/.pi` | Pi config, sessions, skills, extensions, themes, prompts |
| `~/Documents/playground/pi-deny` | `/root/Documents/playground/pi-deny` | pi-deny extension (project-specific) |

## Extension caveat

`pi-deny` is installed as a local path in `~/.pi/agent/settings.json`:
```json
"packages": ["../../Documents/playground/pi-deny"]
```

In the container this resolves to `/root/Documents/playground/pi-deny`. The source is mounted, but if `pi-deny` has npm dependencies, its `node_modules` were installed on macOS (Darwin). Pure JS deps work fine cross-platform; native binaries won't.

To make extensions fully sandbox-ready, install their dependencies inside the container or bake them into the Docker image.
