# Build depuis la racine du repo : docker build -f apps/motilis-back/Dockerfile .
FROM node:26-alpine
RUN corepack enable
WORKDIR /repo
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY libs/motilis-models/package.json libs/motilis-models/
COPY apps/motilis-back/package.json apps/motilis-back/
RUN pnpm install --frozen-lockfile --prod --filter @motilis/back...
COPY libs/motilis-models libs/motilis-models
COPY apps/motilis-back/src apps/motilis-back/src
WORKDIR /repo/apps/motilis-back
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "src/main.ts"]
