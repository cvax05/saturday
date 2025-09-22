import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SearchableCollegeSelect from "@/components/SearchableCollegeSelect";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import { compressImage, safeSaveToLocalStorage } from "@/lib/imageUtils";

export default function Registration() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    groupSize: "",
    email: "",
    password: "",
    school: "",
    description: "",
    groupSizeMin: "",
    groupSizeMax: "",
    preferredAlcohol: "",
    availability: ""
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Compress image to reduce storage size
        const compressedImage = await compressImage(file, 400, 400, 0.7);
        setProfileImage(compressedImage);
      } catch (error) {
        console.error('Failed to process image:', error);
        // Fallback to original method but with smaller size
        const reader = new FileReader();
        reader.onload = () => {
          setProfileImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Registration data:', formData);
    
    // Store user data safely in localStorage
    const userData = {
      ...formData,
      profileImage,
      galleryImages: [] // Initialize empty gallery
    };
    
    const saved = safeSaveToLocalStorage('currentUser', userData);
    
    if (!saved) {
      alert('Registration data is too large to save. Please try using a smaller profile image.');
      return;
    }
    
    // TODO: Submit to backend
    // For now, just redirect to home
    setLocation("/home");
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-2">
            {SITE_NAME}
          </h1>
          <p className="text-muted-foreground">Join your campus pregame community</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Profile Picture */}
              <div className="flex flex-col items-center space-y-2">
                <Avatar className="h-20 w-20">
                  {profileImage ? (
                    <AvatarImage src={profileImage} alt="Profile" />
                  ) : (
                    <AvatarFallback>
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleUploadClick}
                  data-testid="button-upload-photo"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photo
                </Button>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Group/Organization</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                    data-testid="input-name"
                  />
                </div>
                <div>
                  <Label htmlFor="groupSize"># in Group/Organization</Label>
                  <Input
                    id="groupSize"
                    type="number"
                    min="1"
                    value={formData.groupSize}
                    onChange={(e) => handleInputChange("groupSize", e.target.value)}
                    required
                    data-testid="input-group-size"
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

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  required
                  data-testid="input-password"
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
                <Select onValueChange={(value) => handleInputChange("preferredAlcohol", value)} required>
                  <SelectTrigger data-testid="select-alcohol">
                    <SelectValue placeholder="What do you prefer?" />
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

              <Button type="submit" className="w-full" data-testid="button-register">
                Join {SITE_NAME}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => setLocation("/login")}
            className="text-primary hover:underline"
            data-testid="link-login"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}