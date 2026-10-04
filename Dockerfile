# Install production dependencies + sequelize-cli for migrate-on-start
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm install sequelize-cli@6.6.5 --no-save

# Minimal runtime image, non-root
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup -S app && adduser -S app -G app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY .sequelizerc ./
COPY src ./src
COPY .env.example ./
COPY deploy/docker-entrypoint.sh /app/docker-entrypoint.sh

RUN sed -i 's/\r$//' /app/docker-entrypoint.sh \
    && chmod +x /app/docker-entrypoint.sh \
    && chown -R app:app /app

USER app

EXPOSE 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
