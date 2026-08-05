FROM node:20

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 4000

CMD ["sh", "-c", "npm run db:migrate && node backend/src/server.js"]
