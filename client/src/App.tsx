import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import Registration from "@/pages/Registration";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Messages from "@/pages/Messages";
import ProfileEdit from "@/pages/ProfileEdit";
import UserProfilePage from "@/pages/UserProfilePage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Authentication routes */}
      <Route path="/" component={Registration} />
      <Route path="/register" component={Registration} />
      <Route path="/login" component={Login} />
      
      {/* Main app routes */}
      <Route path="/home" component={Home} />
      <Route path="/messages" component={Messages} />
      <Route path="/profile/edit" component={ProfileEdit} />
      <Route path="/profile/:id" component={UserProfilePage} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="pregame-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
