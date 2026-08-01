import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { CustomerModel } from "../db.js";
import type { CustomerDoc } from "utils";
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
    req.customer = jwt.verify(token, JWT_SECRET) as JwtPayload;
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
