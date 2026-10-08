import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { PageLoader } from "@/components/PageLoader";

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <PageLoader />
      </div>
    );
  }

  if (session) return <Navigate to="/tableau-de-bord" replace />;
  return <Navigate to="/login" replace />;
}
