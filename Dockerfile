
FROM node:20-alpine As development

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# RUN npm run build

# FROM node:20-alpine as production

# ARG NODE_ENV=production
# ENV NODE_ENV=${NODE_ENV}

# WORKDIR /app

# COPY package*.json ./

# RUN npm install --only=production

# COPY --from=development /app/dist ./dist

EXPOSE 3000 9229
CMD ["node", "--inspect=0.0.0.0:9229", "-r", "ts-node/register", "src/main.ts"]
# CMD ["node", "dist/main"]


