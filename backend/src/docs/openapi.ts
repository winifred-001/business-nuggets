const bearerSecurity = [{ bearerAuth: [] }];
const optionalBearerSecurity = [{ bearerAuth: [] }, {}];

const jsonBody = (schema: Record<string, unknown>, required = true) => ({
  required,
  content: {
    "application/json": {
      schema,
    },
  },
});

const pathParam = (
  name: string,
  type: "string" | "integer" = "string",
  description?: string,
) => ({
  name,
  in: "path",
  required: true,
  ...(description ? { description } : {}),
  schema: { type },
});

const queryParam = (
  name: string,
  type: "string" | "integer" | "boolean" = "string",
  description?: string,
) => ({
  name,
  in: "query",
  required: false,
  ...(description ? { description } : {}),
  schema: { type },
});

const ok = (description = "Success") => ({
  "200": { description },
});

const protectedResponses = (description = "Success") => ({
  "200": { description },
  "401": { description: "Unauthorized" },
  "403": { description: "Forbidden" },
});

export const docsHtml = `<!doctype html>
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
      .swagger-ui .info .title { font-family: Georgia, serif; }
      .swagger-ui .opblock-tag { font-family: Georgia, serif; }
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
          tagsSorter: "alpha",
          operationsSorter: "method",
        });
      };
    </script>
  </body>
</html>`;

