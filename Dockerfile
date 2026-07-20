# Carryoo Admin — production static build served by nginx (Railway-ready)

FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite bakes this into the bundle at build time — set in Railway Variables.
ARG VITE_API_BASE_URL=https://nashik-flow-backend-production.up.railway.app/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

FROM nginx:1.27-alpine AS runtime

RUN apk add --no-cache gettext wget

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh \
    && rm -f /etc/nginx/conf.d/default.conf

ENV PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD sh -c 'wget -qO- "http://127.0.0.1:${PORT:-8080}/health" || exit 1'

ENTRYPOINT ["/docker-entrypoint.sh"]
