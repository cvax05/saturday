import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import Header from "@/components/Header";
import Registration from "@/pages/Registration";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Messages from "@/pages/Messages";
import ChatView from "@/pages/ChatView";
import Calendar from "@/pages/Calendar";
import ProfileEdit from "@/pages/ProfileEdit";
import UserProfilePage from "@/pages/UserProfilePage";
import People from "@/pages/People";
import Groups from "@/pages/Groups";
import UserProfileDetail from "@/pages/UserProfileDetail";
import Leaderboard from "@/pages/Leaderboard";
import OrganizationProfile from "@/pages/OrganizationProfile";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Authentication routes */}
      <Route path="/" component={Registration} />
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
      <Route path="/profile/:email" component={UserProfileDetail} />
      <Route path="/home" component={Home} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/organization/:id" component={OrganizationProfile} />
      <Route path="/messages" component={Messages} />
      <Route path="/messages/:id" component={ChatView} />
      <Route path="/calendar" component={Calendar} />
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
          <Header />
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
