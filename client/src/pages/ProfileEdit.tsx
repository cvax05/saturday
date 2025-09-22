import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SearchableCollegeSelect from "@/components/SearchableCollegeSelect";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft, Upload } from "lucide-react";

export default function ProfileEdit() {
  const [, setLocation] = useLocation();
  
  // TODO: Load current user data from backend
  const [formData, setFormData] = useState({
    name: "Alex Johnson",
    age: "24",
    email: "alex@example.com",
    school: "University of Texas at Austin",
    description: "Love meeting new people and exploring the city's nightlife scene. Always down for a fun pregame with good vibes!",
    groupSizeMin: "4",
    groupSizeMax: "8",
    preferredAlcohol: "Cocktails",
    availability: "Weekends",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
  });

  // Schools list now handled by SearchableCollegeSelect component

  const alcoholOptions = [
    "None",
    "Beer",
    "Wine", 
    "Cocktails",
    "Vodka",
    "Whiskey",
    "Wine & Cocktails",
    "Anything"
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Updated profile data:', formData);
    
    // TODO: Submit to backend
    // For now, just redirect back to home
    setLocation("/home");
  };

  const handleBack = () => {
    setLocation("/home");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Edit Profile</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-md mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Profile Picture */}
              <div className="flex flex-col items-center space-y-2">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={formData.profileImage} alt={formData.name} />
                  <AvatarFallback>
                    {formData.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <Button type="button" variant="outline" size="sm" data-testid="button-upload-photo">
                  <Upload className="h-4 w-4 mr-2" />
                  Change Photo
                </Button>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                    data-testid="input-name"
                  />
                </div>
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    min="18"
                    max="30"
                    value={formData.age}
                    onChange={(e) => handleInputChange("age", e.target.value)}
                    required
                    data-testid="input-age"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  data-testid="input-email"
                />
              </div>

              <SearchableCollegeSelect
                value={formData.school}
                onValueChange={(value) => handleInputChange("school", value)}
                required
                label="School"
                placeholder="Search for your school..."
                testId="select-school"
              />

              <div>
                <Label htmlFor="description">About You (1-2 sentences)</Label>
                <Textarea
                  id="description"
                  placeholder="Tell others about yourself and what you're looking for in pregame activities..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  maxLength={200}
                  required
                  data-testid="textarea-description"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.description.length}/200 characters
                </p>
              </div>

              <div>
                <Label>Group Size Preference</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="groupSizeMin" className="text-sm">Min People</Label>
                    <Input
                      id="groupSizeMin"
                      type="number"
                      min="2"
                      value={formData.groupSizeMin}
                      onChange={(e) => handleInputChange("groupSizeMin", e.target.value)}
                      required
                      data-testid="input-group-min"
                    />
                  </div>
                  <div>
                    <Label htmlFor="groupSizeMax" className="text-sm">Max People</Label>
                    <Input
                      id="groupSizeMax"
                      type="number"
                      min="2"
                      value={formData.groupSizeMax}
                      onChange={(e) => handleInputChange("groupSizeMax", e.target.value)}
                      required
                      data-testid="input-group-max"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="preferredAlcohol">Preferred Alcohol</Label>
                <Select value={formData.preferredAlcohol} onValueChange={(value) => handleInputChange("preferredAlcohol", value)} required>
                  <SelectTrigger data-testid="select-alcohol">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {alcoholOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="availability">Availability</Label>
                <Input
                  id="availability"
                  placeholder="e.g., Weekends, Friday nights, Most evenings"
                  value={formData.availability}
                  onChange={(e) => handleInputChange("availability", e.target.value)}
                  required
                  data-testid="input-availability"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleBack}
                  className="flex-1"
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" data-testid="button-save">
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex items-center justify-around py-2 px-4 max-w-lg mx-auto">
          <button
            onClick={() => setLocation("/home")}
            className="flex flex-col items-center py-2 px-4 rounded-lg text-muted-foreground hover:text-foreground"
            data-testid="nav-home"
          >
            <span className="text-xs font-medium">Home</span>
          </button>
          <button
            onClick={() => setLocation("/messages")}
            className="flex flex-col items-center py-2 px-4 rounded-lg text-muted-foreground hover:text-foreground"
            data-testid="nav-messages"
          >
            <span className="text-xs font-medium">Messages</span>
          </button>
          <button
            onClick={() => setLocation("/profile/edit")}
            className="flex flex-col items-center py-2 px-4 rounded-lg text-primary bg-primary/10"
            data-testid="nav-profile"
          >
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}