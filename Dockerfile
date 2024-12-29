FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=80

COPY package.json package-lock.json ./

RUN npm ci --omit dev

RUN npm db:migrate

COPY build ./build

EXPOSE 80

CMD ["node", "build"]