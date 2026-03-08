import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import SEO from "@/components/SEO";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <SEO title="Page introuvable" description="La page demandée n'existe pas." />
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-4">Page introuvable</p>
        <a href="/" className="text-primary hover:underline">
          Retour à l'accueil
        </a>
      </div>
    </div>
  );
};

export default NotFound;
