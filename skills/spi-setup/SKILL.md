---
name: spi-setup
description: Configure the spi Docker sandbox for pi. Use this skill whenever the user asks to add volume mounts, mount local extensions or directories, change the Docker image, add environment variables, edit the compose file, or modify the sandbox configuration in any way.
---

# SPI Sandbox Setup

`spi` runs pi inside Docker via `docker compose`. To change the sandbox, edit the compose file.

## Where to edit

Two locations. Pick one:

1. **Project**: `.pi/spi-compose.yaml` in the current project root — used first if it exists
2. **Global fallback**: `~/.pi/spi-compose.yaml` — used when no project file

They do **not** merge. A project file replaces the global one completely.

## Default compose

The default (created by `/spi init`) looks like this:

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

Anything `docker compose` supports works: custom images, multiple services, networks, env files, health checks, resource limits, entrypoint overrides, build contexts.

### Common tasks

**Mount a local extension or directory:**

Add a volume entry under `volumes:` in the compose file:

```yaml
volumes:
  - ${PWD}:/workspace
  - ${HOME}/.pi:/root/.pi
  - /absolute/host/path:/container/path
```

Then reference it inside the container. For pi extensions installed as local paths, use container-relative paths in `~/.pi/agent/settings.json`.

**Use a custom Docker image:**

Change the `image:` line in the compose file.

**Build from a local Dockerfile:**

Replace `image:` with:

```yaml
build:
  context: /path/to/pi-agent-runtime
image: pi-agent-runtime
```

**Add environment variables:**

```yaml
environment:
  - MY_VAR=value
  - SECRET_VAR          # pulls from host env
```

**Mount SSH keys for git:**

```yaml
volumes:
  - ${HOME}/.ssh:/root/.ssh:ro
```

## Updating

To pull the latest registry image: `docker pull ghcr.io/meffmadd/pi-agent-runtime:latest`

## Troubleshooting

- `spi: docker not found` — install Docker
- `spi: no compose file found` — run `/spi init` inside pi
- Mount path not found — host paths in `volumes:` must exist
