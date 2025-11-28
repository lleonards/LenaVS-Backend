# Usa a imagem Node.js base (Versão 20 LTS)
FROM node:20

# Instala o FFmpeg (necessário para o processamento de vídeo)
RUN apt-get update && apt-get install -y ffmpeg

# Cria e define o diretório de trabalho na pasta raiz do Docker
WORKDIR /usr/src/app

# Copia todo o conteúdo do repositório para o diretório de trabalho
# Isto inclui a subpasta LENAVS_BACKEND
COPY . .

# Altera o diretório de trabalho para a subpasta onde está o código
# Este é o diretório onde o 'npm install' e 'npm start' devem rodar
WORKDIR /usr/src/app/LENAVS_BACKEND

# Instala as dependências do projeto
RUN npm install

# Expõe a porta (Render usa 10000)
EXPOSE 10000

# Comando de inicialização
CMD [ "npm", "start" ]
