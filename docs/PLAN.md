# DormFlow — план разработки по этапам

Этот файл читается по требованию, перед началом каждой новой фазы.
Общие правила работы — в `CLAUDE.md` в корне репозитория.

---

## Что должен сделать перед первым этапом

1. Прочитай `CLAUDE.md`.
2. Прочитай требования к заданию (я приложу их отдельно).
3. Посмотри, какие файлы уже есть в папке проекта.
4. Проверь состояние Git: `git status`, `git log --oneline`, `git remote -v`.
5. Составь короткий список первых 5–7 этапов.
6. Выполни **только первый** этап, проверь, закоммить, запушь и остановись.

Я заранее решаю, откуда возьмётся MongoDB (локальный `mongod`, `docker run mongo`
или MongoDB Atlas), и сам вписываю строку подключения в `.env`.
Ты не придумываешь эту строку и не регистрируешь аккаунты за меня.

---

## Phase 1 — Basic project setup

Каждый пункт — отдельный этап и отдельный commit.

1. `npm init`, создание `package.json`.
2. Установка минимальных зависимостей (`express`, `dotenv`).
3. Базовый Express-сервер и маршрут `GET /api/health`.
4. Scripts в `package.json` (`start`, `dev` через `--watch`).
5. Подключение статических файлов из папки `public`.
6. Простая структура папок: `models`, `routes`, `controllers`, `middleware`, `public`.
7. `.gitignore` (`node_modules`, `.env`).
8. `.env.example`.
9. Подключение MongoDB через Mongoose.
10. Базовый обработчик ошибок и `404`.

Не добавляй здесь: авторизацию, роли, Cloudinary, Stripe, сложные модели, dashboard.

---

## Phase 2 — Front-end foundation

По одной странице за этап. Пока сервер не готов, можно показывать тестовые данные
прямо в JavaScript — это нормально, потом заменим на `fetch`.

1. Landing page (`public/index.html`).
2. Navigation bar (общий для всех страниц).
3. Основные CSS-стили (`public/css/style.css`).
4. Responsive layout (mobile-first, один-два breakpoint).
5. Requests page.
6. Bookings page.
7. Activity history page.
8. Announcements page.
9. Login page.
10. Register page.

Дизайн: чистый, современный, понятный. Должен выглядеть как хороший студенческий
проект, а не как купленный коммерческий шаблон.

---

## Phase 3 — Maintenance requests (главный модуль)

### Важно про поле `resident`

Модели `User` на этой фазе **ещё нет**. Поэтому:

- поле `resident` временно хранит **имя студента как строку**;
- в Phase 4 оно будет заменено на `ObjectId` со ссылкой на `User`;
- эта замена — **отдельный этап и отдельный commit**, не делай её заранее.

### Важно про статус

`PATCH /api/requests/:id` редактирует описание, категорию, приоритет и комнату.
**Он не должен менять поле `status`** даже сейчас, когда проверки переходов ещё нет.
Статус меняется только через отдельный endpoint, который появится в Phase 5.
Если этого не соблюсти, Phase 5 будет ломать уже работающий код.

### Поля заявки

`resident`, `roomNumber`, `category`, `description`, `priority`, `status`,
`adminComment`, `createdAt`, `updatedAt`.

- Категории: `Plumbing`, `Electricity`, `Heating`, `Furniture`, `Internet`, `Other`.
- Приоритеты: `Low`, `Medium`, `High`, `Urgent`.
- Статусы: `Submitted`, `Reviewed`, `In Progress`, `Completed`, `Rejected`.
- Статус по умолчанию: `Submitted`.

### Этапы

1. Mongoose model `MaintenanceRequest`.
2. Request controller.
3. Request routes.
4. Подключение routes к серверу.
5. Проверка `POST /api/requests`.
6. Проверка `GET /api/requests` и `GET /api/requests/:id`.
7. Проверка `PATCH /api/requests/:id`.
8. Проверка `DELETE /api/requests/:id`.
9. Front-end форма создания заявки.
10. Отображение списка заявок на странице через `fetch`.

---

## Phase 4 — Authentication and roles

