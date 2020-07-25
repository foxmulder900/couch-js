FROM node:alpine

WORKDIR usr/couch-js
COPY src .
COPY test .
COPY .eslintrc.json .
COPY index.js .
COPY package.json .
COPY test.js .

RUN npm install
