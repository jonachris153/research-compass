import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

function UploadRoute() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/dashboard", replace: true });
  }, [navigate]);
  return null;
}

export const Route = createFileRoute("/upload")({
  component: UploadRoute,
});