1. Модель `User` (`name`, `email`, `passwordHash`, `roomNumber`, `role`).
2. Регистрация с хешированием пароля через bcrypt.
3. Вход и выдача JWT.
4. Middleware проверки токена.
5. `GET /api/auth/me`.
6. Роли `student` и `admin`.
7. Middleware проверки роли для административных маршрутов.
8. Проверка владельца записи.
9. **Замена `resident: String` на `resident: ObjectId → User`** (отдельный commit).
   Старые тестовые заявки можно удалить и создать заново через seed.

Студент видит только свои заявки, бронирования и историю.
Администратор видит все записи и может ими управлять.

Ограничение «студент видит только своё» реализуй **в запросе к базе внутри
контроллера**, а не скрытием элементов на странице.

Не добавляй: OAuth, Google login, двухфакторную авторизацию, сложную систему permissions.

Обязательно объясни мне: как создаётся JWT, где хранится secret, как токен
отправляется в запросе, как middleware находит пользователя, как проверяется
роль и как проверяется владелец заявки.

---

## Phase 5 — Request workflow and status history

Отдельный endpoint:

```
PATCH /api/requests/:id/status
```

Обычный `PATCH /api/requests/:id` статус не меняет.

### Допустимые переходы

```
Submitted   → Reviewed, Rejected, Cancelled
Reviewed    → In Progress, Rejected
In Progress → Completed
Completed   → (нет)
Rejected    → (нет)
```

Проверка выполняется на сервере по таблице переходов. Недопустимый переход →
`409 Conflict` с понятным сообщением. Из `Completed` нельзя вернуться в `Submitted`.
Менять статус может только администратор (студент может только отменить свою заявку,
пока она в статусе `Submitted`).

### История статусов

```js
statusHistory: [
  {
    from: String,
    to: String,
    changedBy: ObjectId,
    comment: String,
    changedAt: Date
  }
]
```

История дописывается автоматически через `$push` при каждой смене статуса.
Записи истории никогда не редактируются и не удаляются.

Это самая важная часть проекта для защиты — объясни её особенно подробно.

---

## Phase 6 — Facility booking

### Facility

Поля: `name`, `description`, `location`, `capacity`, `available`,
`slotMinutes`, `pricePerSlot`, `createdAt`, `updatedAt`.

Примеры: Laundry Room, Study Room, Common Room, Gym Room.

`slotMinutes` (по умолчанию `60`) задаёт сетку слотов помещения.
`pricePerSlot` (по умолчанию `0`) — цена слота в евро. Ноль означает бесплатное
помещение, поэтому сейчас это поле ни на что не влияет и ничего не усложняет.
Оно добавляется заранее, чтобы в Phase 10 можно было включить оплату
без переделки уже работающей модели.

### Booking

Поля: `userId`, `facilityId`, `startAt`, `endAt`, `status`, `createdAt`, `updatedAt`.

Статусы бронирования: `Active`, `Cancelled`.
Прошедшие бронирования определяются по `endAt < now`, отдельный статус для них не нужен.

**Не используй отдельные строковые поля `date`, `startTime`, `endTime`.**
Только полноценные `Date`: `startAt` и `endAt`. Строки времени неудобно сравнивать,
и на них ломаются часовые пояса.

### Проверка конфликтов

На сервере, а не только в браузере:

```js
newStartAt < existingEndAt && newEndAt > existingStartAt
```

Ищем такое пересечение среди бронирований того же помещения со статусом `Active`.
Если нашли — `409 Conflict`.

### Уникальный индекс (обязательно)

Проверки в коде недостаточно: два одновременных запроса успевают пройти проверку
оба, и в базе появляются две брони на один слот. Защита на уровне базы:

```js
bookingSchema.index(
  { facilityId: 1, startAt: 1 },
  { unique: true, partialFilterExpression: { status: 'Active' } }
);
```

`partialFilterExpression` означает, что индекс учитывает только активные брони,
поэтому после отмены слот снова свободен.

При вставке ловим ошибку MongoDB с кодом `11000` и возвращаем `409`.

Проверить можно двумя параллельными запросами: один получает `201`, второй `409`.

### Остальные индексы

Добавляются в те же модели, отдельным этапом `Add database indexes`:

