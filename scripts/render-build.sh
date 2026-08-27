#!/bin/bash
set -e

echo "🔨 Building Nyumba Nearby for Render..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# Run database migrations (optional - uncomment if needed)
# echo "🔄 Running database migrations..."
# npx prisma migrate deploy

# Build Next.js application
echo "🏗️ Building Next.js application..."
npm run build

echo "✅ Build complete!"
