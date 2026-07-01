"use client";

import { useCallback, useEffect, useState } from "react";

import { isAdminRole } from "@/lib/auth/role-utils";

export type UserAccessState = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  role: string | null;
  status: "idle" | "loading" | "ready" | "error";
  httpStatus: number | null;
};

const initialState: UserAccessState = {
  isAuthenticated: false,
  isAdmin: false,
  role: null,
  status: "idle",
  httpStatus: null,
};

export function useUserAccess() {
  const [access, setAccess] = useState<UserAccessState>(initialState);

  const refresh = useCallback(async () => {
    setAccess((current) => ({
      ...current,
      status: "loading",
    }));

    try {
      const res = await fetch("/api/auth/telegram", {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        setAccess({
          isAuthenticated: false,
          isAdmin: false,
          role: null,
          status: "ready",
          httpStatus: res.status,
        });
        return;
      }

      const data = (await res.json()) as {
        authenticated?: boolean;
        user?: { role?: string };
      };
      const role =
        typeof data.user?.role === "string" ? data.user.role : null;

      setAccess({
        isAuthenticated: Boolean(data.authenticated ?? data.user),
        isAdmin: isAdminRole(role ?? ""),
        role,
        status: "ready",
        httpStatus: res.status,
      });
    } catch {
      setAccess({
        isAuthenticated: false,
        isAdmin: false,
        role: null,
        status: "error",
        httpStatus: null,
      });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { access, refresh };
}
