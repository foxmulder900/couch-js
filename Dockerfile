FROM node:latest

WORKDIR /usr/code

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm", "test"]