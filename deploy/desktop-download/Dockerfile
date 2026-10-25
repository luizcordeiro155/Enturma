FROM node:22-bookworm AS build

RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates mono-mcs libmono-system-windows-forms4.0-cil && rm -rf /var/lib/apt/lists/*

WORKDIR /project
COPY . .

RUN npm ci
ARG RAILWAY_GIT_COMMIT_SHA
RUN node deploy/native-version.cjs desktop
RUN node apps/desktop/build/build-setup-ui.cjs
RUN npm install --prefix /opt/enturma-builder --no-audit --no-fund electron-builder@26.15.3
RUN node deploy/desktop-download/build-windows.cjs /opt/enturma-builder/node_modules

FROM node:22-alpine

WORKDIR /app
COPY deploy/desktop-download/server.cjs ./server.cjs
COPY --from=build /project/deploy/desktop-download/release.json ./release.json
COPY --from=build /project/apps/desktop/dist/*.zip ./downloads/
COPY --from=build /project/apps/desktop/dist/*.exe ./downloads/

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.cjs"]
