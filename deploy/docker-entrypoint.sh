#!/bin/sh
set -e

echo "Running database migrations..."
npx sequelize-cli db:migrate --env production

echo "Starting API..."
exec node src/server.js
