# city-outlook-service

Outlook / Microsoft 365 integration for City Mortgage AI Platform.

## Endpoints
- GET  /health
- GET  /test-auth
- GET|POST /sync-emails
- POST /analyze-email   (proxies to city-ai-core via service binding)

## Secrets
- GRAPH_TENANT_ID
- GRAPH_CLIENT_ID
- GRAPH_CLIENT_SECRET

## Bindings
- CITY_AI_CORE (service binding to city-ai-core Worker)

## Structure
See platform spec: config / routes / services / models / helpers / tests

## Not yet built (Sprint 2)
- Writing categories back to Outlook is implemented in services/graphMail.js
  (updateEmailCategories) but not yet wired to a route. Sprint 2 adds the
  route + orchestration to auto-tag inbox emails.
