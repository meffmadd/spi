FROM node:26.2.0-trixie-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    fd-find \
    ripgrep \
    && rm -rf /var/lib/apt/lists/*

ARG PI_VERSION=latest
RUN npm install -g --ignore-scripts @earendil-works/pi-coding-agent@${PI_VERSION}

WORKDIR /workspace
ENTRYPOINT ["pi"]
