FROM node:22

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY src ./src
COPY scripts ./scripts

EXPOSE 8000

CMD ["node", "src/app.js"]