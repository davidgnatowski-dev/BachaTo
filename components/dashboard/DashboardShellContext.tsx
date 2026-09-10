"use client";

import { createContext, useContext } from "react";

const DashboardShellContext = createContext(false);

export const DashboardShellProvider = DashboardShellContext.Provider;
export function useDashboardShell() {
  return useContext(DashboardShellContext);
}
