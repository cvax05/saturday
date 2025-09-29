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
import { Upload, X } from "lucide-react";
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
  const [profileImages, setProfileImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Schools list now handled by SearchableCollegeSelect component

  const alcoholOptions = [
    "Beer",
    "Wine", 
    "Cocktails",
    "Vodka",
    "Whiskey",
    "Wine & Cocktails",
    "Anything",
    "None"
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // Check if adding these files would exceed the 5 image limit
    if (profileImages.length + files.length > 5) {
      alert('You can only upload up to 5 images of your group/organization.');
      return;
    }
    
    const processFile = async (file: File): Promise<string> => {
      try {
        // Compress image to reduce storage size
        return await compressImage(file, 400, 400, 0.7);
      } catch (error) {
        console.error('Failed to process image:', error);
        // Fallback to original method but with proper Promise handling
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });
      }
    };
    
    try {
      const newImages = await Promise.all(files.map(processFile));
      setProfileImages(prev => [...prev, ...newImages]);
    } catch (error) {
      console.error('Failed to process one or more images:', error);
      alert('Failed to process some images. Please try again.');
    }
    
    // Clear the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const removeImage = (index: number) => {
    setProfileImages(prev => prev.filter((_, i) => i !== index));
  };

  // Helper function to convert school name to URL-friendly slug
  const schoolNameToSlug = (schoolName: string): string => {
    return schoolName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .trim()
      .replace(/\s+/g, '-'); // Replace spaces with hyphens
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.email || !formData.password || !formData.school) {
      alert('Please fill in all required fields.');
      return;
    }
    
    // Validate group size min/max
    const minSize = parseInt(formData.groupSizeMin);
    const maxSize = parseInt(formData.groupSizeMax);
    
    if (minSize && maxSize && minSize > maxSize) {
      alert('Minimum group size cannot be larger than maximum group size.');
      return;
    }
    
    try {
      // Submit to backend API
      const registrationData = {
        username: formData.name, // Using name as username for now
        email: formData.email,
        password: formData.password,
        displayName: formData.name,
        schoolSlug: formData.school, // Already a slug from SearchableCollegeSelect
        profileImages: profileImages
      };
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.message || 'Registration failed');
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
          // Add additional fields that might be needed for profile display
          name: result.user.displayName || result.user.username,
          description: formData.description, // Save the bio from registration
          groupSizeMin: formData.groupSizeMin,
          groupSizeMax: formData.groupSizeMax,
          preferredAlcohol: formData.preferredAlcohol,
          availability: formData.availability,
        };
        localStorage.setItem('currentUser', JSON.stringify(userData));
      }
      
      // JWT token is automatically stored in httpOnly cookie by server
      // Redirect to groups page after successful registration
      setLocation("/groups");
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    }
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
              
              {/* Group/Organization Images */}
              <div className="space-y-3">
                <Label>Group/Organization Images (up to 5)</Label>
                <div className="grid grid-cols-3 gap-3">
                  {profileImages.map((image, index) => (
                    <div key={index} className="relative">
                      <div className="aspect-square rounded-lg overflow-hidden border">
                        <img
                          src={image}
                          alt={`Group image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={() => removeImage(index)}
                        data-testid={`button-remove-image-${index}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  
                  {profileImages.length < 5 && (
                    <div 
                      className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                      onClick={handleUploadClick}
                    >
                      <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground text-center">Add Image</span>
                    </div>
                  )}
                </div>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                
                {profileImages.length < 5 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleUploadClick}
                    className="w-full"
                    data-testid="button-upload-photo"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Add Images ({profileImages.length}/5)
                  </Button>
                )}
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
                  <Label htmlFor="groupSize">~# in Group/Organization</Label>
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
                <Label>Ideal Group/Organization Size</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="groupSizeMin" className="text-sm">Min People</Label>
                    <Input
                      id="groupSizeMin"
                      type="number"
                      min="2"
                      placeholder="e.g., 3"
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
                      placeholder="e.g., 8"
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