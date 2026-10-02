FROM node:22-bookworm AS build

WORKDIR /project
COPY . .

RUN npm ci
RUN npm install --prefix /opt/enturma-builder --no-audit --no-fund electron-builder@26.15.3
RUN node deploy/desktop-download/build-windows.cjs /opt/enturma-builder/node_modules

FROM node:22-alpine

WORKDIR /app
COPY deploy/desktop-download/server.cjs ./server.cjs
COPY --from=build /project/apps/desktop/dist/*.zip ./downloads/
COPY --from=build /project/apps/desktop/dist/*.exe ./downloads/

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.cjs"]
