FROM node:24-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN DATABASE_URL="postgresql://postgres:postgres@db:5432/ecommerce_db?schema=public" npx prisma generate

EXPOSE 4000

CMD ["node", "src/server.js"]