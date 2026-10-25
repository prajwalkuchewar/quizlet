FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines these at build time, so the public API base URL must be known when the image is built.
ARG VITE_API_BASE=http://localhost:8000
ENV VITE_AUTHENTICATION_URL=${VITE_API_BASE}/auth \
    VITE_QUESTION_URL=${VITE_API_BASE}/questions \
    VITE_QUIZ_URL=${VITE_API_BASE}/quiz \
    VITE_MATERIALS_URL=${VITE_API_BASE}/questions/materials \
    VITE_FLASHCARDS_URL=${VITE_API_BASE}/quiz/flashcards \
    VITE_LLM_URL=${VITE_API_BASE}/llm
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
