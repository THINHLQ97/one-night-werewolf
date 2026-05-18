# Stage 1: Build client
FROM node:20-slim AS client-build
WORKDIR /client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Server + client dist
FROM node:20-slim
WORKDIR /app
COPY server/package*.json ./
RUN npm install --production
COPY server/ ./
COPY --from=client-build /client/dist /client/dist
EXPOSE 3001
CMD ["node", "index.js"]
