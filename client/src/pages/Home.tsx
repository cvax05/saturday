import { useEffect } from "react";
import { useLocation } from "wouter";

// Redirect /home to /groups - Groups page has the real user data
export default function Home() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/groups");
  }, [setLocation]);

  return null;
}