```js
userSchema.index({ email: 1 }, { unique: true });
requestSchema.index({ status: 1, createdAt: -1 });   // список для админа
requestSchema.index({ resident: 1, createdAt: -1 }); // «мои заявки»
bookingSchema.index({ userId: 1, startAt: -1 });     // «мои бронирования»
```

Объясни мне одной фразой, зачем нужен каждый: без индекса MongoDB читает всю
коллекцию, с индексом — только нужные документы.

### Этапы

1. Facility model.
2. Facility routes.
3. Facility controller.
4. Booking model.
5. Уникальный частичный индекс.
6. Booking routes.
7. Booking controller.
8. Создание бронирования.
9. Валидация дат.
10. Проверка конфликтов в контроллере.
11. Обработка ошибки `11000`.
12. Получение бронирований пользователя.
13. Отмена бронирования.
14. Front-end страница помещений.
15. Front-end форма бронирования.
16. История бронирований.

---

## Phase 7 — Seed script, history and dashboards

### Seed script (сделай первым)

`seed.js` очищает базу и заполняет её демонстрационными данными:

- один администратор и три студента с известными паролями;
- четыре помещения (одно из них с `pricePerSlot: 2`);
- 12–15 заявок в разных категориях, приоритетах и статусах,
  часть из них с заполненной `statusHistory`;
- несколько прошедших и будущих бронирований;
- два объявления.

Команда: `npm run seed`. Тестовые аккаунты потом попадут в README.

Это нужно, чтобы дашборд, фильтры и история было на чём проверять,
и чтобы на защите приложение не выглядело пустым.

### Страница активности студента

- история заявок;
- текущие статусы;
- предстоящие бронирования (`startAt > now`);
- прошедшие бронирования (`endAt < now`);
- последние изменения статуса.

### Простая административная панель

- количество открытых заявок;
- количество завершённых заявок;
- количество бронирований;
- последние заявки;
- фильтр по статусу;
- фильтр по категории;
- простой поиск по описанию или номеру комнаты.

Графики пока не добавляй — только числа и таблицы.

---

## Phase 8 — Announcements

Простая дополнительная функция. Поля: `title`, `content`, `category`,
`createdBy`, `createdAt`, `updatedAt`.

Администратор создаёт, редактирует и удаляет объявления. Студент только читает.

Не делай систему этажей, групп, push- или email-уведомлений.

---

## Phase 9 — Validation and error handling

Добавляй постепенно:

- проверка обязательных полей;
- проверка формата email;
- минимальная длина пароля;
- проверка дат бронирования;
- запрет бронирования времени в прошлом;
- запрет `endAt <= startAt`;
- понятные сообщения об ошибках;
- обработчик `404`;
- общий error middleware;
- проверка корректности MongoDB ObjectId;
- обработка duplicate email.

`express-validator` можно поставить, только если он реально делает код понятнее.

---

## Phase 10 — Optional advanced features

Только после того, как обязательная версия полностью готова.

Перед добавлением каждой функции сначала объясни:
обязательна ли она для задания, насколько усложнит проект, какие файлы
придётся изменить, какие нужны новые зависимости, можно ли сдать проект без неё.

1. Dockerfile (для задания это заявленный deliverable — приоритет выше остальных).
2. Загрузка фотографии поломки через Cloudinary.
3. Mock payment или Stripe test mode.
4. Простая административная статистика с графиком.
5. Экспорт заявок в CSV.
6. API-тесты через Vitest и Supertest.

### Mock payment

Фото и оплата — не главная часть проекта. Платная услуга берётся из поля
`pricePerSlot` помещения, добавленного ещё в Phase 6. Пример: `Laundry Room — €2`.

Модель `Payment`:

```js
{
  userId:    ObjectId,   // кто платит
  bookingId: ObjectId,   // за какое бронирование
  amount:    Number,     // копируется из pricePerSlot в момент создания
  currency:  'EUR',
  status:    String,     // unpaid | paid | failed
  paidAt:    Date
}
```

Порядок работы:

1. Бронирование платного помещения создаётся вместе с записью `Payment`
   в статусе `unpaid`.
2. Кнопка Pay на странице бронирований переводит платёж в `paid`
   и проставляет `paidAt`.
