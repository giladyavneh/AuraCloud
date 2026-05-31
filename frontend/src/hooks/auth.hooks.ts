import { useAuth } from "@/context/auth/AuthContext";
import {
  fetchCompanyAwsUsers,
  fetchCompanyBySlug,
  fetchCompanyInviteCode,
  linkAwsUser,
  login,
  signUp,
  submitAwsCredentials,
  updateProfile,
} from "@/services/auth.service";
import type { LoginPayload, SignUpPayload, UpdateProfilePayload } from "@/services/types/auth.types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";

export const useSignUp = () => {
  const { setAuth } = useAuth();

  return useMutation({
    mutationFn: (payload: SignUpPayload) => signUp(payload),
    onSuccess: ({ token, customer }) => setAuth(token, customer),
  });
};

export const useLogin = () => {
  const { setAuth } = useAuth();

  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: ({ token, customer }) => setAuth(token, customer),
  });
};

export const useSubmitAwsCredentials = () => {
  const { updateCustomer } = useAuth();

  return useMutation({
    mutationFn: (payload: { accessKeyId: string; secretAccessKey: string }) =>
      submitAwsCredentials(payload),
    onSuccess: (customer) => updateCustomer(customer),
  });
};

export const useUpdateProfile = () => {
  const { updateCustomer } = useAuth();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfile(payload),
    onSuccess: (customer) => updateCustomer(customer),
  });
};

export const useCompanyBySlug = (slug: string) =>
  useQuery({
    queryKey: QUERY_KEYS.companyBySlug(slug),
    queryFn: () => fetchCompanyBySlug(slug),
    enabled: Boolean(slug),
    retry: false,
  });

export const useCompanyAwsUsers = (slug: string) =>
  useQuery({
    queryKey: QUERY_KEYS.companyAwsUsers(slug),
    queryFn: () => fetchCompanyAwsUsers(slug),
    enabled: Boolean(slug),
  });

export const useCompanyInviteCode = () =>
  useQuery({
    queryKey: QUERY_KEYS.companyInviteCode,
    queryFn: fetchCompanyInviteCode,
  });

export const useLinkAwsUser = () => {
  const { updateCustomer } = useAuth();

  return useMutation({
    mutationFn: (awsUserId: string) => linkAwsUser(awsUserId),
    onSuccess: (customer) => updateCustomer(customer),
  });
};
