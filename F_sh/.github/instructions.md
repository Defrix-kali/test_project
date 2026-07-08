# Руководство — FlowerShop (минимальный проект)

Кратко: одностраничный фронтенд (в `wwwroot/`) и минимальный бэкенд на ASP.NET Core с EF Core + SQLite (файл базы: `flowers.db`). Фронтенд — чистый HTML/CSS/vanilla JS, API реализованы в `Program.cs`.

Ключевые файлы:
- `Program.cs` — вся логика API, маршруты и контракты.
- `AppDbContext.cs` — модели сущностей и конфигурация EF Core.
- `FlowerShop.csproj` — проект .NET (target: net7.0).
- `wwwroot/index.html`, `wwwroot/admin.html`, `wwwroot/seller.html`, `wwwroot/client.html` — страницы фронтенда.
- `wwwroot/script.js` — клиентские вызовы API и UI-логика — синхронизируйте изменения с маршрутами в `Program.cs`.

Архитектура:
- ASP.NET Core отдаёт статические файлы и предоставляет минимальные маршруты через `app.Map*`.
- Для хранения данных используется EF Core с SQLite (`flowers.db`).
- Простая аутентификация: админные операции требуют query-параметров `login`/`password` (хардкод в `Program.cs`), продавцы/клиенты передают креды в теле запроса.

Основные маршруты и контракты (актуально для текущей версии `Program.cs`):
- GET `/api/flowers` — список всех цветов (возвращает поля `Id, SellerId, Name, Description, Price, ImageUrl, Type, Stock`).
- GET `/api/flowers/seller/{sellerId}` — цветы конкретного продавца.
- POST `/api/flowers` — создать цветок (требует в теле JSON: `login`, `password`, `name`, `description`, `price`, `imageUrl`, необязательно `type`, `stock`). Возвращает созданный объект.
- DELETE `/api/flowers/{id}?login=SELLER_LOGIN&password=SELLER_PASS` — удалить цветок продавцом.
- PUT `/api/flowers/{id}` — обновить цветок (в теле: `login`, `password` и поля для обновления `name`, `description`, `price`, `imageUrl`, `type`, `stock`).
- POST `/api/orders` — оформить заказ на единичный товар: `{ flowerId, clientName, address, quantity }`.
- POST `/api/orders/bouquet` — оформить букет: `{ clientName, address, items: [{ productId, quantity }, ...], paperId? }`.
- POST `/api/orders/seller` — получить заказы продавца: `{ login, password }`.
- POST `/api/applications` — создать заявку магазина: `{ name, email, password }`.
- GET `/api/applications?login=admin&password=admin123` — список заявок (admin only).
- PUT `/api/applications/{id}/approve?login=admin&password=admin123` — одобрить заявку и создать магазин.
- PUT `/api/applications/{id}/reject?login=admin&password=admin123` — отклонить заявку.
- POST `/api/seller/login` — логин продавца `{ login, password }` -> возвращает `Shop`.
- POST `/api/admin/login` — логин админа `{ email, password }` (есть хардкодный `admin@flowershop.local` / пароль из `Program.cs`).
- POST `/api/client/register` и POST `/api/client/login` — регистрация/вход клиентов.
- POST `/api/shops` — создание магазина (если в query переданы админные креды — создаёт магазин; иначе сохраняет заявку — backward-compatible).
- GET `/api/shops?login=admin&password=admin123` и DELETE `/api/shops/{id}?login=admin&password=admin123` — управление магазинами (admin only).
- GET `/api/admins?login=admin&password=admin123` — отладочная информация для администратора (логин/пароль, shops, applications).
- GET `/health` — возврат `ok`.
- GET `/api/debug` — отладочный сводный ответ (shops, applications, flowers, orders).

Запуск и тестирование локально:
- Требуется .NET 7 SDK.
- В корне репозитория выполните:
  ```bash
  dotnet run
  ```
- Сервер по умолчанию доступен на `http://localhost:5000`.
- Быстрая проверка работоспособности: `GET /health` → `ok`.

Советы при правках:
- Внесли изменения в модели — обновите `AppDbContext.cs` и миграции/инициализацию базы при необходимости.
- Всегда синхронизируйте `wwwroot/script.js` с изменениями контрактов API.
- Админные креды хардкодятся в `Program.cs` (`ADMIN_LOGIN` / `ADMIN_PASS`). Меняйте осторожно.

Примеры curl (актуальные):
- Получить каталог:
  ```bash
  curl http://localhost:5000/api/flowers
  ```
- Создать заявку магазина:
  ```bash
  curl -X POST http://localhost:5000/api/applications -H 'Content-Type: application/json' -d '{"name":"Shop1","email":"s@e.com","password":"p"}'
  ```
- Одобрить заявку (админ):
  ```bash
  curl -X PUT 'http://localhost:5000/api/applications/<ID>/approve?login=admin&password=admin123'
  ```

Где править при расширении функционала:
- `Program.cs` — маршруты и контракты.
- `AppDbContext.cs` — модели и сохраняемые поля.
- `wwwroot/script.js` + `wwwroot/*.html` — фронтенд-рендер и отправка данных.


Конец файла




1. Критические проблемы безопасности (Fix First)
🚩 Хардкод паролей в коде (Program.cs)

    Проблема: Пароль администратора admin123 прописан прямо в исходном коде. Если ты выложишь проект на GitHub, любой сможет его прочитать.

    Как исправить: Используй переменные окружения или файл appsettings.json (который не попадает в Git), а лучше — User Secrets для локальной разработки.

🚩 Пароли в открытом виде (Plain Text)

    Проблема: Ты хранишь и передаешь пароли (продавцов, клиентов) как обычный текст. Если кто-то получит доступ к flowers.db, он узнает пароли всех пользователей.

    Как исправить: Никогда не храни пароли. Используй хэширование (например, BCrypt или IdentityPasswordHasher). В базу должен записываться только хэш.

🚩 Передача логина/пароля в Query-параметрах

    Проблема: В маршрутах вроде /api/applications?login=admin&password=admin123 пароль светится в истории браузера, в логах сервера и может быть перехвачен.

    Как исправить: Все учетные данные должны передаваться только в теле (Body) POST-запроса или в заголовках (Headers).










  ⚠️ Риски архитектуры:

    Отсутствие JWT/Cookies: Сейчас ты, скорее всего, проверяешь пароль при каждом запросе. Это нагружает базу и небезопасно.

        Совет: Реализуй простую авторизацию через токены (JWT). Пользователь логинится один раз, получает токен и дальше ходит с ним.

    Валидация данных: Проверяй не только наличие полей, но и их содержимое (например, чтобы цена не была отрицательной, а ImageUrl действительно был ссылкой).
    
