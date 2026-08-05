import { Router } from "express";
import { mcpAuthRouter } from "@modelcontextprotocol/sdk/server/auth/router.js";
import { OAuthError } from "@modelcontextprotocol/sdk/server/auth/errors.js";
import { ISSUER_URL, MCP_SERVER_URL } from "../config.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { approveAuthorization, describeConsentRequest, oauthProvider } from "../oauth.provider.js";

const router = Router();

// The SDK router's paths are absolute, so this must stay mounted without a prefix.
router.use(
  mcpAuthRouter({
    provider: oauthProvider,
    issuerUrl: new URL(ISSUER_URL),
    // Without this the advertised protected resource would be api-server itself, which
    // only issues the tokens — mcp-server is what they are presented to.
    resourceServerUrl: new URL(MCP_SERVER_URL),
  }),
);

// Behind requireAuth so the registered-client list is not publicly enumerable.
router.get("/api/oauth/consent", requireAuth, async (req, res) => {
  try {
    const { client_id: clientId, redirect_uri: redirectUri } = req.query;

    if (typeof clientId !== "string" || typeof redirectUri !== "string") {
      res.status(400).json({ message: "client_id and redirect_uri are required" });
      return;
    }

    const consent = await describeConsentRequest(clientId, redirectUri);
    if (!consent) {
      res.status(404).json({ message: "Unknown client" });
      return;
    }

    res.json(consent);
  } catch (err) {
    console.error("GET /api/oauth/consent failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/api/oauth/approve", requireAuth, async (req, res) => {
  try {
    const { clientId, redirectUri, codeChallenge, state, scopes } = req.body ?? {};

    if (!clientId || !redirectUri || !codeChallenge) {
      res.status(400).json({
        message: "clientId, redirectUri and codeChallenge are required",
      });
      return;
    }

    const redirectTo = await approveAuthorization({
      customerId: req.customer!.customerId,
      clientId: String(clientId),
      redirectUri: String(redirectUri),
      codeChallenge: String(codeChallenge),
      scopes: Array.isArray(scopes) ? scopes.map(String) : [],
      state: state === undefined ? undefined : String(state),
    });

    res.json({ redirectTo });
  } catch (err) {
    if (err instanceof OAuthError) {
      res.status(400).json({ message: err.message });
      return;
    }
    console.error("POST /api/oauth/approve failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
