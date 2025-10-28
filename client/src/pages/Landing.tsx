import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* Stylish Purple Stripes Background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(
              135deg,
              transparent 0%,
              transparent 25%,
              hsl(var(--primary) / 0.15) 25%,
              hsl(var(--primary) / 0.15) 27%,
              transparent 27%,
              transparent 50%,
              hsl(var(--primary) / 0.12) 50%,
              hsl(var(--primary) / 0.12) 52%,
              transparent 52%,
              transparent 75%,
              hsl(var(--primary) / 0.18) 75%,
              hsl(var(--primary) / 0.18) 77%,
              transparent 77%
            ),
            linear-gradient(
              -45deg,
              transparent 0%,
              transparent 30%,
              hsl(var(--primary) / 0.08) 30%,
              hsl(var(--primary) / 0.08) 32%,
              transparent 32%,
              transparent 60%,
              hsl(var(--primary) / 0.1) 60%,
              hsl(var(--primary) / 0.1) 62%,
              transparent 62%
            ),
            radial-gradient(
              ellipse at top,
              hsl(var(--primary) / 0.2) 0%,
              transparent 50%
            ),
            radial-gradient(
              ellipse at bottom,
              hsl(var(--primary) / 0.15) 0%,
              transparent 50%
            ),
            black
          `,
          backgroundSize: '120px 120px, 180px 180px, 100% 100%, 100% 100%, 100% 100%'
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-start pt-8 px-4 text-center sm:pt-12 md:pt-16">
        <h1 className="mb-4 text-5xl font-bold text-white sm:text-6xl md:text-7xl lg:text-8xl">
          Join your Campus<br />Community
        </h1>
        
        <Button
          size="lg"
          onClick={() => setLocation("/register")}
          className="h-14 px-12 text-lg font-semibold"
          data-testid="button-get-started"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
}
