FROM node:14.18.0-buster-slim

WORKDIR /app

COPY package.json .
COPY yarn.lock .

RUN yarn install --production

COPY . .

CMD ["yarn", "start"]
