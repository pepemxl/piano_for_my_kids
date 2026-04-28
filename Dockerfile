FROM node:20-alpine

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json ./
RUN npm install

# Copy the rest of the app.
COPY . .

EXPOSE 3000

# Default to dev (hot reload via --watch). Compose overrides this for prod.
CMD ["node", "--watch", "server.js"]
