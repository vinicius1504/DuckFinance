# ---------- build ----------
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/frontend/package.json ./packages/frontend/

RUN npm install --workspaces --include-workspace-root

COPY packages/shared ./packages/shared
COPY packages/frontend ./packages/frontend

WORKDIR /app/packages/frontend
RUN npm run build

# ---------- runtime ----------
FROM nginx:alpine

COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/packages/frontend/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
