import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function DashboardPage() {
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-app items-center justify-between px-md py-sm">
          <span className="headline-sm text-foreground">IoT Room Monitor</span>
          <Button
            variant="outline"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <>
                <Spinner className="mr-2" />
                Signing out…
              </>
            ) : (
              "Sign out"
            )}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-app px-md py-xl">
        <h1 className="display-lg text-foreground mb-sm">Dashboard</h1>
        <p className="body-md text-muted-foreground">
          Authentication successful. Dashboard content will appear here.
        </p>

        <div className="mt-xl rounded-xl border border-border bg-card p-lg">
          <p className="label-caps text-muted-foreground mb-sm">Status</p>
          <p className="headline-sm text-foreground">Session active</p>
          <p className="body-md text-muted-foreground mt-xs">
            You are logged in. This is a placeholder page.
          </p>
        </div>
      </main>
    </div>
  );
}
