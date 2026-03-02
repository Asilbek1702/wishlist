# 🎁 Вишлист

> **[🔗 Живое приложение](https://wishlist-app.vercel.app)** | **[GitHub](https://github.com/Asilbek1702/wishlist)**

Production-ready приложение для создания вишлистов с real-time обновлениями. Создавай списки желаний, делись с друзьями — они сами забронируют подарки, чтобы не повторяться.

## Возможности

- Регистрация и вход (email + Google OAuth)
- Создание вишлистов с цветом обложки и датой события
- Добавление товаров с **автозаполнением по URL** (название, цена, картинка)
- Публичная страница — доступна **без регистрации**
- Бронирование подарков гостями без регистрации
- **Групповой сбор** с прогресс-баром
- **Real-time обновления** через Pusher WebSocket
- Владелец **не видит** кто что забронировал
- Конфетти при бронировании 🎉
- Адаптивный дизайн (мобайл-фёрст)

## Стек

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind + Framer Motion
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js v5 (Email/Password + Google OAuth)
- **Real-time:** Pusher WebSocket
- **Scraping:** Cheerio (auto-fill по URL)
- **Deploy:** Vercel + Railway

## Быстрый старт

```bash
# Установи зависимости
npm install

# Настрой переменные окружения
cp .env.example .env.local
# Заполни .env.local своими ключами

# Применить схему БД
npx prisma db push

# Запустить dev-сервер
npm run dev
```

## Переменные окружения

| Переменная | Описание |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Секрет NextAuth v5 (`openssl rand -base64 32`) |
| `AUTH_URL` | URL приложения (например `https://your-app.vercel.app`) |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `PUSHER_APP_ID` | Pusher App ID |
| `PUSHER_KEY` | Pusher Key |
| `PUSHER_SECRET` | Pusher Secret |
| `PUSHER_CLUSTER` | Pusher Cluster (например `eu`) |
| `NEXT_PUBLIC_PUSHER_KEY` | Тот же ключ (для клиента) |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Тот же кластер (для клиента) |

> ⚠️ **Важно:** NextAuth v5 использует `AUTH_SECRET` и `AUTH_URL` вместо `NEXTAUTH_SECRET` и `NEXTAUTH_URL`

## Деплой на Vercel + Railway

1. **Railway** → создай PostgreSQL → скопируй `DATABASE_URL`
2. **Pusher** → [pusher.com](https://pusher.com) → создай app → скопируй ключи
3. **Google Cloud Console** → создай OAuth credentials → `CLIENT_ID` + `SECRET`
4. **Vercel** → импортируй репо → добавь все env vars → деплой
5. После деплоя выполни: `npx prisma migrate deploy`

## Маршруты

| Маршрут | Описание |
|---|---|
| `/login` | Вход |
| `/register` | Регистрация |
| `/dashboard` | Мои вишлисты |
| `/wishlist/new` | Создание вишлиста |
| `/wishlist/[id]` | Редактирование |
| `/w/[slug]` | Публичная страница (без auth) |

## Edge cases

- **Товар удалён с активными взносами** → статус `UNAVAILABLE`, взносы `REFUNDED`, физически не удаляется
- **Дата события прошла** → бейдж «Событие прошло», бронирование по-прежнему возможно
- **Сумма сбора не набралась** → сбор продолжается, владелец решает сам
- **Сумма превышает цель** → вклад автоматически обрезается до остатка, статус → `FULFILLED`
- **Гость хочет снять бронь** → токен в localStorage, или связь с владельцем
