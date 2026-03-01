# Вишлист — приложение для создания вишлистов с real-time обновлениями

Production-ready приложение для создания вишлистов. Создавай списки желаний, делись с друзьями — они сами забронируют подарки.

## Стек

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind + Framer Motion
- **Database:** PostgreSQL + Prisma
- **Auth:** NextAuth.js v5 (Email/Password + Google OAuth)
- **Real-time:** Pusher (WebSocket)
- **Scraping:** Cheerio (auto-fill по URL)

## Быстрый старт

1. **Клонируй и установи зависимости:**
   ```bash
   npm install
   ```

2. **Настрой переменные окружения:**
   ```bash
   cp .env.example .env.local
   ```
   Заполни `.env.local` (см. `.env.example`).

3. **Подними базу и выполни миграции:**
   ```bash
   npx prisma db push
   # или для разработки с миграциями:
   npx prisma migrate dev
   ```

4. **Запусти dev-сервер:**
   ```bash
   npm run dev
   ```

## Переменные окружения

| Переменная | Описание |
|-----------|----------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Секрет для NextAuth (openssl rand -base64 32) |
| `NEXTAUTH_URL` | URL приложения (например https://your-app.vercel.app) |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `PUSHER_APP_ID` | Pusher App ID |
| `PUSHER_KEY` | Pusher Key |
| `PUSHER_SECRET` | Pusher Secret |
| `PUSHER_CLUSTER` | Pusher Cluster (например eu) |
| `NEXT_PUBLIC_PUSHER_KEY` | Тот же ключ для клиента |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Тот же кластер |

## Деплой

1. **Railway:** создай PostgreSQL → скопируй `DATABASE_URL`
2. **Pusher:** создай приложение → скопируй ключи
3. **Google Cloud:** создай OAuth app → Client ID + Secret
4. **Vercel:** импортируй репо, добавь env vars, деплой
5. После деплоя: `npx prisma migrate deploy`

## Структура

- `/login`, `/register` — авторизация
- `/dashboard` — список вишлистов
- `/wishlist/new` — создание вишлиста
- `/wishlist/[id]` — редактирование
- `/w/[slug]` — публичная страница (без auth)

## Функции

- Регистрация и вход (email + Google)
- Создание вишлистов с цветом и датой
- Добавление товаров с auto-fill по URL
- Публичная страница без авторизации
- Бронирование товаров гостями
- Групповой сбор с прогресс-баром
- Real-time обновления через Pusher
- Конфетти при бронировании
- Toast-уведомления
