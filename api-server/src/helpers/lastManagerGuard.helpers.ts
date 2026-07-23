import { CompanyModel, CustomerModel } from "../db.js";
import { mongoose, type CustomerDoc } from "utils";

/** Thrown inside withLastManagerGuard; translated to a 409 by the caller. */
class LastManagerError extends Error {}

/**
 * Runs `mutate` only if the company still has another manager besides `target`.
 * Returns false (and mutates nothing) when `target` is the last manager.
 *
 * The `$inc` on the Company document is load-bearing: without it the two requests
 * write different Customer documents, so snapshot isolation finds no conflict and
 * concurrent demotes can both commit, leaving a company with zero managers. Writing
 * a shared document forces the conflict so MongoDB aborts and retries one of them.
 * Requires a replica set.
 */
export async function withLastManagerGuard(
  companyId: string,
  target: CustomerDoc,
  mutate: (session: mongoose.ClientSession) => Promise<void>,
): Promise<boolean> {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      await CompanyModel.updateOne({ _id: companyId }, { $inc: { managerOpsSeq: 1 } }, { session });

      const otherManagers = await CustomerModel.countDocuments(
        { companyId, role: "manager", _id: { $ne: target._id } },
        { session },
      );
      if (otherManagers < 1) throw new LastManagerError();

      await mutate(session);
    });
    return true;
  } catch (err) {
    if (err instanceof LastManagerError) return false;
    throw err;
  } finally {
    await session.endSession();
  }
}
