FROM node:alpine

WORKDIR usr/couch-js

COPY src ./src
COPY test ./test
COPY *.js ./
COPY *.json ./

RUN npm install
