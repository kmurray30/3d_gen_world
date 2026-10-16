# ---- build stage ----
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Manifest is regenerated from the shipped sprites so it always matches them.
RUN apt-get update && apt-get install -y --no-install-recommends python3 && rm -rf /var/lib/apt/lists/* \
 && python3 words_and_images/build_manifest.py --no-images-ok
RUN npm run build

# ---- runtime stage ----
FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
COPY --from=build /app/dist ./dist
COPY --from=build /app/assets ./assets
COPY --from=build /app/package.json ./package.json
EXPOSE 8080
CMD ["node", "--disable-warning=ExperimentalWarning", "dist/server/index.js"]
