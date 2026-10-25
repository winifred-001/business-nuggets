import "dotenv/config";

import {
  ValidationPipe,
} from "@nestjs/common";

import {
  NestFactory,
} from "@nestjs/core";

import helmet from "helmet";

import {
  AppModule,
} from "./app.module";

const docsHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Business Nuggets API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      html { box-sizing: border-box; overflow-y: scroll; }
      *, *::before, *::after { box-sizing: inherit; }
      body { margin: 0; background: #faf9f6; }
      .swagger-ui .topbar { background: #080808; }
      .swagger-ui .topbar-wrapper img { display: none; }
      .swagger-ui .topbar-wrapper::before {
        content: "BUSINESS NUGGETS API";
        color: #e0c48a;
        font: 700 15px/1.2 Arial, sans-serif;
        letter-spacing: .08em;
      }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = () => {
        SwaggerUIBundle({
          url: "/docs/openapi.json",
          dom_id: "#swagger-ui",
          deepLinking: true,
          persistAuthorization: true,
          displayRequestDuration: true,
          tryItOutEnabled: true,
          filter: true,
        });
      };
    </script>
  </body>
</html>`;

function createOpenApiDocument() {
  const serverUrl =
    process.env.RENDER_EXTERNAL_URL ||
    "https://business-nuggets-api.onrender.com";

  return {
    openapi: "3.0.3",
    info: {
      title: "Business Nuggets API",
      version: "1.0.0",
      description:
        "Interactive API documentation for the Business Nuggets backend.",
    },
    servers: [
      {
        url: serverUrl,
        description: "Business Nuggets API",
      },
    ],
    tags: [
      { name: "Authentication" },
      { name: "Users" },
      { name: "Nuggets" },
      { name: "Payments" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Paste the JWT access token returned by login.",
        },
      },
    },
    paths: {
      "/auth/register": {
        post: {
          tags: ["Authentication"],
          summary: "Register a user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email", "password"],
                  properties: {
                    name: { type: "string" },
                    email: { type: "string", format: "email" },
                    password: { type: "string", format: "password" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "User registered" },
            "400": { description: "Invalid registration data" },
          },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Authentication"],
          summary: "Log in and obtain an access token",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string", format: "password" },
                    twoFactorToken: { type: "string", nullable: true },
                    recoveryCode: { type: "string", nullable: true },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Login response" },
            "401": { description: "Invalid credentials or 2FA required" },
          },
        },
      },
      "/auth/logout": {
        post: {
          tags: ["Authentication"],
          summary: "Log out the current session",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "Session revoked" },
            "401": { description: "Unauthorized" },
          },
        },
      },
      "/users/me": {
        get: {
          tags: ["Users"],
          summary: "Get the current user",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "Current user profile" },
            "401": { description: "Unauthorized" },
          },
        },
        patch: {
          tags: ["Users"],
          summary: "Update the current user profile",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "Profile updated" },
            "401": { description: "Unauthorized" },
          },
        },
      },
      "/nuggets": {
        get: {
          tags: ["Nuggets"],
          summary: "List published Nuggets",
          description:
            "Authentication is optional. Premium members receive full entitled content.",
          responses: {
            "200": { description: "Published Nugget list" },
          },
        },
      },
      "/nuggets/{slug}": {
        get: {
          tags: ["Nuggets"],
          summary: "Get a published Nugget by slug",
          parameters: [
            {
              name: "slug",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": { description: "Nugget" },
            "403": { description: "Premium membership required" },
            "404": { description: "Nugget not found" },
          },
        },
      },
      "/payments/plans": {
        get: {
          tags: ["Payments"],
          summary: "List active subscription plans",
          responses: {
            "200": { description: "Subscription plans" },
          },
        },
      },
      "/payments/initialize": {
        post: {
          tags: ["Payments"],
          summary: "Initialize a Paystack payment",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["planSlug"],
                  properties: {
                    planSlug: {
                      type: "string",
                      example: "premium-monthly",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Paystack checkout URL and reference" },
            "401": { description: "Unauthorized" },
          },
        },
      },
      "/payments/verify/{reference}": {
        get: {
          tags: ["Payments"],
          summary: "Verify a Paystack payment",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "reference",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": { description: "Verified payment and updated membership" },
            "400": { description: "Payment incomplete or mismatch" },
            "401": { description: "Unauthorized" },
          },
        },
      },
    },
  };
}

async function bootstrap() {
  const app =
    await NestFactory.create(
      AppModule,
      {
        rawBody: true,
      },
    );

  /* =========================================================
     TRUSTED PROXY
  ========================================================= */

  const expressApp =
    app
      .getHttpAdapter()
      .getInstance();

  const trustedProxyHops =
    Number.parseInt(
      process.env
        .TRUST_PROXY_HOPS ??
        "0",
      10,
    );

  if (
    Number.isFinite(
      trustedProxyHops,
    ) &&
    trustedProxyHops > 0
  ) {
    expressApp.set(
      "trust proxy",
      trustedProxyHops,
    );
  }

  /* =========================================================
     SECURITY HEADERS
  ========================================================= */

  app.use(
    helmet(),
  );

  /* =========================================================
     REQUEST VALIDATION
  ========================================================= */

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:
        true,

      transform:
        true,

      forbidNonWhitelisted:
        true,
    }),
  );

  /* =========================================================
     CORS
  ========================================================= */

  const configuredOrigins = [
    process.env.FRONTEND_URL,
    ...(process.env.FRONTEND_URLS ?? "")
      .split(",")
      .map((origin) => origin.trim()),
  ].filter(Boolean) as string[];

  const apiOrigins = [
    process.env.RENDER_EXTERNAL_URL,
    process.env.BACKEND_URL,
    process.env.API_URL,
  ].filter(Boolean) as string[];

  const allowedOrigins = new Set([
    "http://localhost:3000",
    "https://business-nuggets-theta.vercel.app",
    "https://business-nuggets-chioms.vercel.app",
    "https://business-nuggets-git-main-chioms.vercel.app",
    "https://business-nuggets-api.onrender.com",
    ...configuredOrigins,
    ...apiOrigins,
  ]);

  const businessNuggetsDeploymentOrigin =
    /^https:\/\/business-nuggets(?:-[a-z0-9-]+)?-chioms\.vercel\.app$/i;

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (
        error: Error | null,
        allow?: boolean,
      ) => void,
    ) => {
      if (
        !origin ||
        allowedOrigins.has(origin) ||
        businessNuggetsDeploymentOrigin.test(origin)
      ) {
        callback(null, true);
        return;
      }

      callback(
        new Error(
          "Origin not allowed by CORS",
        ),
      );
    },

    credentials:
      true,

    methods: [
      "GET",
      "POST",
      "PATCH",
      "PUT",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  });

  /* =========================================================
     API DOCS
  ========================================================= */

  expressApp.get(
    "/docs/openapi.json",
    (_req: any, res: any) => {
      res
        .status(200)
        .type("application/json")
        .send(
          createOpenApiDocument(),
        );
    },
  );

  expressApp.get(
    "/docs",
    (_req: any, res: any) => {
      res
        .status(200)
        .set(
          "Content-Security-Policy",
          "default-src 'self'; style-src 'self' 'unsafe-inline' https://unpkg.com; script-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https:; font-src 'self' data: https://unpkg.com; connect-src 'self'",
        )
        .type("html")
        .send(docsHtml);
    },
  );

  /* =========================================================
     SERVER
  ========================================================= */

  const port =
    Number(
      process.env.PORT ??
      3001,
    );

  await app.listen(
    port,
    "0.0.0.0",
  );

  console.log(
    `Business Nuggets API running on port ${port}`,
  );

  console.log(
    "API docs available at /docs",
  );
}

void bootstrap();
