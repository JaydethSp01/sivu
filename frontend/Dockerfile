FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
# --legacy-peer-deps porque react-day-picker@8 requiere date-fns@2|3 pero usamos date-fns@4.
# Es lo que hace pnpm por defecto en desarrollo; aquí lo replicamos para que npm no falle.
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
