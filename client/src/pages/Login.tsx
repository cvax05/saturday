import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SITE_NAME } from "@/lib/constants";

export default function Login() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Submit to backend
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.email, // Using email as username for now  
          password: formData.password,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.message || 'Login failed');
        return;
      }
      
      const result = await response.json();
      
      // Store user data in localStorage for client-side access
      if (result.user) {
        const userData = {
          id: result.user.id,
          username: result.user.username,
          displayName: result.user.displayName,
          email: result.user.email,
          school: result.user.school,
          profileImages: result.user.profileImages || [],
          bio: result.user.bio,
          groupSizeMin: result.user.groupSizeMin,
          groupSizeMax: result.user.groupSizeMax,
          preferredAlcohol: result.user.preferredAlcohol,
          availability: result.user.availability,
          // Add additional fields for compatibility
          name: result.user.displayName || result.user.username,
          description: result.user.bio,
        };
        localStorage.setItem('currentUser', JSON.stringify(userData));
      }
      
      // JWT token is automatically stored in httpOnly cookie by server
      // Redirect to groups page
      setLocation("/groups");
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-2">
            {SITE_NAME}
          </h1>
          <p className="text-muted-foreground">Welcome back!</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  data-testid="input-login-email"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  required
                  data-testid="input-login-password"
                />
              </div>

              <Button type="submit" className="w-full" data-testid="button-login">
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => setLocation("/register")}
            className="text-primary hover:underline"
            data-testid="link-register"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}