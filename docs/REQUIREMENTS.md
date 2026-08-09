# Официальные требования к заданию

Оригинальный текст задания приведён ниже без изменений.
План разработки — в `docs/PLAN.md`. Правила работы — в `CLAUDE.md`.

**Правило для агента:** не считай проект завершённым, пока каждый пункт
чек-листа в конце этого файла не закрыт реально работающим кодом.
Если какой-то пункт закрыт частично — скажи мне об этом прямо,
не отмечай его выполненным.

---

## Project-Based Assessment (оригинальный текст)

The final assessment requires students to apply their accumulated web development
knowledge by designing and implementing a complete web application that addresses
a real-world scenario. Students may choose from a range of project themes, such as
developing a web application for a business, non-profit organization, educational
institution, service provider, or community-based initiative.

The project should demonstrate the student's ability to design, build, and deploy
a functional web-based solution using both front-end and back-end technologies.
The application must include core features commonly required in real-world systems,
such as content presentation, data management, user interaction, and basic workflow
or transaction handling.

### Minimum Functional Requirements

Each project should include, at a minimum:

- A clear landing page presenting the organization, service, or problem the
  application addresses.
- One or more dynamic pages that display and manage structured data
  (e.g., listings, records, or resources).
- Functionality to create, update, and manage data entries through forms.
- Search, filtering, or similar mechanisms to allow users to locate specific
  information.
- A basic workflow or transaction simulation relevant to the chosen project context
  (e.g., booking, registration, request submission, or mock payment).
- A page or dashboard displaying historical records, activity logs, or submitted
  requests.

### Technical Deliverables

The project must demonstrate the use of the following technical components:

**User Interface (Front-End)**

- A responsive and user-friendly interface developed using HTML, CSS, and JavaScript.

**Application Logic (Back-End)**

- A server-side application built using Node.js and Express.js.
- A database solution (e.g., MongoDB) to manage application data.
- RESTful APIs supporting CRUD operations and application workflows.

**Optional Integrations**

- Integration of third-party services or APIs where appropriate
  (e.g., payment sandbox, authentication services, or external data sources).

### Documentation and Submission

The submitted report should clearly document the design, implementation, and
functionality of the web application. It should include, where applicable:

- Front-end structure, styling approach, and key JavaScript functionality.
- Database schema and data models.
- Server-side controllers, routes, and API endpoints.
- Deployment configuration (e.g., Dockerfile) and setup instructions.
- A link to the complete source code repository (GitHub/GitLab).

---

## Как DormFlow закрывает требования

### Обязательная функциональность

| Требование задания | Где реализовано | Фаза |
|---|---|---|
| Clear landing page | `public/index.html` — об общежитии, услуги, последние объявления | 2 |
| Dynamic pages with structured data | Заявки, помещения, бронирования, объявления — данные из MongoDB через `fetch` | 3, 6, 8 |
| Create, update, manage through forms | Форма заявки, форма бронирования, админские формы помещений и объявлений | 3, 6, 8 |
| Search, filtering | Фильтр заявок по статусу, категории, приоритету, номеру комнаты + поиск по описанию | 7 |
| Workflow / transaction simulation | **Два механизма:** жизненный цикл заявки с валидацией переходов и бронирование слотов с проверкой конфликтов. Опционально — mock payment | 5, 6, 10 |
| Dashboard with historical records / activity logs | Страница активности студента + `statusHistory` внутри заявки + админский дашборд | 5, 7 |

### Технические требования

| Требование задания | Где реализовано | Фаза |
|---|---|---|
| Responsive UI: HTML, CSS, JavaScript | `public/`, mobile-first вёрстка, `fetch` без фреймворков | 2 |
| Node.js + Express.js | `server.js`, routes, controllers, middleware | 1, 3 |
| Database (MongoDB) | Mongoose-модели: User, MaintenanceRequest, Facility, Booking, Announcement | 3, 4, 6, 8 |
| RESTful API with CRUD and workflows | Карта эндпоинтов в `docs/PLAN.md`, включая `PATCH /api/requests/:id/status` | 3–8 |
| Optional third-party integrations | Cloudinary (фото поломки), Stripe test mode (mock payment) | 10 |

### Требования к отчёту

| Пункт отчёта | Откуда берётся |
|---|---|
| Front-end structure, styling, key JS | Раздел про `public/`, подход к CSS, работа `fetch` |
| Database schema and data models | Mongoose-схемы + индексы из Phase 6 |
| Controllers, routes, API endpoints | Карта эндпоинтов с правами доступа по ролям |
| Deployment configuration (Dockerfile) | Phase 10, пункт 1 |
| Repository link | GitHub-репозиторий с историей коммитов |

---

## Чек-лист перед сдачей

Отмечай только то, что реально работает и проверено.

**Функциональность**

- [ ] Landing page открывается и описывает проект
- [ ] Регистрация и вход работают
- [ ] Студент создаёт заявку через форму
- [ ] Заявка сохраняется в MongoDB и отображается в списке
- [ ] Заявку можно отредактировать и удалить
- [ ] Администратор меняет статус, недопустимый переход отклоняется с `409`
- [ ] История статусов заполняется автоматически
- [ ] Фильтры и поиск по заявкам работают
- [ ] Помещения отображаются на странице
- [ ] Бронирование создаётся, пересекающееся — отклоняется с `409`
- [ ] Бронирование можно отменить
- [ ] Страница активности показывает заявки, бронирования и историю
- [ ] Админский дашборд показывает счётчики и последние заявки
- [ ] Объявления создаются админом и видны студенту

**Техническое**

- [ ] Интерфейс адаптивный, проверен на узком экране
- [ ] Все данные приходят из MongoDB, нет захардкоженных массивов
- [ ] REST API отвечает корректными кодами: `200`, `201`, `400`, `401`, `403`, `404`, `409`
- [ ] Защищённые маршруты возвращают `401` без токена
- [ ] Административные маршруты возвращают `403` для студента
- [ ] Студент не видит чужие заявки даже прямым запросом к API
- [ ] Пароль не возвращается ни в одном ответе API
- [ ] `.env` отсутствует в репозитории, `.env.example` присутствует
- [ ] `node_modules` отсутствует в репозитории
- [ ] Dockerfile собирается и контейнер запускается
- [ ] `npm run seed` наполняет базу демонстрационными данными

**Документация**

- [ ] README: overview, features, technologies, installation, env variables,
      run commands, API overview, user roles, test accounts, screenshots,
      repository structure, known limitations, future improvements
- [ ] Отчёт: front-end структура, схема БД, контроллеры и маршруты,
      Dockerfile и инструкция запуска, ссылка на репозиторий
- [ ] История коммитов отражает реальную пошаговую разработку

---

## Замечания

**Отчёт — это отдельный документ, не README.** README нужен для запуска проекта,
отчёт — для преподавателя. Часть текста можно переиспользовать, но структура
разная: в отчёте описываются проектные решения и обоснования, в README — команды.

**Optional Integrations действительно опциональны.** Проект сдаётся без Cloudinary
и без Stripe. Добавляй их только после того, как весь обязательный чек-лист закрыт.

**Dockerfile прямо назван в требованиях к отчёту**, поэтому он важнее остальных
пунктов Phase 10.
