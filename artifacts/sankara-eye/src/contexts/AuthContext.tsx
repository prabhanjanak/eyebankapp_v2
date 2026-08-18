import React, { createContext, useContext } from "react";
import {
  useGetMe,
  useLogin,
  useLogout,
  useChangePassword,
  UserProfile,
  LoginInput,
  ChangePasswordInput,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (data: LoginInput) => Promise<UserProfile>;
  logout: () => Promise<void>;
  changePassword: (data: ChangePasswordInput) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { data: user, isLoading, error } = useGetMe({
    query: {
      queryKey: ["/api/auth/me"],
      retry: false,
      staleTime: 5 * 60 * 1000,
    },
  });

  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const changePasswordMutation = useChangePassword();

  const login = async (data: LoginInput) => {
    const loggedInUser = await loginMutation.mutateAsync({ data });
    if ((loggedInUser as any).token) {
      localStorage.setItem("auth_token", (loggedInUser as any).token);
    }
    queryClient.setQueryData(["/api/auth/me"], loggedInUser);
    return loggedInUser;
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
    localStorage.removeItem("auth_token");
    queryClient.setQueryData(["/api/auth/me"], null);
    queryClient.clear();
  };

  const changePassword = async (data: ChangePasswordInput) => {
    await changePasswordMutation.mutateAsync({ data });
    await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
  };

  const currentUser = error ? null : (user || null);

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        isLoading: isLoading && !error,
        login,
        logout,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
