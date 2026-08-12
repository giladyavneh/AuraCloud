import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { CustomerModel } from "../db.js";
import { MCP_TOKEN_AUDIENCE, type CustomerDoc } from "utils";
import { JWT_SECRET } from "../config.js";

export interface JwtPayload {
  customerId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      customer?: JwtPayload;
      managerCustomer?: CustomerDoc;
    }
  }
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload & { aud?: string | string[] };

    // MCP access tokens are signed with the same secret, so without this they would
    // verify as login tokens and turn a scoped AI grant into full account access.
    const audiences = typeof payload.aud === "string" ? [payload.aud] : (payload.aud ?? []);
    if (audiences.includes(MCP_TOKEN_AUDIENCE)) {
      res.status(401).json({ message: "This token cannot be used to sign in" });
      return;
    }

    req.customer = payload;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

/** Runs after requireAuth: loads the Customer, attaches it as req.managerCustomer, 403s if not a manager. */
export async function requireManager(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const customer = await CustomerModel.findById(req.customer!.customerId);
    if (!customer) {
      res.status(404).json({ message: "Customer not found" });
      return;
    }
    if (customer.role !== "manager") {
      res.status(403).json({ message: "Managers only" });
      return;
    }
    req.managerCustomer = customer;
    next();
  } catch (err) {
    console.error("requireManager failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
}
