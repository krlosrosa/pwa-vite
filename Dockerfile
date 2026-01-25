FROM node:22

# Diretório da aplicação
WORKDIR /app

# Copia arquivos de dependências
COPY package.json package-lock.json ./

# Instala apenas dependências necessárias
RUN npm i

# Copia o restante do projeto
COPY . .

# Gera o build de produção
RUN npm run build

# Expõe porta do preview
EXPOSE 3000

# Inicia o servidor de preview, obrigatoriamente expondo o host
CMD ["npm", "run", "serve", "--", "--host", "0.0.0.0"]
