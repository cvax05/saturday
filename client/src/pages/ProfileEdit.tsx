import { useState, useRef, useEffect } from "react";
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
import { ArrowLeft, Upload, X, Plus } from "lucide-react";
import { compressImage } from "@/lib/imageUtils";
import { useQuery } from "@tanstack/react-query";
import { authQueryFn } from "@/lib/queryClient";
import type { AuthResponse } from "@shared/schema";

export default function ProfileEdit() {
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch current user data from API
  const { data: authData, isLoading } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/me'],
    queryFn: authQueryFn as any,
  });

  const currentUser = authData?.user;
  
  const [formData, setFormData] = useState({
    name: "",
    groupSize: "",
    email: "",
    school: "",
    description: "",
    groupSizeMin: "",
    groupSizeMax: "",
    preferredAlcohol: "",
    availability: "",
    profileImage: "",
    galleryImages: [] as string[]
  });

  // Load user data from API when it's available
  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.displayName || currentUser.username || "",
        groupSize: "", // Not returned by API, can be removed if not needed
        email: currentUser.email || "",
        school: currentUser.school || "",
        description: currentUser.bio || "",
        groupSizeMin: currentUser.groupSizeMin?.toString() || "",
        groupSizeMax: currentUser.groupSizeMax?.toString() || "",
        preferredAlcohol: currentUser.preferredAlcohol || "",
        availability: currentUser.availability || "",
        profileImage: currentUser.profileImage || "",
        galleryImages: currentUser.galleryImages || []
      });
    }
  }, [currentUser]);

  // Schools list now handled by SearchableCollegeSelect component

  const alcoholOptions = [
    "Beer",
    "Wine", 
    "Cocktails",
    "Vodka",
    "Whiskey",
    "Seltzers",
    "Wine & Cocktails",
    "Anything",
    "None"
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Prepare update data (only send fields that should be updated)
      const updateData: Record<string, any> = {
        displayName: formData.name,
        bio: formData.description,
        groupSizeMin: formData.groupSizeMin ? parseInt(formData.groupSizeMin) : undefined,
        groupSizeMax: formData.groupSizeMax ? parseInt(formData.groupSizeMax) : undefined,
        preferredAlcohol: formData.preferredAlcohol || undefined,
        availability: formData.availability || undefined,
      };

      // Only include photos if they've been set
      if (formData.profileImage) {
        updateData.profileImage = formData.profileImage;
      }
      if (formData.galleryImages && formData.galleryImages.length > 0) {
        updateData.galleryImages = formData.galleryImages;
      }

      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update profile');
        return;
      }

      // Profile updated successfully - JWT cookie already contains updated auth
      // Redirect to groups page
      setLocation("/groups");
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
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
              <div className="flex flex-col items-center space-y-3">
                <Avatar className="h-28 w-28 border-2 border-border">
                  <AvatarImage 
                    src={formData.profileImage} 
                    alt={formData.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-2xl font-bold bg-muted">
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
                  size="sm" 
                  onClick={handleUploadClick}
                  data-testid="button-upload-photo"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {formData.profileImage ? 'Change Photo' : 'Add Photo'}
                </Button>
              </div>

              {/* Photo Gallery */}
              <div>
                <Label>Photo Gallery ({formData.galleryImages.length}/5)</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Add up to 5 photos of your group/organization
                </p>
                
                <div className="grid grid-cols-3 gap-3">
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
                        <Plus className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
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

              {/* Photo Gallery */}
              <div>
                <Label>Photo Gallery ({formData.galleryImages.length}/5)</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Add up to 5 photos that people can view when they visit your profile
                </p>
                
                <div className="grid grid-cols-3 gap-3">
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
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  
                  {formData.galleryImages.length < 5 && (
                    <div 
                      className="aspect-square border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                      onClick={handleGalleryUploadClick}
                    >
                      <div className="text-center">
                        <Plus className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
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