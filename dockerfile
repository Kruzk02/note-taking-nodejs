FROM node:22

WORKDIR /usr/src/app/src

COPY package*.json ./

RUN npm install

RUN npm install -g nodemon

COPY . .

EXPOSE 8080

CMD ["npm", "run", "dev"]