3. Оплаченные и неоплаченные платежи видны на странице активности студента.
4. Сумма считается **на сервере** из `pricePerSlot`, а не приходит с клиента.

Stripe только в test mode, реальных платежей нет.
Если Stripe заметно усложняет проект — сделай простую симуляцию оплаты
без внешнего сервиса, этого достаточно.
В README и в отчёте прямо укажи, что это mock payment.

### Cloudinary

Фотография не обязательна. Сначала форма заявки должна полностью работать без неё.
В MongoDB сохраняется только URL изображения, само изображение в базу не пишется.
Ключи Cloudinary — только в `.env`.

---

## Порядок фаз (короткая версия)

1. Basic server
2. Static front-end
3. MongoDB connection
4. Request CRUD
5. Authentication
6. Roles
7. Request workflow
8. Status history
9. Facility booking
10. Booking conflict validation
11. Activity history
12. Announcements
13. Validation
14. Docker
15. Tests
16. Cloudinary
17. Mock payment

---

## REST API (полная карта)

Endpoint создаётся только тогда, когда он нужен текущему этапу.
Для каждого нового endpoint укажи: метод, URL, кто имеет доступ, headers,
request body, успешный ответ и возможные ошибки.

```
POST   /api/auth/register          public
POST   /api/auth/login             public
GET    /api/auth/me                auth

GET    /api/requests               student: свои | admin: все
POST   /api/requests               student
GET    /api/requests/:id           владелец | admin
PATCH  /api/requests/:id           владелец, пока статус Submitted (без поля status)
DELETE /api/requests/:id           владелец | admin
PATCH  /api/requests/:id/status    admin (student: только отмена своей заявки)

GET    /api/facilities             auth
POST   /api/facilities             admin
GET    /api/facilities/:id         auth
PATCH  /api/facilities/:id         admin
DELETE /api/facilities/:id         admin

GET    /api/bookings               свои | admin: все
POST   /api/bookings               student
GET    /api/bookings/:id           владелец | admin
DELETE /api/bookings/:id           владелец (отмена)

GET    /api/announcements          auth
POST   /api/announcements          admin
GET    /api/announcements/:id      auth
PATCH  /api/announcements/:id      admin
DELETE /api/announcements/:id      admin
```

Фильтры для списков: `?status=&category=&priority=&roomNumber=&q=&page=&limit=`

---

## Примерный список коммитов

```
Initialize Node.js project
Add basic Express server
Add npm scripts
Serve static files
Add project folder structure
Add gitignore and env example
Add MongoDB connection
Add basic error handler
Create landing page
Add navigation bar
Add base styles
Add responsive layout
Create maintenance request model
Add request creation endpoint
Add request list endpoint
Add request update endpoint
Add request delete endpoint
Create request submission form
Display requests on page
Create user model
Add user registration
Add JWT login
Add auth middleware
Add current user endpoint
Protect request routes
Add admin role middleware
Link requests to user accounts
Add request status workflow
Add request status history
Create facility model
Create booking model
Add booking unique index
Add booking creation endpoint
Add booking date validation
Add booking conflict validation
Add booking cancellation
Create facilities page
Create booking form
Add database indexes
Add seed script
Create activity history page
Create admin dashboard
Add request filters
Add announcements
Add validation and error messages
Add Dockerfile
Add payment model
Add mock payment flow
Add API tests
Add project setup instructions
Document REST API endpoints
Add screenshots to README
```

---

## Документация

README и итоговый отчёт пиши ближе к концу, когда структура стабильна,
и тоже отдельными коммитами.

README должен содержать: project overview, main features, technologies,
installation instructions, environment variables, run commands, API overview,
user roles, test accounts, screenshots section, repository structure,
known limitations, future improvements.

Язык — простой академический английский, как у студента.

Не пиши: *revolutionary platform*, *cutting-edge solution*, *enterprise-grade
architecture*, *seamless ecosystem*, *robust and scalable infrastructure*.

Пиши так:

- The application allows students to submit maintenance requests.
- Administrators can update request statuses.
- MongoDB is used to store application data.
- The booking system prevents overlapping reservations.
- JWT is used to protect private API routes.
- Students can view their request and booking history.
