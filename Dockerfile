FROM node:24.8-slim AS builder

# Definir directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias (usa npm ci si tienes package-lock.json limpio)
RUN npm install

# Copiar el resto del código fuente
COPY . .

# Compilar la aplicación Angular en modo producción
RUN npm run build:production

# Production stage - Use nginx to serve static files
FROM nginx:alpine AS production

# Copy custom nginx configuration
COPY --from=builder /app/nginx.conf /etc/nginx/nginx.conf

# Copy built Angular app from builder stage
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
