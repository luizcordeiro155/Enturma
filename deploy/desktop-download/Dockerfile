FROM electronuserland/builder:wine AS build

WORKDIR /project
COPY . .

RUN npm ci
RUN npm run dist:desktop:win

FROM node:22-alpine

WORKDIR /app
COPY deploy/desktop-download/server.cjs ./server.cjs
COPY --from=build /project/apps/desktop/dist/*.zip ./downloads/

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.cjs"]
