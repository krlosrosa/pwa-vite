FROM node:22-slim 
# O slim é mais leve para produção

WORKDIR /app

COPY package*.json ./

# Instala TUDO (inclusive devDeps) porque você precisa do Vite e TSC para o build
RUN npm install

COPY . .

# --- ADICIONE ESTAS LINHAS ---
ARG VITE_API_URL
ARG VITE_KEYCLOAK_URL
# Elas tornam as variáveis disponíveis para o processo do 'npm run build'
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL
# ----------------------------

# Executa o build
RUN npm run build

# Remove dependências de desenvolvimento após o build para economizar espaço (opcional)
# RUN npm prune --production

EXPOSE 3000

CMD ["npm", "run", "serve", "--", "--host", "0.0.0.0"]