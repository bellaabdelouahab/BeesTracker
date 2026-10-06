# 1) build the React client
FROM node:20-alpine AS client
WORKDIR /client
COPY client/package*.json ./
RUN npm ci --no-audit --no-fund
COPY client/ ./
RUN npm run build

# 2) one small Node process serves the API, the sockets and the built client
FROM node:20-alpine
WORKDIR /app/server
ENV NODE_ENV=production
COPY server/package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY server/ ./
COPY --from=client /client/dist /app/client/dist
VOLUME /app/server/data
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=4s CMD wget -qO- http://localhost:3000/api/health || exit 1
CMD ["node", "src/index.js"]
