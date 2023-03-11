FROM node:14.20.0

WORKDIR /app

COPY package.json .
COPY yarn.lock .

RUN yarn install --production

COPY . .

CMD ["yarn", "start"]
