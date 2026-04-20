import express from "express";
import cors from "cors";
import { S3Client, ListBucketsCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { IAMClient, ListUsersCommand, ListUserPoliciesCommand } from "@aws-sdk/client-iam";
import { SQSClient, ListQueuesCommand, GetQueueAttributesCommand } from "@aws-sdk/client-sqs";

const app = express();
const PORT = 3001;

// Allow local frontend apps (localhost/127.0.0.1 on any port) to call this proxy.
app.use(cors((req, callback) => {
  const requestOrigin = req.header("Origin");
  if (!requestOrigin) {
    return callback(null, { origin: true });
  }

  const isLocalhostOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(requestOrigin);
  if (isLocalhostOrigin) {
    return callback(null, { origin: true });
  }

  return callback(new Error("CORS policy blocks this origin."));
}));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "aura-aws-proxy" });
});

app.post("/fetch-resources", async (req, res) => {
  const {
    accessKeyId,
    secretAccessKey,
    sessionToken,
    region,
    serviceType,
    resourceId,
    objectKey,
    download,
  } = req.body ?? {};

  if (!accessKeyId || !secretAccessKey || !sessionToken || !region || !serviceType) {
    return res.status(400).json({
      ok: false,
      error: {
        name: "ValidationError",
        message: "accessKeyId, secretAccessKey, sessionToken, region, and serviceType are required.",
      },
    });
  }

  const normalizedService = String(serviceType).toUpperCase();
  if (!["S3", "IAM", "SQS"].includes(normalizedService)) {
    return res.status(400).json({
      ok: false,
      error: {
        name: "ValidationError",
        message: "serviceType must be one of: S3, IAM, SQS.",
      },
    });
  }

  try {
    const resources = await fetchResourcesByService({
      serviceType: normalizedService,
      region,
      accessKeyId,
      secretAccessKey,
      sessionToken,
      resourceId,
      objectKey,
      download,
    });

    const logicEngine = runLogicEngine({
      serviceType: normalizedService,
      mode: resourceId ? "deep-dive" : "discovery",
      payload: resources,
    });

    return res.status(200).json({
      ok: true,
      serviceType: normalizedService,
      mode: resourceId ? "deep-dive" : "discovery",
      resourceId: resourceId ?? null,
      ...(resourceId ? { result: resources } : { resources }),
      logicEngine,
    });
  } catch (error) {
    const mapped = mapAwsError(error, {
      serviceType: normalizedService,
      resourceId,
      mode: resourceId ? "deep-dive" : "discovery",
    });
    return res.status(mapped.status).json({
      ok: false,
      error: {
        name: mapped.name,
        message: mapped.message,
        driftSeverity: mapped.driftSeverity,
        driftReason: mapped.driftReason,
      },
    });
  }
});

async function fetchResourcesByService({
  serviceType,
  region,
  accessKeyId,
  secretAccessKey,
  sessionToken,
  resourceId,
  objectKey,
  download,
}) {
  const credentials = { accessKeyId, secretAccessKey, sessionToken };

  if (resourceId) {
    return inspectResourceByService({
      serviceType,
      region,
      credentials,
      resourceId,
      objectKey,
      download,
    });
  }

  if (serviceType === "S3") {
    const client = new S3Client({ region, credentials });
    const response = await client.send(new ListBucketsCommand({}));
    return (response.Buckets ?? []).map((bucket) => ({
      name: bucket.Name,
      creationDate: bucket.CreationDate?.toISOString() ?? null,
    }));
  }

  if (serviceType === "IAM") {
    const client = new IAMClient({ region, credentials });
    const users = [];
    let marker = undefined;

    do {
      const response = await client.send(
        new ListUsersCommand({
          Marker: marker,
          MaxItems: 1000,
        })
      );

      users.push(
        ...(response.Users ?? []).map((user) => ({
          userName: user.UserName,
          userId: user.UserId,
          arn: user.Arn,
          createDate: user.CreateDate?.toISOString() ?? null,
        }))
      );

      marker = response.IsTruncated ? response.Marker : undefined;
    } while (marker);

    return users;
  }

  const client = new SQSClient({ region, credentials });
  const queueUrls = [];
  let nextToken = undefined;

  do {
    const response = await client.send(
      new ListQueuesCommand({
        MaxResults: 1000,
        NextToken: nextToken,
      })
    );

    queueUrls.push(...(response.QueueUrls ?? []));
    nextToken = response.NextToken;
  } while (nextToken);

  return queueUrls.map((queueUrl) => ({ queueUrl }));
}

