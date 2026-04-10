FROM node:22-slim

WORKDIR /srv/play

COPY package.json package-lock.json* ./
RUN npm install

EXPOSE 4321

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "4321"]
