FROM node:22-alpine

WORKDIR /app

# Copia manifests do monorepo e instala deps com workspaces
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/

RUN npm install --workspaces --include-workspace-root

# Copia código
COPY packages/shared ./packages/shared
COPY packages/backend ./packages/backend

WORKDIR /app/packages/backend

EXPOSE 3000

# Roda direto com tsx (evita problemas de build TS no monorepo)
CMD ["npx", "tsx", "src/server.ts"]
