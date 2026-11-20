import React from "react";
import { Redirect, Slot } from "expo-router";
import { useStore } from "../store";
import { Role } from "../types";
export function RoleGate({
  role,
  children,
}: {
  role: Role;
  children?: React.ReactNode;
}) {
  const p = useStore((s) => s.profile);
  if (!p || p.role !== role || p.mustChangePassword)
    return <Redirect href="/" />;
  return children ?? <Slot />;
}
