export type CustomerRole = 'manager' | 'employee';

export interface AuthCustomer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleTitle: string;
  role: CustomerRole;
  companyId: string;
  companyName: string;
  companySlug: string;
  hasAwsConnected: boolean;
  /** Present for managers when company AWS is connected. Key IDs are not secret — safe to display. */
  companyAwsAccessKeyId?: string;
}

export interface AuthResponse {
  token: string;
  customer: AuthCustomer;
}

export interface ManagerSignUpPayload {
  role: 'manager';
  firstName: string;
  lastName: string;
  email: string;
  roleTitle: string;
  password: string;
  companyName: string;
  companySlug: string;
}

export interface EmployeeSignUpPayload {
  role: 'employee';
  firstName: string;
  lastName: string;
  email: string;
  roleTitle: string;
  password: string;
  companySlug: string;
  inviteCode: string;
}

export type SignUpPayload = ManagerSignUpPayload | EmployeeSignUpPayload;

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  firstName: string;
  lastName: string;
  roleTitle: string;
}
