import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root not found");
}

const renderFatalFallback = (title: string, message: string) => {
  rootElement.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:hsl(var(--background));color:hsl(var(--foreground));font-family:system-ui,-apple-system,sans-serif;">
      <div style="width:100%;max-width:480px;border:1px solid hsl(var(--border));background:hsl(var(--card));border-radius:12px;padding:24px;text-align:center;">
        <h1 style="font-size:1.5rem;font-weight:600;margin:0 0 12px;">${title}</h1>
        <p style="margin:0 0 16px;color:hsl(var(--muted-foreground));">${message}</p>
        <button id="reload-app" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid hsl(var(--border));background:hsl(var(--primary));color:hsl(var(--primary-foreground));cursor:pointer;">
          Recharger la page
        </button>
      </div>
    </div>
  `;

  const reloadButton = document.getElementById("reload-app");
  reloadButton?.addEventListener("click", () => window.location.reload());
};

window.addEventListener("error", (event) => {
  console.error("Unhandled window error:", event.error ?? event.message);
  renderFatalFallback(
    "Une erreur est survenue",
    "L’application a rencontré un problème inattendu."
  );
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  renderFatalFallback(
    "Une erreur est survenue",
    "Une opération a échoué de manière inattendue."
  );
});

try {
  createRoot(rootElement).render(<App />);
} catch (error) {
  console.error("App bootstrap failed:", error);
  renderFatalFallback(
    "Impossible de charger l’application",
    "Veuillez recharger la page pour réessayer."
  );
}

