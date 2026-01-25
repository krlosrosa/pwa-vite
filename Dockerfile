FROM node:22-slim 
# O slim é mais leve para produção

WORKDIR /app

COPY package*.json ./

# Instala TUDO (inclusive devDeps) porque você precisa do Vite e TSC para o build
RUN npm install

COPY . .

# Executa o build
RUN npm run build

# Remove dependências de desenvolvimento após o build para economizar espaço (opcional)
# RUN npm prune --production

EXPOSE 3000

CMD ["npm", "run", "serve", "--", "--host", "0.0.0.0"]