FROM node:20-alpine AS build
WORKDIR /app

# Build-time vars (Vite reads these at build time)
ARG VITE_SUPABASE_PROJECT_ID
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_URL
ARG VITE_API_BASE_URL
ARG VITE_MUNICIPIO_ID
ARG VITE_API_KEY

ENV VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_MUNICIPIO_ID=$VITE_MUNICIPIO_ID \
    VITE_API_KEY=$VITE_API_KEY

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

ENV API_UPSTREAM=https://api.ecoturismo.lmb.software

COPY infra/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80