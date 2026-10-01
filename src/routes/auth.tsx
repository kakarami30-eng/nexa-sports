import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/dashboard" });
  }, [navigate]);
  return <div style={{padding: 50, textAlign: "center"}}>Redirecting...</div>;
}