async function inspectResourceByService({
  serviceType,
  region,
  credentials,
  resourceId,
  objectKey,
  download,
}) {
  if (serviceType === "S3") {
    if (!objectKey) {
      const { response, resolvedRegion } = await sendS3CommandWithRegionRetry({
        region,
        credentials,
        bucket: resourceId,
        commandFactory: () => new ListObjectsV2Command({
          Bucket: resourceId,
          MaxKeys: 1000,
        }),
      });

      return {
        bucket: resourceId,
        resolvedRegion,
        objectCount: (response.Contents ?? []).length,
        objects: (response.Contents ?? []).map((item) => ({
          key: item.Key,
          size: item.Size ?? 0,
          lastModified: item.LastModified?.toISOString() ?? null,
          eTag: item.ETag ?? null,
        })),
      };
    }

    const { response, resolvedRegion } = await sendS3CommandWithRegionRetry({
      region,
      credentials,
      bucket: resourceId,
      commandFactory: () => new GetObjectCommand({
        Bucket: resourceId,
        Key: objectKey,
      }),
    });

    const bodyBuffer = await bodyToBuffer(response.Body);
    const contentType = response.ContentType ?? "application/octet-stream";
    const isTextLike = /^text\//.test(contentType) || /^application\/(json|xml|javascript)/.test(contentType);

    return {
      bucket: resourceId,
      key: objectKey,
      resolvedRegion,
      contentType,
      contentLength: response.ContentLength ?? bodyBuffer.length,
      bodyPreview: isTextLike ? bodyBuffer.toString("utf-8") : `[binary ${bodyBuffer.length} bytes]`,
      ...(download
        ? {
            download: {
              fileName: objectKey.split("/").pop() || objectKey,
              contentType,
              base64: bodyBuffer.toString("base64"),
            },
          }
        : {}),
    };
  }

  if (serviceType === "IAM") {
    const client = new IAMClient({ region, credentials });
    const response = await client.send(
      new ListUserPoliciesCommand({
        UserName: resourceId,
      })
    );

    return {
      userName: resourceId,
      policyNames: response.PolicyNames ?? [],
      isTruncated: response.IsTruncated ?? false,
    };
  }

  const client = new SQSClient({ region, credentials });
  const response = await client.send(
    new GetQueueAttributesCommand({
      QueueUrl: resourceId,
      AttributeNames: ["All"],
    })
  );

  return {
    queueUrl: resourceId,
    attributes: response.Attributes ?? {},
  };
}

async function bodyToString(body) {
  if (!body) return "";
  if (typeof body.transformToString === "function") {
    return body.transformToString();
  }

  if (body instanceof Uint8Array) {
    return new TextDecoder().decode(body);
  }

  if (typeof body.on === "function") {
    const chunks = [];
    for await (const chunk of body) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks).toString("utf-8");
  }

  return String(body);
}

async function bodyToBuffer(body) {
  if (!body) return Buffer.alloc(0);

  if (typeof body.transformToByteArray === "function") {
    const byteArray = await body.transformToByteArray();
    return Buffer.from(byteArray);
  }

  if (typeof body.transformToString === "function") {
    const content = await body.transformToString();
    return Buffer.from(content, "utf-8");
  }

  if (body instanceof Uint8Array) {
    return Buffer.from(body);
  }

  if (typeof body.on === "function") {
    const chunks = [];
    for await (const chunk of body) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
  }

  return Buffer.from(String(body), "utf-8");
}

async function sendS3CommandWithRegionRetry({ region, credentials, bucket, commandFactory }) {
  const primaryClient = new S3Client({ region, credentials });
  try {
    return {
      response: await primaryClient.send(commandFactory()),
      resolvedRegion: region,
    };
  } catch (error) {
    const bucketRegion = extractBucketRegionFromError(error);
    const isPermanentRedirect = error?.name === "PermanentRedirect";

    if ((isPermanentRedirect || bucketRegion) && bucketRegion && bucketRegion !== region) {
      const redirectedClient = new S3Client({ region: bucketRegion, credentials });
      return {
        response: await redirectedClient.send(commandFactory()),
        resolvedRegion: bucketRegion,
      };
    }

    throw error;
  }
}

function extractBucketRegionFromError(error) {
  return (
    error?.BucketRegion ||
    error?.bucketRegion ||
    error?.$response?.headers?.["x-amz-bucket-region"] ||
    null
  );
}

function runLogicEngine({ serviceType, mode, payload }) {
  const isArrayPayload = Array.isArray(payload);
  const count = isArrayPayload ? payload.length : 1;
  const expected = mode === "deep-dive" ? "single resource detail object" : "resource array";
  const actual = isArrayPayload ? "resource array" : "single resource detail object";

  return {
    serviceType,
    mode,
    expected,
    actual,
    isMatch: expected === actual,
    discoveredCount: count,
  };
}

function mapAwsError(error, context = {}) {
  const name = error?.name ?? "UnknownError";
  const message = error?.message ?? "Unexpected server error";
  const statusCode = Number(error?.$metadata?.httpStatusCode ?? 0);
  const text = `${name} ${message}`.toLowerCase();
  const isAccessDenied =
    name === "AccessDenied" ||
    name === "AccessDeniedException" ||
    statusCode === 403 ||
    text.includes("accessdenied") ||
    text.includes("not authorized") ||
    text.includes("forbidden");

  const bucketRegion = extractBucketRegionFromError(error);
  const isPermanentRedirect = name === "PermanentRedirect" || text.includes("must be addressed using the specified endpoint");

  if (isPermanentRedirect) {
    return {
      status: 400,
      name,
      message: bucketRegion
        ? `Region mismatch for this S3 bucket. Retry with region: ${bucketRegion}.`
        : "Region mismatch for this S3 bucket. Use the bucket's actual region and try again.",
      driftSeverity: "medium",
      driftReason: "Configuration drift detected: selected region does not match the bucket region.",
    };
  }

  if (isAccessDenied) {
    return {
      status: 403,
      name,
      message,
      driftSeverity: "critical",
      driftReason: `Critical Permission Drift detected for ${context.serviceType ?? "resource"}${context.resourceId ? ` (${context.resourceId})` : ""}.`,
    };
  }

  if (name === "InvalidSignatureException" || name === "SignatureDoesNotMatch") {
    return {
      status: 401,
      name,
      message,
      driftSeverity: "high",
      driftReason: "Credential signature drift detected.",
    };
  }

  return {
    status: 500,
    name,
    message,
  };
}

app.listen(PORT, () => {
  console.log(`Aura AWS proxy server running on http://localhost:${PORT}`);
});


