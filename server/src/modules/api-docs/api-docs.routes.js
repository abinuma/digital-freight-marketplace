import { Router } from "express";
import { openApiDocument } from "./openapi.js";

const router = Router();

const docsContentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "script-src 'self' https://unpkg.com",
  "style-src 'self' https://unpkg.com 'unsafe-inline'",
  "img-src 'self' data: https://unpkg.com",
  "font-src 'self' data: https://unpkg.com",
  "connect-src 'self'",
].join("; ");

router.get("/json", (req, res) => {
  res.set("Cache-Control", "no-cache");
  res.json(openApiDocument);
});

router.get("/ui.js", (req, res) => {
  res
    .type("application/javascript")
    .send(
      "window.addEventListener('load', () => SwaggerUIBundle({ url: '/api/docs/json', dom_id: '#swagger-ui', deepLinking: true, persistAuthorization: false }));",
    );
});

router.get("/", (req, res) => {
  res.set("Content-Security-Policy", docsContentSecurityPolicy);
  res.type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="FETAN Digital Freight Marketplace API reference" />
    <title>FETAN Digital Freight Marketplace API</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
    <script src="/api/docs/ui.js"></script>
  </body>
</html>`);
});

export default router;
