# ============================================================================
# Stage 1: Build React 19 + Vite + TypeScript Frontend
# ============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Default to same-origin /api so Nginx reverse-proxies /api/* to the backend container
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ============================================================================
# Stage 2: Nginx Static SPA Server & /api Reverse Proxy
# ============================================================================
FROM nginx:stable-alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
