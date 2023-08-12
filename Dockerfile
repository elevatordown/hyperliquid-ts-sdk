FROM node:16
WORKDIR /app
COPY *.json ./
RUN yarn install
COPY ./src ./src
COPY ./examples ./examples
COPY ./bot ./bot
RUN yarn build
CMD ["npx", "ts-node", "./bot/index.ts"]