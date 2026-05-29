# pi-spi

`spi` is a Docker-based sandbox around the [Pi](https://github.com/earendil-works/pi-mono) coding agent. Zero host dependencies beyond Docker.

## Install

```bash
pi install https://github.com/meffmadd/spi
```

Then, inside pi, run the one-time setup:

```
/spi init
```

Done. `spi` now works from any shell:

```bash
spi                          # interactive mode
spi "fix the lint errors"    # one-shot prompt
```

## Skill

This package includes the `spi-setup` skill. It documents compose file configuration, mount patterns, image management, and more. Loaded automatically by pi.

## How it works

`/spi init` writes a default Docker Compose file to `~/.pi/spi-compose.yaml` and symlinks the `spi` CLI wrapper to `~/.local/bin/spi`. The CLI does one thing — resolves the compose file and runs `docker compose run --rm pi`.

Two compose files, exclusive (no merge):

| File | Description |
|------|-------------|
| `.pi/spi-compose.yaml` | Used when present in `$PWD` |
| `~/.pi/spi-compose.yaml` | Global fallback |

Use the `spi-setup` skill to instruct the agent for the rest (project mounts, image updates, etc.).

```
spi → spi.sh → docker compose -f <file> run --rm pi "$@"
```
