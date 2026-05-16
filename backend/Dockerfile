FROM node:22-bookworm-slim
# image has a non-root user named "node"

WORKDIR /app/backend

RUN apt-get update \
 && apt-get install -y sqlite3 \
 && rm -rf /var/lib/apt/lists/*

# copy with the correct ownership to avoid permission issues
COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev

COPY --chown=node:node . .

RUN mkdir -p /app/data \
 && chown -R node:node /app/data /app/backend

# activate the node user to avoid running the application as root
USER node

EXPOSE 3000

CMD ["npm", "start"]