# Promotor+: zarządzanie pracami dyplomowymi

## Funkcje i technologie

- ⚡ [**FastAPI**](https://fastapi.tiangolo.com) dla backendu API w Pythonie.
    - 🧰 [SQLModel](https://sqlmodel.tiangolo.com) do interakcji z bazą danych SQL w Pythonie (ORM).
    - 🔍 [Pydantic](https://docs.pydantic.dev), używany przez FastAPI, do walidacji danych i zarządzania ustawieniami.
    - 💾 [PostgreSQL](https://www.postgresql.org) jako baza danych SQL.
- 🚀 [React](https://react.dev) dla frontendu.
    - 💃 Użycie TypeScript, hooks, Vite i innych elementów nowoczesnego stosu frontendowego.
    - 🎨 [Chakra UI](https://chakra-ui.com) dla komponentów frontendowych.
    - 🦇 Wsparcie dla trybu ciemnego.
- 🐋 [Docker Compose](https://www.docker.com) dla rozwoju i produkcji.
- 🔒 Domyślnie bezpieczne hashowanie haseł.
- 🔑 Uwierzytelnianie JWT (JSON Web Token).
- ✅ Testy z [Pytest](https://pytest.org).
- 📞 [Traefik](https://traefik.io) jako reverse proxy / load balancer.
- 🏭 CI (ciągła integracja) i CD (ciągłe wdrażanie) oparte na GitHub Actions.

## Instalacja zależności

Wymagane oprogramowanie w celu lokalnego uruchomienia:
- [Node.js](https://nodejs.org/en/download)
- [Astral UV](https://docs.astral.sh/uv/getting-started/installation/)
- [Docker Engine](https://docs.docker.com/engine/install/)


## Lokalne uruchomienie aplikacji

Uruchomienie
```bash
cd frontend/
npm install
docker compose up -d
uv run ../populate_db.py
npm run dev
```

Zatrzymanie i czyszczenie bazy
```bash
docker compose down
docker volume rm io-agh-2025_app-db-data
```

### Autoryzacja
Standardowo w wersji lokalnej **hasło do każdego konta oraz serwisu** to `changethis`
Przykładowe **adresy email** to `student1@example.com` .. `student7@example.com`
oraz `promoter1@example.com` .. `promoter4@example.com`

### Frontend
Aplikacja powinna uruchomić się pod poniższym adresem, jednak możliwe, że został wybrany inny port, co należy zaobserwować w terminalu:
- http://localhost:5173/

### OpenAPI
Dostęp do dokumentacji API dostępny będzie pod adresem:
- http://localhost:8000/docs

### Baza danych
Webowy interfejs bazy danych jest dostępny pod adresem (hasło to `changethis`):
- http://localhost:8080/?pgsql=db&username=postgres&db=app


## Wygląd aplikacji

### Ekran logowania

![API docs](img/login.png)

### Ekran główny

![API docs](img/dashboard.png)
