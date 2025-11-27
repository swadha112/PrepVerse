# server/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install only once; bind mount will reuse node_modules via volume below
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

ENV NODE_ENV=development
EXPOSE 4000

CMD ["npm", "start"]