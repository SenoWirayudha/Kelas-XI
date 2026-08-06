FROM node:20

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
COPY .env.production ./.env

EXPOSE 3000

CMD ["node", "backend/src/start.js"]
