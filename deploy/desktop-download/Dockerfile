FROM node:22-bookworm AS build

WORKDIR /project
COPY . .

RUN dpkg --add-architecture i386 && apt-get update && apt-get install -y --no-install-recommends wine wine32 wine64 && rm -rf /var/lib/apt/lists/*
RUN npm ci
RUN npm run dist:desktop:win

FROM node:22-alpine

WORKDIR /app
COPY deploy/desktop-download/server.cjs ./server.cjs
COPY --from=build /project/apps/desktop/dist/*.zip ./downloads/
COPY --from=build /project/apps/desktop/dist/*.exe ./downloads/

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.cjs"]
