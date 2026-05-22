---
name: spi-setup
description: Configure and customize the Docker sandbox for pi. Use when adjusting mount points, adding project-specific bindings, changing the base image, or tweaking the sandbox compose file.
---

# SPI Sandbox Setup

`spi` runs pi inside Docker. Under the hood it's just `docker compose` — edit the compose file however you like.

## How it works

`spi` picks a compose file (two-tier, exclusive):

1. `spi-compose.yaml` in `$PWD` — **project-level** (takes over entirely)
2. `~/.pi/spi-compose.yaml` — **global fallback** (used when no project file)

They do **not** merge. A project compose replaces the global one.

## Global compose (created by `/spi init`)

```yaml
services:
  pi:
    image: ghcr.io/meffmadd/pi-agent-runtime:latest
    volumes:
      - ${PWD}:/workspace
      - ${HOME}/.pi:/root/.pi
    stdin_open: true
    tty: true
```

## It's just Docker Compose

Edit these files freely. Everything `docker compose` supports works: multiple services, networks, env files, health checks, resource limits, entrypoint overrides, build contexts — anything.

### Examples

**Use your own image:**

```yaml
image: registry.example.com/my-pi:latest
```

**Add project mounts:**

```yaml
volumes:
  - ${PWD}:/workspace
  - ${HOME}/.pi:/root/.pi
  - ${HOME}/.ssh:/root/.ssh:ro
  - /home/user/other-repo:/workspace/other-repo
```

**Set environment variables:**

```yaml
environment:
  - NODE_ENV=development
  - MY_API_KEY          # pulls from host env
```

**Build from a local Dockerfile:**

```yaml
services:
  pi:
    build:
      context: /path/to/pi-agent-runtime
    image: pi-agent-runtime
    volumes:
      - ${PWD}:/workspace
      - ${HOME}/.pi:/root/.pi
    stdin_open: true
    tty: true
```

## Updating the image

```bash
docker pull ghcr.io/meffmadd/pi-agent-runtime:latest
```

Or run `/spi upgrade` inside pi (planned).

## Troubleshooting

**`spi: docker not found`** — Docker is not installed or not in PATH.

**`spi: no compose file found`** — Run `/spi init` inside pi to create the default compose.

**Mount path not found** — Host paths in `volumes:` must exist.
