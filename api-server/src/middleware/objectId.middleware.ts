import type { NextFunction, Request, Response } from "express";
import { mongoose } from "utils";

/**
 * Param handler for `:id`. Without it a malformed id reaches Mongoose, throws a
 * CastError, and surfaces as a 500 — a bad id should be indistinguishable from a
 * nonexistent one. Register per router: `router.param("id", validateObjectIdParam)`.
 */
export function validateObjectIdParam(
  _req: Request,
  res: Response,
  next: NextFunction,
  value: string,
): void {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    res.status(404).json({ message: "Not found" });
    return;
  }
  next();
}
