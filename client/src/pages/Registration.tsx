import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SearchableCollegeSelect from "@/components/SearchableCollegeSelect";
import PreferencesSelector from "@/components/PreferencesSelector";
import { Upload, X, User, ChevronLeft, ChevronRight } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import { compressImage } from "@/lib/imageUtils";
import { queryClient } from "@/lib/queryClient";
import type { AuthResponse, UserPreferences } from "@shared/schema";

export default function Registration() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  
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
        const compressedImage = await compressImage(file, 400, 400, 0.7);
        setFormData(prev => ({ ...prev, profileImage: compressedImage }));
      } catch (error) {
        console.error('Failed to process image:', error);
        const reader = new FileReader();
        reader.onload = () => {
          setFormData(prev => ({ ...prev, profileImage: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
    }
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
          const compressedImage = await compressImage(file, 600, 600, 0.8);
          setFormData(prev => ({
            ...prev,
            galleryImages: [...prev.galleryImages, compressedImage]
          }));
        } catch (error) {
          console.error('Failed to process gallery image:', error);
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

  // Validate current step before proceeding
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.email || !formData.password) {
          alert('Please enter both email and password.');
          return false;
        }
        return true;
      
      case 2:
        if (!formData.name) {
          alert('Please enter your group/organization name.');
          return false;
        }
        if (!formData.groupSize) {
          alert('Please enter the number of people in your group/organization.');
          return false;
        }
        return true;
      
      case 3:
        // School and bio are optional
        return true;
      
      case 4:
        // Preferences are optional
        return true;
      
      case 5:
        if (!formData.profileImage) {
          alert('Please add a profile photo.');
          return false;
        }
        return true;
      
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only allow submission from step 5
    if (currentStep !== totalSteps) {
      return;
    }
    
    // Validate required fields: email, password, name, groupSize, profileImage
    if (!formData.email || !formData.password) {
      alert('Please enter both email and password.');
      return;
    }
    
    if (!formData.name || !formData.groupSize) {
      alert('Please fill in all group information.');
      return;
    }
    
    if (!formData.profileImage) {
      alert('Please add a profile photo.');
      return;
    }
    
    try {
      const registrationData: Record<string, any> = {
        username: formData.name,
        email: formData.email,
        password: formData.password,
        displayName: formData.name,
        schoolSlug: formData.school,
        bio: formData.description,
        groupSizeMin: formData.groupSize ? parseInt(formData.groupSize) : undefined,
        groupSizeMax: formData.groupSize ? parseInt(formData.groupSize) : undefined,
        preferences: preferences
      };
      
      if (formData.profileImage) {
        registrationData.profileImage = formData.profileImage;
      }
      
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
      
      const authResponse: AuthResponse = await response.json();
      queryClient.setQueryData(['/api/auth/me'], authResponse);
      setLocation("/groups");
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
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
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
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
            
            <div>
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
        );

      case 3:
        return (
          <div className="space-y-4">
            <SearchableCollegeSelect
              value={formData.school}
              onValueChange={(value) => handleInputChange("school", value)}
              label="School (Optional)"
              testId="select-school"
            />

            <div>
              <Label htmlFor="description" className="text-sm sm:text-base">About You (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                maxLength={200}
                data-testid="textarea-description"
                className="w-full min-h-[80px] resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.description.length}/200 characters
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm sm:text-base mb-3 block">Preferences (Optional)</Label>
              <PreferencesSelector
                value={preferences}
                onChange={setPreferences}
                className="w-full"
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-5">
            {/* Profile Picture */}
            <div className="flex flex-col items-center space-y-3 py-2">
              <Label className="text-center text-sm sm:text-base">Profile Photo</Label>
              <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full border-2 border-border bg-muted overflow-hidden flex items-center justify-center">
                {formData.profileImage ? (
                  <img 
                    src={formData.profileImage} 
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 sm:h-14 sm:w-14 text-muted-foreground" />
                )}
              </div>
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
              <Label className="text-sm sm:text-base">Additional Photos ({formData.galleryImages.length}/5) (Optional)</Label>
              
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {formData.galleryImages.map((image, index) => (
                  <div key={index} className="relative group aspect-square overflow-hidden rounded-lg border">
                    <img 
                      src={image} 
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-full object-cover object-center"
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
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Account Setup";
      case 2: return "Group Information";
      case 3: return "School & Bio";
      case 4: return "Your Preferences";
      case 5: return "Add Photos";
      default: return "Create Your Profile";
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-md mx-auto w-full">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-2">
            {SITE_NAME}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">Join your campus pregame community</p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-xl sm:text-2xl">{getStepTitle()}</CardTitle>
              <span className="text-sm text-muted-foreground" data-testid="step-indicator">
                Step {currentStep} of {totalSteps}
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-2 mt-3">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                data-testid="progress-bar"
              />
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit}>
              {renderStepContent()}

              {/* Navigation buttons */}
              <div className="flex gap-3 mt-6">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1"
                    data-testid="button-back"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                )}
                
                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className={`${currentStep === 1 ? 'w-full' : 'flex-1'}`}
                    data-testid="button-next"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className={`${currentStep === 1 ? 'w-full' : 'flex-1'}`}
                    data-testid="button-register"
                  >
                    Join {SITE_NAME}
                  </Button>
                )}
              </div>
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
