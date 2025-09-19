import { useState } from "react";
import Navigation from '../Navigation';

export default function NavigationExample() {
  const [activeTab, setActiveTab] = useState<'discover' | 'messages' | 'profile'>('discover');

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Navigation Component</h2>
        <p className="text-muted-foreground mb-4">
          Current tab: <span className="font-semibold">{activeTab}</span>
        </p>
        
        <div className="space-y-4">
          <div className="p-4 bg-card rounded-lg">
            <h3 className="font-semibold mb-2">Normal State</h3>
            <p className="text-sm text-muted-foreground">
              User can navigate freely between tabs
            </p>
          </div>
          
          <div className="p-4 bg-card rounded-lg">
            <h3 className="font-semibold mb-2">With Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Message count and pending ratings are shown
            </p>
          </div>
        </div>
      </div>
      
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        messageCount={3}
        pendingRatingsCount={1}
      />
    </div>
  );
}