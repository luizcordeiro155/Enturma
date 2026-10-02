# Wine 11 WoW64 runs the 32-bit NSIS bootstrap on 64-bit-only build kernels.
# Pin the official Electron builder image to keep native Git builds reproducible.
FROM electronuserland/builder:22-wine@sha256:b226b27b1a7e95ad25eb3d6414ea90c56c04eb6d8329967f4d721dce50b989ff AS build

ENV WINEARCH=wow64

WORKDIR /project
COPY . .

RUN wine --version && wine cmd /c echo Enturma-Windows-builder-ready
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
