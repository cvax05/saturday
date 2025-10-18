import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import Header from "@/components/Header";
import Landing from "@/pages/Landing";
import Registration from "@/pages/Registration";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Messages from "@/pages/Messages";
import ChatView from "@/pages/ChatView";
import Calendar from "@/pages/Calendar";
import ProfileEdit from "@/pages/ProfileEdit";
import People from "@/pages/People";
import Groups from "@/pages/Groups";
import UserProfileDetail from "@/pages/UserProfileDetail";
import Leaderboard from "@/pages/Leaderboard";
import OrganizationProfile from "@/pages/OrganizationProfile";
import NotFound from "@/pages/not-found";

function MobileNav() {
  const [location, setLocation] = useLocation();
  
  // Only show on main app pages, not on auth or landing pages
  const showNav = !["/", "/register", "/login"].includes(location) && 
                  !location.startsWith("/profile/") &&
                  location !== "/profile/edit";
  
  if (!showNav) return null;
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around py-2 px-4 max-w-lg mx-auto">
        <button
          onClick={() => setLocation("/groups")}
          className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
            location === "/groups" 
              ? "text-primary bg-primary/10" 
              : "text-muted-foreground hover:text-foreground"
          }`}
          data-testid="mobile-nav-groups"
        >
          <svg className="h-5 w-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-xs font-medium">Groups</span>
        </button>
        
        <button
          onClick={() => setLocation("/messages")}
          className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
            location.startsWith("/messages") 
              ? "text-primary bg-primary/10" 
              : "text-muted-foreground hover:text-foreground"
          }`}
          data-testid="mobile-nav-messages"
        >
          <svg className="h-5 w-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-xs font-medium">Messages</span>
        </button>
        
        <button
          onClick={() => setLocation("/calendar")}
          className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
            location === "/calendar" 
              ? "text-primary bg-primary/10" 
              : "text-muted-foreground hover:text-foreground"
          }`}
          data-testid="mobile-nav-calendar"
        >
          <svg className="h-5 w-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs font-medium">Calendar</span>
        </button>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <Switch>
      {/* Landing page */}
      <Route path="/" component={Landing} />
      
      {/* Authentication routes */}
      <Route path="/register" component={Registration} />
      <Route path="/login" component={Login} />
      
      {/* Main app routes */}
      <Route path="/people">
        {() => {
          window.location.replace('/groups');
          return null;
        }}
      </Route>
      <Route path="/groups" component={Groups} />
      <Route path="/profile/edit" component={ProfileEdit} />
      <Route path="/profile/:email" component={UserProfileDetail} />
      <Route path="/profile/:id" component={UserProfileDetail} />
      <Route path="/home" component={Home} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/organization/:id" component={OrganizationProfile} />
      <Route path="/messages" component={Messages} />
      <Route path="/messages/:id" component={ChatView} />
      <Route path="/calendar" component={Calendar} />
      
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
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 pb-16 md:pb-0">
              <Router />
            </main>
            <MobileNav />
          </div>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
