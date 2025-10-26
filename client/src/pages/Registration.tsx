import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SearchableCollegeSelect from "@/components/SearchableCollegeSelect";
import PreferencesSelector from "@/components/PreferencesSelector";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, X } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import { compressImage } from "@/lib/imageUtils";
import { queryClient } from "@/lib/queryClient";
import type { AuthResponse, UserPreferences } from "@shared/schema";

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
    profileImage: "",
    galleryImages: [] as string[]
  });
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Compress image to reduce storage size
        const compressedImage = await compressImage(file, 400, 400, 0.7);
        setFormData(prev => ({ ...prev, profileImage: compressedImage }));
      } catch (error) {
        console.error('Failed to process image:', error);
        // Fallback to original method
        const reader = new FileReader();
        reader.onload = () => {
          setFormData(prev => ({ ...prev, profileImage: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
    }
    // Clear the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && formData.galleryImages.length < 5) {
      const remainingSlots = 5 - formData.galleryImages.length;
      const filesToProcess = Array.from(files).slice(0, remainingSlots);
      
      for (const file of filesToProcess) {
        try {
          // Compress gallery images to save space
          const compressedImage = await compressImage(file, 600, 600, 0.8);
          setFormData(prev => ({
            ...prev,
            galleryImages: [...prev.galleryImages, compressedImage]
          }));
        } catch (error) {
          console.error('Failed to process gallery image:', error);
          // Fallback to original method
          const reader = new FileReader();
          reader.onload = () => {
            setFormData(prev => ({
              ...prev,
              galleryImages: [...prev.galleryImages, reader.result as string]
            }));
          };
          reader.readAsDataURL(file);
        }
      }
    }
    // Clear the input so the same file can be selected again
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
    }
  };

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, i) => i !== index)
    }));
  };

  const handleGalleryUploadClick = () => {
    galleryInputRef.current?.click();
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
      const registrationData: Record<string, any> = {
        username: formData.name, // Using name as username for now
        email: formData.email,
        password: formData.password,
        displayName: formData.name,
        schoolSlug: formData.school, // Already a slug from SearchableCollegeSelect
        bio: formData.description,
        groupSizeMin: formData.groupSizeMin ? parseInt(formData.groupSizeMin) : undefined,
        groupSizeMax: formData.groupSizeMax ? parseInt(formData.groupSizeMax) : undefined,
        preferences: preferences
      };
      
      // Only include profileImage if it has a value
      if (formData.profileImage) {
        registrationData.profileImage = formData.profileImage;
      }
      
      // Only include galleryImages if there are any
      if (formData.galleryImages && formData.galleryImages.length > 0) {
        registrationData.galleryImages = formData.galleryImages;
      }
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(registrationData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.message || 'Registration failed');
        return;
      }
      
      // Parse the auth response and cache it
      const authResponse: AuthResponse = await response.json();
      
      // Cache the auth data so Groups page has it immediately
      queryClient.setQueryData(['/api/auth/me'], authResponse);
      
      // JWT token is automatically stored in httpOnly cookie by server
      // Redirect to groups page - auth data already cached
      setLocation("/groups");
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-md mx-auto w-full">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-2">Saturday </h1>
          <p className="text-sm sm:text-base text-muted-foreground">Join your campus pregame community</p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Create Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              
              {/* Profile Picture */}
              <div className="flex flex-col items-center space-y-3 py-2">
                <Label className="text-center text-sm sm:text-base">Profile Photo</Label>
                <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-2 border-border">
                  <AvatarImage 
                    src={formData.profileImage} 
                    alt={formData.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-xl sm:text-2xl font-bold bg-muted">
                    {formData.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
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
                  size="default"
                  onClick={handleUploadClick}
                  data-testid="button-upload-photo"
                  className="w-full sm:w-auto"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {formData.profileImage ? 'Change Photo' : 'Add Photo'}
                </Button>
              </div>

              {/* Photo Gallery */}
              <div>
                <Label className="text-sm sm:text-base">Additional Photos - Optional ({formData.galleryImages.length}/5)</Label>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                  Add up to 5 more photos (shown on your profile page)
                </p>
                
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {formData.galleryImages.map((image, index) => (
                    <div key={index} className="relative group aspect-square">
                      <img 
                        src={image} 
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeGalleryImage(index)}
                        data-testid={`button-remove-gallery-${index}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  
                  {formData.galleryImages.length < 5 && (
                    <div 
                      className="aspect-square border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                      onClick={handleGalleryUploadClick}
                      data-testid="button-add-gallery-photo"
                    >
                      <div className="text-center">
                        <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Add Photo</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <input
                  type="file"
                  ref={galleryInputRef}
                  onChange={handleGalleryUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="name" className="text-sm sm:text-base">Group/Organization</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                    data-testid="input-name"
                    className="w-full"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="groupSize" className="text-sm sm:text-base">~# in Group/Organization</Label>
                  <Input
                    id="groupSize"
                    type="number"
                    min="1"
                    value={formData.groupSize}
                    onChange={(e) => handleInputChange("groupSize", e.target.value)}
                    required
                    data-testid="input-group-size"
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  data-testid="input-email"
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm sm:text-base">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  required
                  data-testid="input-password"
                  className="w-full"
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
                <Label htmlFor="description" className="text-sm sm:text-base">About You (1-2 sentences)</Label>
                <Textarea
                  id="description"
                  placeholder="Tell others about yourself and what you're looking for in pregame activities..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  maxLength={200}
                  required
                  data-testid="textarea-description"
                  className="w-full min-h-[80px] resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.description.length}/200 characters
                </p>
              </div>

              <div>
                <Label className="text-sm sm:text-base">Ideal Group/Organization Size</Label>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="groupSizeMin" className="text-xs sm:text-sm">Min People</Label>
                    <Input
                      id="groupSizeMin"
                      type="number"
                      min="2"
                      placeholder="e.g., 3"
                      value={formData.groupSizeMin}
                      onChange={(e) => handleInputChange("groupSizeMin", e.target.value)}
                      required
                      data-testid="input-group-min"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="groupSizeMax" className="text-xs sm:text-sm">Max People</Label>
                    <Input
                      id="groupSizeMax"
                      type="number"
                      min="2"
                      placeholder="e.g., 8"
                      value={formData.groupSizeMax}
                      onChange={(e) => handleInputChange("groupSizeMax", e.target.value)}
                      required
                      data-testid="input-group-max"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <PreferencesSelector
                value={preferences}
                onChange={setPreferences}
                className="w-full"
              />

              <Button type="submit" className="w-full min-h-[44px]" data-testid="button-register">
                Join {SITE_NAME}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs sm:text-sm text-muted-foreground mt-4 mb-6">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => setLocation("/login")}
            className="text-primary hover:underline min-h-[44px] inline-flex items-center"
            data-testid="link-login"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}