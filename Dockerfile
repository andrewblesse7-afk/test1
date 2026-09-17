# Image for the DormFlow server
FROM node:20-alpine

# All application files live in this folder inside the container
WORKDIR /app

# Copy the manifests first. Docker caches this layer, so npm only runs
# again when the dependencies really change, not on every code edit.
COPY package*.json ./

# ci installs exactly the versions from package-lock.json.
# --omit=dev skips packages that are not needed to run the server.
RUN npm ci --omit=dev

# Copy the rest of the source code
COPY . .

# The server listens on this port
EXPOSE 3000

# The official node image already has a non-root user called "node".
# Running as a normal user is safer than running as root.
USER node

CMD ["node", "server.js"]
