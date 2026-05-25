import { useAuth } from "@/context/auth/AuthContext";
import { login, signUp, submitAwsCredentials } from "@/services/auth.service";
import type { LoginPayload, SignUpPayload } from "@/services/types/auth.types";
import { useMutation } from "@tanstack/react-query";

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
