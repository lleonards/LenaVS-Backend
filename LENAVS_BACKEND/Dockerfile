# Usa uma imagem Node.js base com o sistema operacional já configurado
FROM node:20 

# Instala o FFmpeg
# O comando é executado durante o build da imagem, onde o sistema de arquivos não é somente leitura
RUN apt-get update && apt-get install -y ffmpeg

# Define o diretório de trabalho
WORKDIR /usr/src/app

# Copia o package.json e instala dependências
COPY package*.json ./
RUN npm install

# Copia o restante do código
COPY . .

# Expõe a porta (Render usa 10000)
EXPOSE 10000

# Comando de inicialização
CMD [ "npm", "start" ]
