export interface AuthCustomer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  roleTitle: string;
  hasAwsConnected: boolean;
  /** Present when hasAwsConnected is true. Key IDs are not secret — safe to display. */
  awsAccessKeyId?: string;
}

export interface AuthResponse {
  token: string;
  customer: AuthCustomer;
}

export interface SignUpPayload {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  roleTitle: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  roleTitle: string;
}
