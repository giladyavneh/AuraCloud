# Aura Server (AWS Proxy)

Express server that proxies AWS SDK v3 calls for Aura frontend clients.

## Features

- ES Modules (`import`/`export` style)
- CORS enabled for localhost frontend origins
- `POST /fetch-resources` endpoint with two modes:
  - Discovery mode (list top-level resources)
  - Deep Dive mode (inspect a specific resource with `resourceId`)
- Supported services:
  - `S3`
  - `IAM`
  - `SQS`
- Drift-aware error payloads for permission/signature issues

## Run

```bash
cd /Users/amit.reich/WebstormProjects/Aura-Cloud-Dummy/Aura-Server
npm start
```

Server runs on `http://localhost:3001`.

## API

### `POST /fetch-resources`

Required request fields:

```json
{
  "accessKeyId": "...",
  "secretAccessKey": "...",
  "sessionToken": "...",
  "region": "us-east-1",
  "serviceType": "S3"
}
```

Optional field for Deep Dive mode:

```json
{
  "resourceId": "..."
}
```

`serviceType` must be one of: `S3`, `IAM`, `SQS`.

### Discovery Mode (no `resourceId`)

Returns:
- `S3`: bucket list
- `IAM`: user list
- `SQS`: queue URL list

Success shape:

```json
{
  "ok": true,
  "serviceType": "S3",
  "mode": "discovery",
  "resourceId": null,
  "resources": [],
  "logicEngine": {
    "serviceType": "S3",
    "mode": "discovery",
    "expected": "resource array",
    "actual": "resource array",
    "isMatch": true,
    "discoveredCount": 0
  }
}
```

### Deep Dive Mode (`resourceId` present)

Per service action:
- `S3`: `GetObject` on key `images.webp` from bucket `resourceId`
- `IAM`: `ListUserPolicies` for user `resourceId`
- `SQS`: `GetQueueAttributes` (`AttributeNames: ["All"]`) for queue URL `resourceId`

Success shape:

```json
{
  "ok": true,
  "serviceType": "IAM",
  "mode": "deep-dive",
  "resourceId": "example-user",
  "result": {},
  "logicEngine": {
    "serviceType": "IAM",
    "mode": "deep-dive",
    "expected": "single resource detail object",
    "actual": "single resource detail object",
    "isMatch": true,
    "discoveredCount": 1
  }
}
```

### Error shape

```json
{
  "ok": false,
  "error": {
    "name": "AccessDenied",
    "message": "User is not authorized to perform this action",
    "driftSeverity": "critical",
    "driftReason": "Critical Permission Drift detected for S3 (example-bucket)."
  }
}
```

Notes:
- AccessDenied/403-style failures are mapped to permission drift metadata.
- Signature failures can return high-severity credential drift metadata.

## Quick Curl Examples

### S3 discovery

```bash
curl -X POST http://localhost:3001/fetch-resources \
  -H "Content-Type: application/json" \
  -d '{
    "accessKeyId":"YOUR_KEY",
    "secretAccessKey":"YOUR_SECRET",
    "sessionToken":"YOUR_SESSION_TOKEN",
    "region":"us-east-1",
    "serviceType":"S3"
  }'
```

### IAM discovery

```bash
curl -X POST http://localhost:3001/fetch-resources \
  -H "Content-Type: application/json" \
  -d '{
    "accessKeyId":"YOUR_KEY",
    "secretAccessKey":"YOUR_SECRET",
    "sessionToken":"YOUR_SESSION_TOKEN",
    "region":"us-east-1",
    "serviceType":"IAM"
  }'
```

### SQS discovery

```bash
curl -X POST http://localhost:3001/fetch-resources \
  -H "Content-Type: application/json" \
  -d '{
    "accessKeyId":"YOUR_KEY",
    "secretAccessKey":"YOUR_SECRET",
    "sessionToken":"YOUR_SESSION_TOKEN",
    "region":"us-east-1",
    "serviceType":"SQS"
  }'
```

### S3 Deep Dive (inspect bucket)

```bash
curl -X POST http://localhost:3001/fetch-resources \
  -H "Content-Type: application/json" \
  -d '{
    "accessKeyId":"YOUR_KEY",
    "secretAccessKey":"YOUR_SECRET",
    "sessionToken":"YOUR_SESSION_TOKEN",
    "region":"us-east-1",
    "serviceType":"S3",
    "resourceId":"YOUR_BUCKET_NAME"
  }'
```

### IAM Deep Dive (inspect user)

```bash
curl -X POST http://localhost:3001/fetch-resources \
  -H "Content-Type: application/json" \
  -d '{
    "accessKeyId":"YOUR_KEY",
    "secretAccessKey":"YOUR_SECRET",
    "sessionToken":"YOUR_SESSION_TOKEN",
    "region":"us-east-1",
    "serviceType":"IAM",
    "resourceId":"YOUR_USER_NAME"
  }'
```

### SQS Deep Dive (inspect queue)

```bash
curl -X POST http://localhost:3001/fetch-resources \
  -H "Content-Type: application/json" \
  -d '{
    "accessKeyId":"YOUR_KEY",
    "secretAccessKey":"YOUR_SECRET",
    "sessionToken":"YOUR_SESSION_TOKEN",
    "region":"us-east-1",
    "serviceType":"SQS",
    "resourceId":"https://sqs.us-east-1.amazonaws.com/123456789012/example-queue"
  }'
```

