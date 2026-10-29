# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Build
# Node 20 LTS on Alpine; produces an optimised Vite production bundle.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first — separate COPY for cache efficiency
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy the rest of the source and build
COPY . .
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Runtime
# Nginx Alpine serves static files; the build stage artifacts are the only
# content copied in.  No Node.js runtime needed in production.
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Remove the default Nginx config and welcome page
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx configuration for React SPA routing
COPY nginx.conf /etc/nginx/conf.d/labledger.conf

# Copy the built React application
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
