# Multi-stage build for absolute security and minimal container footprint
FROM node:20-alpine AS builder

# Set active working directory
WORKDIR /usr/src/app

# Copy dependency mappings
COPY package*.json ./

# Install packages with full security sweep and exact version lockups
RUN npm ci --omit=dev

# Secondary runner phase for light runtime production deployment
FROM node:20-alpine AS runner

# Set production context environmental flags
ENV NODE_ENV=production
ENV PORT=8080

# Establish standard container running directory
WORKDIR /usr/src/app

# Copy compiled module caches and essential codebase items
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./package.json
COPY server.js ./
COPY app.js ./
COPY index.html ./
COPY style.css ./

# Expose standard routing port
EXPOSE 8080

# Initiate Express dynamic platform server
CMD ["node", "server.js"]
