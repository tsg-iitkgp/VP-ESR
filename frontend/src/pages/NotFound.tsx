import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground p-4">
      <div className="text-center max-w-md mx-auto space-y-4">
        <h1 className="text-5xl sm:text-6xl font-extrabold text-primary">404</h1>
        <p className="text-lg sm:text-xl text-muted-foreground">Oops! Page not found</p>
        <Button
          onClick={() => navigate('/')}
          className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Return to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
