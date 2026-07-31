import { CompanyModel } from "../db.js";

interface EmployeeSource {
  _id: unknown;
  firstName: string;
  lastName: string;
  email: string;
  roleTitle: string;
  role: string;
  teamId?: string | null;
  linkedAwsUserId?: string | null;
  createdAt?: Date;
}

interface CustomerSource {
  _id: unknown;
  firstName: string;
  lastName: string;
  email: string;
  roleTitle: string;
  role: string;
  companyId: string;
  linkedAwsUserId?: string | null;
}

/**
 * Builds the row shape returned by the employees endpoints.
 *
 * Fields are listed explicitly rather than spread: callers pass full Customer
 * documents, so spreading would leak `passwordHash` to the client.
 */
export function toEmployeeResponse(customer: EmployeeSource) {
  return {
    _id: customer._id,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    roleTitle: customer.roleTitle,
    role: customer.role,
    teamId: customer.teamId ?? null,
    hasAwsConnected: Boolean(customer.linkedAwsUserId),
    createdAt: customer.createdAt,
  };
}

/**
 * Builds the safe customer object sent to the frontend, resolving the company for
 * its name and slug. Explicit fields for the same reason as toEmployeeResponse.
 */
export async function toCustomerResponse(customer: CustomerSource) {
  const company = await CompanyModel.findById(customer.companyId).lean();
  const isManager = customer.role === "manager";

  return {
    _id: customer._id,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    roleTitle: customer.roleTitle,
    role: customer.role,
    companyId: customer.companyId,
    companyName: company?.name ?? "",
    companySlug: company?.slug ?? "",
    hasAwsConnected: Boolean(customer.linkedAwsUserId),
    // Managers also see the company AWS key ID (non-secret)
    ...(isManager && company?.awsCredentials?.accessKeyId
      ? { companyAwsAccessKeyId: company.awsCredentials.accessKeyId }
      : {}),
  };
}
