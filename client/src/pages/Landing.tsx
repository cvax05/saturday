import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Hero Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(/attached_assets/IMG_8108_1760544472794.JPG)` }}
      />
      
      {/* Dark wash overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
      
      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
        <h1 className="mb-8 text-5xl font-bold text-white sm:text-6xl md:text-7xl lg:text-8xl">
          Join your Campus<br />Pregame Community
        </h1>
        
        <Button
          size="lg"
          onClick={() => setLocation("/register")}
          className="mt-4 h-14 px-12 text-lg font-semibold"
          data-testid="button-get-started"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
}
