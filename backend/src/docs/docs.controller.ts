import {
  Controller,
  Get,
  Header,
} from "@nestjs/common";

const swaggerUiHtml = `<!doctype html>
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

@Controller("docs")
export class DocsController {
  @Get()
  @Header(
    "Content-Type",
    "text/html; charset=utf-8",
  )
  @Header(
    "Content-Security-Policy",
    "default-src 'self'; style-src 'self' 'unsafe-inline' https://unpkg.com; script-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https:; font-src 'self' data: https://unpkg.com; connect-src 'self'",
  )
  getDocs() {
    return swaggerUiHtml;
  }

  @Get("openapi.json")
  getOpenApiDocument() {
    const serverUrl =
      process.env.RENDER_EXTERNAL_URL ||
      "https://business-nuggets-api.onrender.com";

    return {
      openapi: "3.0.3",
      info: {
        title: "Business Nuggets API",
        version: "1.0.0",
        description:
          "Interactive reference for the core Business Nuggets authentication, member, Nugget and Paystack endpoints.",
      },
      servers: [
        {
          url: serverUrl,
          description: "Business Nuggets API",
        },
      ],
      tags: [
        {
          name: "Authentication",
        },
        {
          name: "Users",
        },
        {
          name: "Nuggets",
        },
        {
          name: "Payments",
        },
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
        schemas: {
          RegisterRequest: {
            type: "object",
            required: [
              "name",
              "email",
              "password",
            ],
            properties: {
              name: {
                type: "string",
                example: "Test User",
              },
              email: {
                type: "string",
                format: "email",
                example: "user@example.com",
              },
              password: {
                type: "string",
                format: "password",
              },
            },
          },
          LoginRequest: {
            type: "object",
            required: [
              "email",
              "password",
            ],
            properties: {
              email: {
                type: "string",
                format: "email",
              },
              password: {
                type: "string",
                format: "password",
              },
              twoFactorToken: {
                type: "string",
                nullable: true,
              },
              recoveryCode: {
                type: "string",
                nullable: true,
              },
            },
          },
          PaymentInitializeRequest: {
            type: "object",
            required: [
              "planSlug",
            ],
            properties: {
              planSlug: {
                type: "string",
                example: "premium-monthly",
              },
            },
          },
        },
      },
      paths: {
        "/auth/register": {
          post: {
            tags: [
              "Authentication",
            ],
            summary: "Register a user",
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/RegisterRequest",
                  },
                },
              },
            },
            responses: {
              "201": {
                description: "User registered",
              },
              "400": {
                description: "Invalid registration data",
              },
            },
          },
        },
        "/auth/login": {
          post: {
            tags: [
              "Authentication",
            ],
            summary: "Log in and obtain an access token",
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/LoginRequest",
                  },
                },
              },
            },
            responses: {
              "200": {
                description: "Login response",
              },
              "401": {
                description: "Invalid credentials or 2FA required",
              },
            },
          },
        },
        "/auth/logout": {
          post: {
            tags: [
              "Authentication",
            ],
            summary: "Log out the current session",
            security: [
              {
                bearerAuth: [],
              },
            ],
            responses: {
              "200": {
                description: "Session revoked",
              },
              "401": {
                description: "Unauthorized",
              },
            },
          },
        },
        "/auth/sessions": {
          get: {
            tags: [
              "Authentication",
            ],
            summary: "List signed-in sessions",
            security: [
              {
                bearerAuth: [],
              },
            ],
            responses: {
              "200": {
                description: "Session list",
              },
            },
          },
        },
        "/auth/forgot-password": {
          post: {
            tags: [
              "Authentication",
            ],
            summary: "Request a password reset",
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: [
                      "email",
                    ],
                    properties: {
                      email: {
                        type: "string",
                        format: "email",
                      },
                    },
                  },
                },
              },
            },
            responses: {
              "201": {
                description: "Reset request accepted",
              },
            },
          },
        },
        "/auth/reset-password": {
          post: {
            tags: [
              "Authentication",
            ],
            summary: "Reset a password",
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: [
                      "token",
                      "newPassword",
                    ],
                    properties: {
                      token: {
                        type: "string",
                      },
                      newPassword: {
                        type: "string",
                        format: "password",
                      },
                    },
                  },
                },
              },
            },
            responses: {
              "201": {
                description: "Password reset",
              },
            },
          },
        },
        "/users/me": {
          get: {
            tags: [
              "Users",
            ],
            summary: "Get the current user",
            security: [
              {
                bearerAuth: [],
              },
            ],
            responses: {
              "200": {
                description: "Current user profile",
              },
              "401": {
                description: "Unauthorized",
              },
            },
          },
          patch: {
            tags: [
              "Users",
            ],
            summary: "Update the current user profile",
            security: [
              {
                bearerAuth: [],
              },
            ],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    additionalProperties: true,
                  },
                },
              },
            },
            responses: {
              "200": {
                description: "Profile updated",
              },
            },
          },
          delete: {
            tags: [
              "Users",
            ],
            summary: "Delete the current account",
            security: [
              {
                bearerAuth: [],
              },
            ],
            responses: {
              "200": {
                description: "Account deleted",
              },
            },
          },
        },
        "/users/me/preferences": {
          get: {
            tags: [
              "Users",
            ],
            summary: "Get member preferences",
            security: [
              {
                bearerAuth: [],
              },
            ],
            responses: {
              "200": {
                description: "Preferences",
              },
            },
          },
          patch: {
            tags: [
              "Users",
            ],
            summary: "Update member preferences",
            security: [
              {
                bearerAuth: [],
              },
            ],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      interests: {
                        type: "array",
                        items: {
                          type: "string",
                        },
                      },
                      wisdomNeeds: {
                        type: "array",
                        items: {
                          type: "string",
                        },
                      },
                    },
                  },
                },
              },
            },
            responses: {
              "200": {
                description: "Preferences updated",
              },
            },
          },
        },
        "/nuggets": {
          get: {
            tags: [
              "Nuggets",
            ],
            summary: "List published Nuggets",
            description:
              "Authentication is optional. Premium users receive full entitled content while free/guest access is restricted by the membership rules.",
            parameters: [
              "search",
              "topic",
              "book",
              "bibleSection",
              "gold",
              "featured",
              "sort",
              "page",
              "limit",
            ].map((name) => ({
              name,
              in: "query",
              required: false,
              schema: {
                type: "string",
              },
            })),
            responses: {
              "200": {
                description: "Published Nugget list",
              },
            },
          },
        },
        "/nuggets/{slug}": {
          get: {
            tags: [
              "Nuggets",
            ],
            summary: "Get a published Nugget by slug",
            parameters: [
              {
                name: "slug",
                in: "path",
                required: true,
                schema: {
                  type: "string",
                },
              },
            ],
            responses: {
              "200": {
                description: "Nugget",
              },
              "403": {
                description: "Premium membership required",
              },
              "404": {
                description: "Nugget not found",
              },
            },
          },
        },
        "/payments/plans": {
          get: {
            tags: [
              "Payments",
            ],
            summary: "List active subscription plans",
            responses: {
              "200": {
                description: "Subscription plans",
              },
            },
          },
        },
        "/payments/initialize": {
          post: {
            tags: [
              "Payments",
            ],
            summary: "Initialize a Paystack payment",
            security: [
              {
                bearerAuth: [],
              },
            ],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/PaymentInitializeRequest",
                  },
                },
              },
            },
            responses: {
              "201": {
                description: "Paystack checkout URL and reference",
              },
              "401": {
                description: "Unauthorized",
              },
            },
          },
        },
        "/payments/verify/{reference}": {
          get: {
            tags: [
              "Payments",
            ],
            summary: "Verify a Paystack payment for the current user",
            security: [
              {
                bearerAuth: [],
              },
            ],
            parameters: [
              {
                name: "reference",
                in: "path",
                required: true,
                schema: {
                  type: "string",
                },
              },
            ],
            responses: {
              "200": {
                description: "Verified payment and updated membership",
              },
              "400": {
                description: "Payment incomplete or mismatch",
              },
              "401": {
                description: "Unauthorized",
              },
            },
          },
        },
        "/payments/webhook": {
          post: {
            tags: [
              "Payments",
            ],
            summary: "Paystack webhook receiver",
            description:
              "Called by Paystack. Requests require a valid x-paystack-signature and are not intended for normal manual testing.",
            responses: {
              "201": {
                description: "Webhook received",
              },
              "401": {
                description: "Invalid Paystack signature",
              },
            },
          },
        },
      },
    };
  }
}
