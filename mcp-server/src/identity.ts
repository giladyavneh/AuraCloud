import { CustomerModel } from "utils";

export interface UserContext {
  customerId: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Equals the watchlist userId (AWS SSO/IAM UserId). */
  linkedAwsUserId: string;
}

/**
 * Resolve the AuraCloud customer this MCP instance acts as, based on the
 * MCP_USER_EMAIL environment variable.
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

  return {
    customerId: String(customer._id),
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    linkedAwsUserId: customer.linkedAwsUserId,
  };
};
