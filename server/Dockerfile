FROM node:22
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm_config_build_from_source=true npm ci
COPY . .
EXPOSE 3001
CMD ["npx", "nodemon", "index.mjs"]
