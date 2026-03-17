FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /app
COPY /package.json /package-lock.json ./
RUN npm ci

FROM base as runner
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

CMD ["node", "./src/index.js"]
