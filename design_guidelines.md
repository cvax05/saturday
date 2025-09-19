# Pregame Connect - Design Guidelines

## Design Approach
**Reference-Based Approach**: Drawing inspiration from social platforms like Instagram and dating apps like Bumble/Hinge for their emphasis on personal profiles, discovery feeds, and social interaction patterns.

## Core Design Elements

### Color Palette
**Dark Mode Primary**:
- Background: 220 15% 8%
- Surface: 220 15% 12% 
- Primary Brand: 280 85% 65% (vibrant purple for energy/nightlife)
- Text Primary: 0 0% 95%
- Text Secondary: 220 10% 70%

**Light Mode Primary**:
- Background: 0 0% 98%
- Surface: 0 0% 100%
- Primary Brand: 280 85% 55%
- Text Primary: 220 15% 15%
- Text Secondary: 220 10% 45%

**Accent Colors**: 
- Success (ratings): 120 60% 50%
- Warning (pending ratings): 35 85% 60%
- Danger (lockout): 0 70% 55%

### Typography
- **Primary**: Inter (Google Fonts) - clean, modern readability
- **Headings**: Inter Bold (600-700 weights)
- **Body**: Inter Regular/Medium (400-500 weights)
- **Captions**: Inter Regular 14px for ratings/metadata

### Layout System
**Tailwind Spacing**: Consistent use of 2, 4, 6, 8, 12, 16 units
- Mobile-first responsive design
- Card-based layouts with 4-unit padding
- 6-unit gaps between major sections
- 8-unit margins for page containers

### Component Library

**Core Components**:
- **Profile Cards**: Rounded image, name, description, quick stats (group size, alcohol preference)
- **Rating Display**: Star rating with review count and average
- **Message Bubbles**: Distinct sender/receiver styling
- **Status Indicators**: Available/busy states with color coding
- **Action Buttons**: Primary (purple), secondary (outline), and warning states

**Navigation**:
- Bottom tab bar for mobile (Discover, Messages, Profile)
- Clean header with minimal elements
- Floating action button for quick actions

**Forms**:
- Rounded input fields with subtle borders
- Image upload areas with drag-and-drop styling
- Rating interface with interactive stars and text areas

**Data Displays**:
- Infinite scroll feed for profile discovery
- Chat interface with timestamp grouping
- Profile statistics with clear visual hierarchy

**Overlays**:
- Modal dialogs for rating submissions
- Image viewers for profile photos
- Confirmation dialogs for critical actions

### Images
- **Profile Photos**: Circular thumbnails (80px) in cards, larger (200px) on profile pages
- **No Hero Image**: Focus on user-generated content and profiles
- **Placeholder Images**: Subtle gradient backgrounds for empty states
- **Image Upload Areas**: Dashed border styling with upload icons

### Key Interaction Patterns
- **Discovery Feed**: Card-based infinite scroll with tap-to-view-profile
- **Rating Flow**: Mandatory modal after meetup confirmation, blocks app access until completed
- **Messaging**: Standard chat interface with message status indicators
- **Profile Views**: Clean layout emphasizing description, availability, and ratings

### Accessibility & Responsiveness
- High contrast ratios in both light and dark modes
- Touch-friendly button sizes (minimum 44px)
- Clear focus states for keyboard navigation
- Responsive breakpoints: mobile-first, tablet at 768px, desktop at 1024px

This design creates a modern, social platform that balances discovery, communication, and accountability through its rating system while maintaining the energy and excitement associated with pregame activities.