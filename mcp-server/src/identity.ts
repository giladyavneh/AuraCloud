import { CustomerModel, mongoose, type Customer } from "utils";

export interface UserContext {
  customerId: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Equals the watchlist userId (AWS SSO/IAM UserId). */
  linkedAwsUserId: string;
}

/**
 * Expected identity-resolution failure. The HTTP entry maps httpStatus onto the
 * response; the stdio entry just prints the message and exits.
 */
export class IdentityError extends Error {
  constructor(
    message: string,
    readonly httpStatus: 401 | 403,
  ) {
    super(message);
  }
}

// Derived from the shared schema type so a Customer field rename fails to
// compile here instead of silently breaking identity resolution at runtime.
type CustomerLean = Pick<Customer, "email" | "firstName" | "lastName" | "linkedAwsUserId"> & {
  _id: unknown;
};

/** Callers must have verified linkedAwsUserId is set before converting. */
const toUserContext = (customer: CustomerLean): UserContext => ({
  customerId: String(customer._id),
  email: customer.email,
  firstName: customer.firstName,
  lastName: customer.lastName,
  linkedAwsUserId: customer.linkedAwsUserId as string,
});

/**
 * Resolve the AuraCloud customer this MCP instance acts as, based on the
 * MCP_USER_EMAIL environment variable. Used by the stdio entry (identity is
 * fixed for the lifetime of the process).
 */
export const resolveUserContext = async (): Promise<UserContext> => {
  const rawEmail = process.env.MCP_USER_EMAIL;
  if (!rawEmail) throw new Error("MCP_USER_EMAIL is not set");

  const email = rawEmail.toLowerCase().trim();
  const customer = await CustomerModel.findOne({ email }).lean().exec();
  if (!customer) {
    throw new Error(`No AuraCloud customer found for email "${email}"`);
  }
  if (!customer.linkedAwsUserId) {
    throw new Error(
      `Customer "${email}" has no linked AWS user — link one in the AuraCloud UI first`,
    );
  }

  return toUserContext(customer);
};

/**
 * Per-request resolver for the HTTP entry: the customerId comes from a verified
 * JWT. Reads fresh on every request, so re-linking an AWS user in the UI takes
 * effect immediately — no server restart needed.
 */
export const resolveUserContextByCustomerId = async (customerId: string): Promise<UserContext> => {
  // A malformed id (forged or corrupted token) is an auth failure — but real
  // DB errors must propagate to the 500 path, not masquerade as a bad token.
  if (!mongoose.isValidObjectId(customerId)) {
    throw new IdentityError("Token references an invalid customer id", 401);
  }
  const customer = await CustomerModel.findById(customerId).lean().exec();
  if (!customer) {
    throw new IdentityError("Token references an unknown customer", 401);
  }
  if (!customer.linkedAwsUserId) {
    throw new IdentityError(
      `Customer "${customer.email}" has no linked AWS user — link one in the AuraCloud UI (Settings) first`,
      403,
    );
  }
  return toUserContext(customer);
};
