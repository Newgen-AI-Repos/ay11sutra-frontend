# Frontend Dockerfile: Next.js dashboard (EmpathAI UI)

# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (better Docker cache)
COPY package*.json ./
RUN npm install

# Copy the rest of the frontend source and build
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Copy only the built app + node_modules + package*.json
COPY --from=builder /app ./

# Next.js will read PORT from env (Railway sets it), but we still expose 3000 for clarity
EXPOSE 3000

# Start Next.js in production mode
CMD ["npm", "start"]
