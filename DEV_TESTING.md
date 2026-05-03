# Development Resource Management Testing

These endpoints are for development testing only and are available only when:

- `NODE_ENV=development`

## 1) Thread Pool Verification

On app startup, check logs for:

- `UV_THREADPOOL_SIZE: <value>`

Expected in Docker setup:

- `UV_THREADPOOL_SIZE: 8`

## 2) Rate Limiting Test (`429`)

Endpoint:

- `GET http://localhost:3000/dev-test/rate-limit`

PowerShell:

```powershell
1..10 | ForEach-Object { Invoke-WebRequest -Uri "http://localhost:3000/dev-test/rate-limit" -Method GET }
```

Expected:

- After 5 requests within 60 seconds, responses should start returning `429 Too Many Requests`.

## 3) HTTP Timeout Test (`408`)

Endpoint:

- `GET http://localhost:3000/dev-test/http-timeout`

PowerShell:

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/dev-test/http-timeout" -Method GET
```

Expected:

- Request exceeds 10 seconds and returns `408 Request Timeout`.

## 4) Database Statement Timeout Test

Endpoint:

- `GET http://localhost:3000/dev-test/db-timeout`

PowerShell:

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/dev-test/db-timeout" -Method GET
```

Expected:

- Response indicates DB statement timeout was triggered (query runs `SELECT pg_sleep(12)` while `statement_timeout=10000`).

## 5) Connection Pool Pressure + Check

Load helper endpoint:

- `GET http://localhost:3000/dev-test/db-query`

PowerShell (parallel jobs):

```powershell
1..50 | ForEach-Object {
  Start-Job -ScriptBlock {
    Invoke-WebRequest -Uri "http://localhost:3000/dev-test/db-query" -Method GET
  }
}
```

Check active DB connections:

Endpoint:

- `GET http://localhost:3000/dev-test/db-connections`

PowerShell:

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/dev-test/db-connections" -Method GET
```

Expected:

- Response includes:
  - `activeConnections`
  - `message: "Current database connection count"`
