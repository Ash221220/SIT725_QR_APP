FROM node:20

WORKDIR /app

COPY backend/package*.json ./backend/

WORKDIR /app/backend

RUN npm install

WORKDIR /app

COPY . .

WORKDIR /app/backend

EXPOSE 5001

CMD ["npm", "start"]