export function createOpenApiDocument() {
  const serverUrl =
    process.env.RENDER_EXTERNAL_URL ||
    "https://business-nuggets-api.onrender.com";

  const nuggetInputSchema = {
    type: "object",
    required: [
      "number",
      "slug",
      "title",
      "topic",
      "tag",
      "scriptureRef",
      "scriptureText",
      "image",
      "keyPrinciple",
      "marketplaceApplication",
      "practicalActionPlan",
      "duration",
      "book",
      "bibleSection",
      "challenges",
    ],
    properties: {
      number: { type: "integer", example: 73 },
      slug: { type: "string", example: "the-leader-sets-the-tone" },
      title: { type: "string", example: "The leader sets the tone" },
      topic: { type: "string", example: "Leadership" },
      tag: { type: "string", example: "leadership" },
      scriptureRef: { type: "string", example: "Proverbs 23:7" },
      scriptureText: { type: "string" },
      image: { type: "string", example: "https://..." },
      keyPrinciple: { type: "string" },
      marketplaceApplication: { type: "string" },
      practicalActionPlan: {
        type: "array",
        items: { type: "string" },
      },
      duration: { type: "string", example: "5 min" },
      isGold: { type: "boolean", default: false },
      book: { type: "string", example: "Proverbs" },
      bibleSection: { type: "string", example: "Wisdom Literature" },
      challenges: {
        type: "array",
        items: { type: "string" },
      },
      status: {
        type: "string",
        enum: ["draft", "published"],
        default: "draft",
      },
      featured: { type: "boolean", default: false },
      audioUrl: { type: "string", nullable: true },
      publishedAt: { type: "string", format: "date-time", nullable: true },
    },
  };

  return {
    openapi: "3.0.3",
    info: {
      title: "Business Nuggets API",
      version: "1.1.0",
      description:
        "Interactive API documentation for the Business Nuggets backend. Use Authorize with the JWT access token returned by /auth/login for protected routes. Admin routes also require an admin account with the appropriate permission.",
    },
    servers: [
      {
        url: serverUrl,
        description: "Business Nuggets API",
      },
    ],
    tags: [
      { name: "System" },
      { name: "Authentication" },
      { name: "Users" },
      { name: "Nuggets" },
      { name: "Saved Nuggets" },
      { name: "Saved Folders" },
      { name: "Playlists" },
      { name: "Notes" },
      { name: "History" },
      { name: "Following" },
      { name: "Notifications" },
      { name: "Push Notifications" },
      { name: "Comments" },
      { name: "Analytics" },
      { name: "Mobile" },
      { name: "Settings" },
      { name: "Media" },
      { name: "Payments" },
      { name: "Admin - Nuggets" },
      { name: "Admin - Topics" },
      { name: "Admin - Scripture" },
      { name: "Admin - Schedule" },
      { name: "Admin - Users" },
      { name: "Admin - Subscriptions" },
      { name: "Admin - Moderation" },
      { name: "Admin - Analytics" },
      { name: "Admin - Mobile" },
      { name: "Admin - Notifications" },
      { name: "Admin - Roles" },
      { name: "Admin - Audit Logs" },
      { name: "Admin - Settings" },
      { name: "Admin - Media" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Paste the JWT access token returned by login.",
        },
      },
      schemas: {
        NuggetInput: nuggetInputSchema,
        ErrorResponse: {
          type: "object",
          properties: {
            statusCode: { type: "integer" },
            message: {
              oneOf: [
                { type: "string" },
                { type: "array", items: { type: "string" } },
              ],
            },
            error: { type: "string" },
          },
        },
      },
    },
    paths: {
      "/": {
        get: {
          tags: ["System"],
          summary: "API root",
          responses: ok("API response"),
        },
      },

      "/auth/register": {
        post: {
          tags: ["Authentication"],
          summary: "Register a user",
          requestBody: jsonBody({
            type: "object",
            required: ["name", "email", "password"],
            properties: {
              name: { type: "string" },
              email: { type: "string", format: "email" },
              password: { type: "string", format: "password" },
            },
          }),
          responses: {
            "201": { description: "User registered" },
            "400": { description: "Invalid registration data" },
            "409": { description: "Account already exists" },
          },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Authentication"],
          summary: "Log in and obtain an access token",
          requestBody: jsonBody({
            type: "object",
            required: ["email", "password"],
            properties: {
              email: { type: "string", format: "email" },
              password: { type: "string", format: "password" },
              twoFactorToken: { type: "string", nullable: true },
              recoveryCode: { type: "string", nullable: true },
            },
          }),
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
          security: bearerSecurity,
          responses: protectedResponses("Session revoked"),
        },
      },
      "/auth/sessions": {
        get: {
          tags: ["Authentication"],
          summary: "List current user's sessions",
          security: bearerSecurity,
          responses: protectedResponses("User sessions"),
        },
      },
      "/auth/sessions/others": {
        delete: {
          tags: ["Authentication"],
          summary: "Revoke all other sessions",
          security: bearerSecurity,
          responses: protectedResponses("Other sessions revoked"),
        },
      },
      "/auth/sessions/{id}": {
        delete: {
          tags: ["Authentication"],
          summary: "Revoke a specific session",
          security: bearerSecurity,
          parameters: [pathParam("id", "integer")],
          responses: protectedResponses("Session revoked"),
        },
      },
      "/auth/2fa/setup": {
        post: {
          tags: ["Authentication"],
          summary: "Begin admin 2FA setup",
          security: bearerSecurity,
          responses: protectedResponses("2FA setup data"),
        },
      },
      "/auth/2fa/confirm": {
        post: {
          tags: ["Authentication"],
          summary: "Confirm admin 2FA setup",
          security: bearerSecurity,
          requestBody: jsonBody({
            type: "object",
            required: ["token"],
            properties: { token: { type: "string", example: "123456" } },
          }),
          responses: protectedResponses("2FA enabled"),
        },
      },
      "/auth/2fa/setup-required": {
        post: {
          tags: ["Authentication"],
          summary: "Begin first-time required admin 2FA setup",
          requestBody: jsonBody({
            type: "object",
            required: ["setupToken"],
            properties: { setupToken: { type: "string" } },
          }),
          responses: ok("2FA setup data"),
        },
      },
      "/auth/2fa/confirm-required": {
        post: {
          tags: ["Authentication"],
          summary: "Confirm first-time required admin 2FA setup",
          requestBody: jsonBody({
            type: "object",
            required: ["setupToken", "token"],
            properties: {
              setupToken: { type: "string" },
              token: { type: "string", example: "123456" },
            },
          }),
          responses: ok("2FA enabled"),
        },
      },
      "/auth/2fa/disable": {
        post: {
          tags: ["Authentication"],
          summary: "Disable admin 2FA",
          security: bearerSecurity,
          requestBody: jsonBody({
            type: "object",
            required: ["token"],
            properties: { token: { type: "string", example: "123456" } },
          }),
          responses: protectedResponses("2FA disabled"),
        },
      },
      "/auth/forgot-password": {
        post: {
          tags: ["Authentication"],
          summary: "Request a password reset",
          requestBody: jsonBody({
            type: "object",
            required: ["email"],
            properties: { email: { type: "string", format: "email" } },
          }),
          responses: ok("Password reset request accepted"),
        },
      },
      "/auth/reset-password": {
        post: {
          tags: ["Authentication"],
          summary: "Reset a password with a reset token",
          requestBody: jsonBody({
            type: "object",
            required: ["token", "newPassword"],
            properties: {
              token: { type: "string" },
              newPassword: { type: "string", format: "password" },
            },
          }),
          responses: ok("Password reset"),
        },
      },

      "/users/me": {
        get: {
          tags: ["Users"],
          summary: "Get the current user",
          security: bearerSecurity,
          responses: protectedResponses("Current user profile"),
        },
        patch: {
          tags: ["Users"],
          summary: "Update the current user profile",
          security: bearerSecurity,
          requestBody: jsonBody({
            type: "object",
            additionalProperties: true,
          }),
          responses: protectedResponses("Profile updated"),
        },
        delete: {
          tags: ["Users"],
          summary: "Delete the current user's account",
          security: bearerSecurity,
          requestBody: jsonBody({
            type: "object",
            required: ["password"],
            properties: { password: { type: "string", format: "password" } },
          }),
          responses: protectedResponses("Account deleted"),
        },
      },
      "/users/me/password": {
        patch: {
          tags: ["Users"],
          summary: "Change the current user's password",
          security: bearerSecurity,
          requestBody: jsonBody({
            type: "object",
            required: ["currentPassword", "newPassword"],
            properties: {
              currentPassword: { type: "string", format: "password" },
              newPassword: { type: "string", format: "password" },
            },
          }),
          responses: protectedResponses("Password changed; sessions revoked"),
        },
      },
      "/users/me/preferences": {
        get: {
          tags: ["Users"],
          summary: "Get user preferences",
          security: bearerSecurity,
          responses: protectedResponses("User preferences"),
        },
        patch: {
          tags: ["Users"],
          summary: "Update user preferences",
          security: bearerSecurity,
          requestBody: jsonBody({
            type: "object",
            properties: {
              interests: { type: "array", items: { type: "string" } },
              wisdomNeeds: { type: "array", items: { type: "string" } },
            },
          }),
          responses: protectedResponses("Preferences updated"),
        },
      },

      "/nuggets": {
        get: {
          tags: ["Nuggets"],
          summary: "List published Nuggets",
          description:
            "Authentication is optional. Premium members receive full entitled content; free/guest responses may contain locked previews.",
          security: optionalBearerSecurity,
          parameters: [
            queryParam("search", "string", "Search title, topic, tag, scripture or content"),
            queryParam("topic"),
            queryParam("book"),
            queryParam("bibleSection"),
            queryParam("gold", "string", "Gold filter"),
            queryParam("featured", "string", "Featured filter"),
            queryParam("sort", "string", "Sort order"),
            queryParam("page", "integer"),
            queryParam("limit", "integer"),
          ],
          responses: ok("Published Nugget list"),
        },
      },
      "/nuggets/{slug}": {
        get: {
          tags: ["Nuggets"],
          summary: "Get a published Nugget by slug",
          security: optionalBearerSecurity,
          parameters: [pathParam("slug")],
          responses: {
            "200": { description: "Nugget" },
            "403": { description: "Premium membership required" },
            "404": { description: "Nugget not found" },
          },
        },
      },

      "/saved-nuggets": {
        get: {
          tags: ["Saved Nuggets"],
          summary: "List saved Nuggets",
          security: bearerSecurity,
          responses: protectedResponses("Saved Nuggets"),
        },
        post: {
          tags: ["Saved Nuggets"],
          summary: "Save a Nugget",
          security: bearerSecurity,
          requestBody: jsonBody({
            type: "object",
            required: ["nuggetId"],
            properties: { nuggetId: { type: "string" } },
          }),
          responses: protectedResponses("Nugget saved"),
        },
      },
      "/saved-nuggets/{nuggetId}": {
        delete: {
          tags: ["Saved Nuggets"],
          summary: "Remove a saved Nugget",
          security: bearerSecurity,
          parameters: [pathParam("nuggetId")],
          responses: protectedResponses("Saved Nugget removed"),
        },
      },

      "/saved-folders": {
        get: {
          tags: ["Saved Folders"],
          summary: "List saved folders",
          security: bearerSecurity,
          responses: protectedResponses("Saved folders"),
        },
        post: {
          tags: ["Saved Folders"],
          summary: "Create a saved folder",
          security: bearerSecurity,
          requestBody: jsonBody({
            type: "object",
            required: ["name"],
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              nuggetIds: { type: "array", items: { type: "string" } },
            },
          }),
          responses: protectedResponses("Folder created"),
        },
      },
      "/saved-folders/{id}/items": {
        post: {
          tags: ["Saved Folders"],
          summary: "Add a Nugget to a saved folder",
          security: bearerSecurity,
          parameters: [pathParam("id", "integer")],
          requestBody: jsonBody({
            type: "object",
            required: ["nuggetId"],
            properties: { nuggetId: { type: "string" } },
          }),
          responses: protectedResponses("Item added"),
        },
      },
      "/saved-folders/{id}/items/{nuggetId}": {
        delete: {
          tags: ["Saved Folders"],
          summary: "Remove a Nugget from a saved folder",
          security: bearerSecurity,
          parameters: [pathParam("id", "integer"), pathParam("nuggetId")],
          responses: protectedResponses("Item removed"),
        },
      },
      "/saved-folders/{id}": {
        delete: {
          tags: ["Saved Folders"],
          summary: "Delete a saved folder",
          security: bearerSecurity,
          parameters: [pathParam("id", "integer")],
          responses: protectedResponses("Folder deleted"),
        },
      },

      "/playlists": {
        get: {
          tags: ["Playlists"],
          summary: "List playlists",
          security: bearerSecurity,
          responses: protectedResponses("Playlists"),
        },
        post: {
          tags: ["Playlists"],
          summary: "Create a playlist",
          security: bearerSecurity,
          requestBody: jsonBody({
            type: "object",
            required: ["name"],
            properties: { name: { type: "string" } },
          }),
          responses: protectedResponses("Playlist created"),
        },
      },
      "/playlists/{id}": {
        patch: {
          tags: ["Playlists"],
          summary: "Rename a playlist",
          security: bearerSecurity,
          parameters: [pathParam("id", "integer")],
          requestBody: jsonBody({
            type: "object",
            required: ["name"],
            properties: { name: { type: "string" } },
          }),
          responses: protectedResponses("Playlist updated"),
        },
        delete: {
          tags: ["Playlists"],
          summary: "Delete a playlist",
          security: bearerSecurity,
          parameters: [pathParam("id", "integer")],
          responses: protectedResponses("Playlist deleted"),
        },
      },
      "/playlists/{id}/items": {
        post: {
          tags: ["Playlists"],
          summary: "Add a Nugget to a playlist",
          security: bearerSecurity,
          parameters: [pathParam("id", "integer")],
          requestBody: jsonBody({
            type: "object",
            required: ["nuggetId"],
            properties: { nuggetId: { type: "string" } },
          }),
          responses: protectedResponses("Item added"),
        },
      },
      "/playlists/{id}/items/{nuggetId}": {
        delete: {
          tags: ["Playlists"],
          summary: "Remove a Nugget from a playlist",
          security: bearerSecurity,
          parameters: [pathParam("id", "integer"), pathParam("nuggetId")],
          responses: protectedResponses("Item removed"),
        },
      },

      "/notes": {
        get: {
          tags: ["Notes"],
          summary: "List notes",
          security: bearerSecurity,
          responses: protectedResponses("Notes"),
        },
        post: {
          tags: ["Notes"],
          summary: "Create a note",
          security: bearerSecurity,
          requestBody: jsonBody({
            type: "object",
            required: ["content"],
            properties: {
              title: { type: "string" },
              content: { type: "string" },
              nuggetId: { type: "string" },
            },
          }),
          responses: protectedResponses("Note created"),
        },
      },
      "/notes/{id}": {
        patch: {
          tags: ["Notes"],
          summary: "Update a note",
          security: bearerSecurity,
          parameters: [pathParam("id", "integer")],
          requestBody: jsonBody({
            type: "object",
            properties: {
              title: { type: "string" },
              content: { type: "string" },
              nuggetId: { type: "string" },
            },
          }),
          responses: protectedResponses("Note updated"),
        },
        delete: {
          tags: ["Notes"],
          summary: "Delete a note",
          security: bearerSecurity,
          parameters: [pathParam("id", "integer")],
          responses: protectedResponses("Note deleted"),
        },
      },

      "/history": {
        get: {
          tags: ["History"],
          summary: "Get reading history",
          security: bearerSecurity,
          responses: protectedResponses("Reading history"),
        },
        post: {
          tags: ["History"],
          summary: "Add or update reading progress",
          security: bearerSecurity,
          requestBody: jsonBody({
            type: "object",
            required: ["nuggetId"],
            properties: {
              nuggetId: { type: "string" },
              progress: { type: "number", example: 50 },
            },
          }),
          responses: protectedResponses("History updated"),
        },
      },
      "/history/{nuggetId}": {
        delete: {
          tags: ["History"],
          summary: "Remove an item from reading history",
          security: bearerSecurity,
          parameters: [pathParam("nuggetId")],
          responses: protectedResponses("History item removed"),
        },
      },

      "/following/topics": {
        get: {
          tags: ["Following"],
          summary: "List followed topics",
          security: bearerSecurity,
          responses: protectedResponses("Followed topics"),
        },
        post: {
          tags: ["Following"],
          summary: "Follow a topic",
          security: bearerSecurity,
          requestBody: jsonBody({
            type: "object",
            required: ["topic"],
            properties: { topic: { type: "string" } },
          }),
          responses: protectedResponses("Topic followed"),
        },
      },
      "/following/topics/{topic}": {
        delete: {
          tags: ["Following"],
          summary: "Unfollow a topic",
          security: bearerSecurity,
          parameters: [pathParam("topic")],
          responses: protectedResponses("Topic unfollowed"),
        },
      },

      "/notifications": {
        get: {
          tags: ["Notifications"],
          summary: "Get the current user's notifications",
          security: bearerSecurity,
          responses: protectedResponses("Notifications"),
        },
      },
      "/notifications/unread-count": {
        get: {
          tags: ["Notifications"],
          summary: "Get unread notification count",
          security: bearerSecurity,
          responses: protectedResponses("Unread count"),
        },
      },
      "/notifications/read-all": {
        patch: {
          tags: ["Notifications"],
          summary: "Mark all notifications as read",
          security: bearerSecurity,
          responses: protectedResponses("All notifications marked read"),
        },
      },
      "/notifications/{id}/read": {
        patch: {
          tags: ["Notifications"],
          summary: "Mark one notification as read",
          security: bearerSecurity,
          parameters: [pathParam("id", "integer")],
          responses: protectedResponses("Notification marked read"),
        },
      },

      "/push-notifications/device": {
        post: {
          tags: ["Push Notifications"],
          summary: "Register a device push token",
          security: bearerSecurity,
          requestBody: jsonBody({
            type: "object",
            additionalProperties: true,
            description: "Push token registration DTO",
          }),
          responses: protectedResponses("Device registered"),
        },
        delete: {
          tags: ["Push Notifications"],
          summary: "Unregister a device push token",
          security: bearerSecurity,
          requestBody: jsonBody({
            type: "object",
            required: ["token"],
            properties: { token: { type: "string" } },
          }),
          responses: protectedResponses("Device unregistered"),
        },
      },

      "/comments/nugget/{nuggetId}": {
        get: {
          tags: ["Comments"],
          summary: "Get approved comments for a Nugget",
          parameters: [pathParam("nuggetId")],
          responses: ok("Approved comments"),
        },
      },
      "/comments": {
        post: {
          tags: ["Comments"],
          summary: "Create a comment",
          security: bearerSecurity,
          requestBody: jsonBody({
            type: "object",
            required: ["nuggetId", "body"],
            properties: {
              nuggetId: { type: "string" },
              body: { type: "string" },
            },
          }),
          responses: protectedResponses("Comment submitted"),
        },
      },
      "/comments/{id}/report": {
        post: {
          tags: ["Comments"],
          summary: "Report a comment",
          security: bearerSecurity,
          parameters: [pathParam("id", "integer")],
          responses: protectedResponses("Comment reported"),
        },
      },

      "/analytics/events": {
        post: {
          tags: ["Analytics"],
          summary: "Record a public analytics event",
          requestBody: jsonBody({
            type: "object",
            required: ["visitorId", "eventType"],
            properties: {
              visitorId: { type: "string" },
              eventType: { type: "string", enum: ["view", "read", "share"] },
              nuggetId: { type: "string" },
              platform: { type: "string" },
              durationSeconds: { type: "number" },
              country: { type: "string" },
            },
          }),
          responses: ok("Event recorded"),
        },
      },
      "/mobile/config": {
        get: {
          tags: ["Mobile"],
          summary: "Get public mobile app configuration",
          responses: ok("Mobile configuration"),
        },
      },
      "/settings/public": {
        get: {
          tags: ["Settings"],
          summary: "Get public application settings",
          responses: ok("Public settings"),
        },
      },

      "/media/cloudinary/{id}": {
        get: {
          tags: ["Media"],
          summary: "Redirect to a Cloudinary media asset",
          parameters: [pathParam("id", "integer")],
          responses: {
            "302": { description: "Redirect to media asset" },
            "404": { description: "File not found" },
          },
        },
      },
      "/media/{filename}": {
        get: {
          tags: ["Media"],
          summary: "Serve a legacy local media asset",
          parameters: [pathParam("filename")],
          responses: {
            "200": { description: "Media file" },
            "404": { description: "File not found" },
          },
        },
      },

      "/payments/plans": {
        get: {
          tags: ["Payments"],
          summary: "List active subscription plans",
          responses: ok("Subscription plans"),
        },
      },
      "/payments/initialize": {
        post: {
          tags: ["Payments"],
          summary: "Initialize a Paystack payment",
          security: bearerSecurity,
          requestBody: jsonBody({
            type: "object",
            required: ["planSlug"],
            properties: {
              planSlug: { type: "string", example: "premium-monthly" },
            },
          }),
          responses: {
            "201": { description: "Paystack checkout URL and reference" },
            "400": { description: "Invalid plan or payment request" },
            "401": { description: "Unauthorized" },
          },
        },
      },
      "/payments/verify/{reference}": {
        get: {
          tags: ["Payments"],
          summary: "Verify a Paystack payment",
          security: bearerSecurity,
          parameters: [pathParam("reference")],
          responses: {
            "200": { description: "Verified payment and updated membership" },
            "400": { description: "Payment incomplete or mismatch" },
            "401": { description: "Unauthorized" },
          },
        },
      },
      "/payments/webhook": {
        post: {
          tags: ["Payments"],
          summary: "Paystack webhook endpoint",
          description: "Called by Paystack. The x-paystack-signature header is verified by the backend.",
          parameters: [
            {
              name: "x-paystack-signature",
              in: "header",
              required: false,
              schema: { type: "string" },
            },
          ],
          requestBody: jsonBody({ type: "object", additionalProperties: true }),
          responses: ok("Webhook accepted"),
        },
      },
      "/callback/paystack": {
        get: {
          tags: ["Payments"],
          summary: "Paystack compatibility callback",
          parameters: [queryParam("reference"), queryParam("trxref")],
          responses: {
            "302": { description: "Redirect to frontend payment callback" },
          },
        },
      },

      "/admin/test": {
        get: {
          tags: ["Admin - Settings"],
          summary: "Verify admin access",
          security: bearerSecurity,
          responses: protectedResponses("Admin access granted"),
        },
      },
      "/admin/nuggets": {
        get: {
          tags: ["Admin - Nuggets"],
          summary: "List all Nuggets for admin",
          security: bearerSecurity,
          responses: protectedResponses("All Nuggets"),
        },
        post: {
          tags: ["Admin - Nuggets"],
          summary: "Create a Nugget",
          security: bearerSecurity,
          requestBody: jsonBody({ $ref: "#/components/schemas/NuggetInput" }),
          responses: {
            "201": { description: "Nugget created" },
            "400": { description: "Validation or free-Nugget limit error" },
            "401": { description: "Unauthorized" },
            "403": { description: "Forbidden" },
          },
        },
      },
      "/admin/nuggets/{id}": {
        patch: {
          tags: ["Admin - Nuggets"],
          summary: "Update a Nugget",
          security: bearerSecurity,
          parameters: [pathParam("id")],
          requestBody: jsonBody({
            allOf: [{ $ref: "#/components/schemas/NuggetInput" }],
          }),
          responses: protectedResponses("Nugget updated"),
        },
        delete: {
          tags: ["Admin - Nuggets"],
          summary: "Delete a Nugget",
          security: bearerSecurity,
          parameters: [pathParam("id")],
          responses: protectedResponses("Nugget deleted"),
        },
      },

      "/admin/topics": {
        get: {
          tags: ["Admin - Topics"],
          summary: "List admin topics",
          security: bearerSecurity,
          responses: protectedResponses("Topics"),
        },
        post: {
          tags: ["Admin - Topics"],
          summary: "Create a topic",
          security: bearerSecurity,
          requestBody: jsonBody({
            type: "object",
            required: ["name"],
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              visible: { type: "boolean" },
            },
          }),
          responses: protectedResponses("Topic created"),
        },
      },
      "/admin/topics/reorder": {
        patch: {
          tags: ["Admin - Topics"],
          summary: "Reorder topics",
          security: bearerSecurity,
          requestBody: jsonBody({
            type: "object",
            required: ["ids"],
            properties: {
              ids: { type: "array", items: { type: "integer" } },
            },
          }),
          responses: protectedResponses("Topics reordered"),
        },
      },
      "/admin/topics/{id}": {
        patch: {
          tags: ["Admin - Topics"],
          summary: "Update a topic",
          security: bearerSecurity,
          parameters: [pathParam("id", "integer")],
          requestBody: jsonBody({
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              visible: { type: "boolean" },
              displayOrder: { type: "integer" },
            },
          }),
          responses: protectedResponses("Topic updated"),
        },
      },

      "/admin/scripture": {
        get: {
          tags: ["Admin - Scripture"],
          summary: "Get Scripture index",
          security: bearerSecurity,
          responses: protectedResponses("Scripture index"),
        },
      },
      "/admin/scripture/books": {
        post: {
          tags: ["Admin - Scripture"],
          summary: "Create a Scripture book",
          security: bearerSecurity,
          requestBody: jsonBody({
            type: "object",
            required: ["name"],
            properties: {
              name: { type: "string" },
              chapterCount: { type: "integer" },
            },
          }),
          responses: protectedResponses("Scripture book created"),
        },
      },
      "/admin/scripture/books/{id}": {
        patch: {
          tags: ["Admin - Scripture"],
          summary: "Update a Scripture book",
          security: bearerSecurity,
          parameters: [pathParam("id", "integer")],
          requestBody: jsonBody({
            type: "object",
            properties: {
              name: { type: "string" },
              chapterCount: { type: "integer" },
              visible: { type: "boolean" },
              displayOrder: { type: "integer" },
            },
          }),
          responses: protectedResponses("Scripture book updated"),
        },
      },

      "/admin/schedule": {
        get: {
          tags: ["Admin - Schedule"],
          summary: "Get publishing schedule",
          security: bearerSecurity,
          responses: protectedResponses("Schedule"),
        },
        post: {
          tags: ["Admin - Schedule"],
          summary: "Create scheduled Nugget",
          security: bearerSecurity,
          requestBody: jsonBody({
            type: "object",
            required: ["nuggetId", "scheduledFor"],
            properties: {
              nuggetId: { type: "string" },
              scheduledFor: { type: "string", format: "date-time" },
            },
          }),
          responses: protectedResponses("Schedule item created"),
        },
      },
      "/admin/schedule/{id}": {
        patch: {
          tags: ["Admin - Schedule"],
          summary: "Update a schedule item",
          security: bearerSecurity,
          parameters: [pathParam("id", "integer")],
          requestBody: jsonBody({
            type: "object",
            required: ["nuggetId", "scheduledFor"],
            properties: {
              nuggetId: { type: "string" },
              scheduledFor: { type: "string", format: "date-time" },
            },
          }),
          responses: protectedResponses("Schedule item updated"),
        },
        delete: {
          tags: ["Admin - Schedule"],
          summary: "Delete a schedule item",
          security: bearerSecurity,
          parameters: [pathParam("id", "integer")],
          responses: protectedResponses("Schedule item deleted"),
        },
      },
      "/admin/schedule/auto-fill": {
        post: {
          tags: ["Admin - Schedule"],
          summary: "Auto-fill the weekly schedule",
          security: bearerSecurity,
          responses: protectedResponses("Schedule auto-filled"),
        },
      },

      "/admin/users": {
        get: {
          tags: ["Admin - Users"],
          summary: "List users for admin",
          security: bearerSecurity,
          responses: protectedResponses("Users"),
        },
        post: {
          tags: ["Admin - Users"],
          summary: "Create a user from admin",
          security: bearerSecurity,
          requestBody: jsonBody({
            type: "object",
            required: ["name", "email", "password"],
            properties: {
              name: { type: "string" },
              email: { type: "string", format: "email" },
              password: { type: "string", format: "password" },
              membershipTier: { type: "string" },
              accountStatus: { type: "string" },
            },
          }),
          responses: protectedResponses("User created"),
        },
      },
      "/admin/users/{id}": {
        patch: {
          tags: ["Admin - Users"],
          summary: "Update a user from admin",
          security: bearerSecurity,
          parameters: [pathParam("id", "integer")],
          requestBody: jsonBody({
            type: "object",
            properties: {
              name: { type: "string" },
              email: { type: "string", format: "email" },
              role: { type: "string" },
              membershipTier: { type: "string" },
              accountStatus: { type: "string" },
            },
          }),
          responses: protectedResponses("User updated"),
        },
      },

      "/admin/subscriptions": {
        get: {
          tags: ["Admin - Subscriptions"],
          summary: "Get subscription overview",
          security: bearerSecurity,
          responses: protectedResponses("Subscription overview"),
        },
      },
      "/admin/subscriptions/plans": {
        post: {
          tags: ["Admin - Subscriptions"],
          summary: "Create a subscription plan",
          security: bearerSecurity,
          requestBody: jsonBody({
            type: "object",
            required: ["name", "slug", "priceCents", "billingCycle"],
            properties: {
              name: { type: "string" },
              slug: { type: "string" },
              priceCents: { type: "integer" },
              currency: { type: "string", example: "NGN" },
              billingCycle: { type: "string" },
              features: { type: "array", items: { type: "string" } },
            },
          }),
          responses: protectedResponses("Subscription plan created"),
        },
      },
      "/admin/subscriptions/plans/{id}": {
        patch: {
          tags: ["Admin - Subscriptions"],
          summary: "Update a subscription plan",
          security: bearerSecurity,
          parameters: [pathParam("id", "integer")],
          requestBody: jsonBody({
            type: "object",
            properties: {
              name: { type: "string" },
              priceCents: { type: "integer" },
              currency: { type: "string" },
              billingCycle: { type: "string" },
              features: { type: "array", items: { type: "string" } },
              active: { type: "boolean" },
            },
          }),
          responses: protectedResponses("Subscription plan updated"),
        },
      },

      "/admin/moderation": {
        get: {
          tags: ["Admin - Moderation"],
          summary: "Get moderation queue",
          security: bearerSecurity,
          responses: protectedResponses("Moderation queue"),
        },
      },
      "/admin/moderation/{id}/status": {
        patch: {
          tags: ["Admin - Moderation"],
          summary: "Update comment moderation status",
          security: bearerSecurity,
          parameters: [pathParam("id", "integer")],
          requestBody: jsonBody({
            type: "object",
            required: ["status"],
            properties: {
              status: {
                type: "string",
                enum: ["pending", "approved", "flagged", "rejected"],
              },
            },
          }),
          responses: protectedResponses("Moderation status updated"),
        },
      },
      "/admin/moderation/{id}/reply": {
        patch: {
          tags: ["Admin - Moderation"],
          summary: "Reply to a comment",
          security: bearerSecurity,
          parameters: [pathParam("id", "integer")],
          requestBody: jsonBody({
            type: "object",
            required: ["reply"],
            properties: { reply: { type: "string" } },
          }),
          responses: protectedResponses("Reply saved"),
        },
      },
      "/admin/moderation/bulk": {
        post: {
          tags: ["Admin - Moderation"],
          summary: "Apply a moderation action in bulk",
          security: bearerSecurity,
          requestBody: jsonBody({
            type: "object",
            required: ["ids", "action"],
            properties: {
              ids: { type: "array", items: { type: "integer" } },
              action: { type: "string", enum: ["approve", "reject", "pending"] },
            },
          }),
          responses: protectedResponses("Bulk action completed"),
        },
      },

      "/admin/analytics": {
        get: {
          tags: ["Admin - Analytics"],
          summary: "Get admin analytics",
          security: bearerSecurity,
          parameters: [queryParam("days", "integer", "Number of days; defaults to 30")],
          responses: protectedResponses("Analytics data"),
        },
      },

      "/admin/mobile": {
        get: {
          tags: ["Admin - Mobile"],
          summary: "Get mobile app admin configuration",
          security: bearerSecurity,
          responses: protectedResponses("Mobile app configuration"),
        },
      },
      "/admin/mobile/settings": {
        patch: {
          tags: ["Admin - Mobile"],
          summary: "Publish mobile app settings",
          security: bearerSecurity,
          requestBody: jsonBody({
            type: "object",
            properties: {
              forceUpdate: { type: "boolean" },
              maintenanceMode: { type: "boolean" },
              offlineReading: { type: "boolean" },
              dailyNuggetWidget: { type: "boolean" },
              homeBannerTitle: { type: "string" },
            },
          }),
          responses: protectedResponses("Mobile settings updated"),
        },
      },
      "/admin/mobile/onboarding/{id}": {
        patch: {
          tags: ["Admin - Mobile"],
          summary: "Update a mobile onboarding item",
          security: bearerSecurity,
          parameters: [pathParam("id", "integer")],
          requestBody: jsonBody({
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
            },
          }),
          responses: protectedResponses("Onboarding item updated"),
        },
      },
      "/admin/mobile/versions/{id}": {
        patch: {
          tags: ["Admin - Mobile"],
          summary: "Update a mobile app version",
          security: bearerSecurity,
          parameters: [pathParam("id", "integer")],
          requestBody: jsonBody({
            type: "object",
            properties: {
              version: { type: "string" },
              installCount: { type: "integer" },
              status: { type: "string" },
            },
          }),
          responses: protectedResponses("Mobile version updated"),
        },
      },

      "/admin/notifications": {
        get: {
          tags: ["Admin - Notifications"],
          summary: "List notification campaigns",
          security: bearerSecurity,
          responses: protectedResponses("Notification campaigns"),
        },
        post: {
          tags: ["Admin - Notifications"],
          summary: "Create a notification campaign",
          security: bearerSecurity,
          requestBody: jsonBody({
            type: "object",
            required: ["title", "message", "audience", "platform"],
            properties: {
              title: { type: "string" },
              message: { type: "string" },
              channel: { type: "string", enum: ["in-app"] },
              audience: { type: "string" },
              platform: { type: "string" },
              sendAt: { type: "string", format: "date-time" },
            },
          }),
          responses: protectedResponses("Notification campaign created"),
        },
      },
      "/admin/notifications/{id}/status": {
        patch: {
          tags: ["Admin - Notifications"],
          summary: "Update notification campaign status",
          security: bearerSecurity,
          parameters: [pathParam("id", "integer")],
          requestBody: jsonBody({
            type: "object",
            required: ["status"],
            properties: { status: { type: "string" } },
          }),
          responses: protectedResponses("Campaign status updated"),
        },
      },

      "/admin/roles/admins": {
        post: {
          tags: ["Admin - Roles"],
          summary: "Create an admin account",
          security: bearerSecurity,
          requestBody: jsonBody({
            type: "object",
            required: ["name", "email", "password", "adminRole"],
            properties: {
              name: { type: "string" },
              email: { type: "string", format: "email" },
              password: { type: "string", format: "password" },
              adminRole: {
                type: "string",
                enum: ["super-admin", "editor", "moderator", "support"],
              },
            },
          }),
          responses: protectedResponses("Admin created"),
        },
      },

      "/admin/audit-logs": {
        get: {
          tags: ["Admin - Audit Logs"],
          summary: "Get audit logs",
          security: bearerSecurity,
          responses: protectedResponses("Audit logs"),
        },
      },

      "/admin/settings": {
        get: {
          tags: ["Admin - Settings"],
          summary: "Get admin application settings",
          security: bearerSecurity,
          responses: protectedResponses("Application settings"),
        },
      },
      "/admin/settings/general": {
        patch: {
          tags: ["Admin - Settings"],
          summary: "Update general application settings",
          security: bearerSecurity,
          requestBody: jsonBody({
            type: "object",
            properties: {
              siteName: { type: "string" },
              tagline: { type: "string" },
              supportEmail: { type: "string", format: "email" },
              timezone: { type: "string" },
              defaultLanguage: { type: "string" },
              dailyPublishTime: { type: "string" },
            },
          }),
          responses: protectedResponses("General settings updated"),
        },
      },
      "/admin/settings/security": {
        patch: {
          tags: ["Admin - Settings"],
          summary: "Update security settings",
          security: bearerSecurity,
          requestBody: jsonBody({
            type: "object",
            properties: {
              twoFactorAdmins: { type: "boolean" },
              sessionTimeoutMinutes: { type: "integer" },
              ipAllowListEnabled: { type: "boolean" },
              ipAllowList: { type: "array", items: { type: "string" } },
            },
          }),
          responses: protectedResponses("Security settings updated"),
        },
      },
      "/admin/settings/maintenance": {
        patch: {
          tags: ["Admin - Settings"],
          summary: "Enable or disable maintenance mode",
          security: bearerSecurity,
          requestBody: jsonBody({
            type: "object",
            required: ["enabled"],
            properties: { enabled: { type: "boolean" } },
          }),
          responses: protectedResponses("Maintenance mode updated"),
        },
      },

      "/admin/media": {
        get: {
          tags: ["Admin - Media"],
          summary: "Get media library",
          security: bearerSecurity,
          responses: protectedResponses("Media library"),
        },
      },
      "/admin/media/folders": {
        post: {
          tags: ["Admin - Media"],
          summary: "Create a media folder",
          security: bearerSecurity,
          requestBody: jsonBody({
            type: "object",
            required: ["name"],
            properties: { name: { type: "string" } },
          }),
          responses: protectedResponses("Media folder created"),
        },
      },
      "/admin/media/upload": {
        post: {
          tags: ["Admin - Media"],
          summary: "Upload an image to the media library",
          security: bearerSecurity,
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["file"],
                  properties: {
                    file: { type: "string", format: "binary" },
                    folderId: { type: "string" },
                  },
                },
              },
            },
          },
          responses: protectedResponses("Image uploaded"),
        },
      },
      "/admin/media/{id}": {
        delete: {
          tags: ["Admin - Media"],
          summary: "Delete a media asset",
          security: bearerSecurity,
          parameters: [pathParam("id", "integer")],
          responses: protectedResponses("Media asset deleted"),
        },
      },
    },
  };
}
