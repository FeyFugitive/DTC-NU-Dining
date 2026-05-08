# Campus Dining Platform - Wireframe Designs

This project contains three different wireframe designs for a university dining platform (inspired by nufood.me). The goal is to help students quickly decide where and what to eat on campus.

## Design Variants

### CB (Card Based)
**Route:** `/cb/`
**Navigation:** Bottom tab bar
**Layout:** Card-based with generous spacing

**Features:**
- Bottom navigation (Home, Favorites)
- Card-style dining hall listings
- Horizontal filter chips
- Image-focused menu items
- Mobile-first approach

**Key Files:**
- Layout: `src/app/components/Layout.tsx`
- Pages: `src/app/pages/Home.tsx`, `DiningHallDetail.tsx`, `FoodItemDetail.tsx`, `Favorites.tsx`
- Components: `src/app/components/DiningHallCard.tsx`, `MenuItem.tsx`, `FilterBar.tsx`

---

### LB (List Based)
**Route:** `/lb/`
**Navigation:** Side drawer (hamburger menu)
**Layout:** Compact, data-dense lists

**Features:**
- Side drawer navigation
- Compact list view for dining halls
- Vertical filter sidebar (toggleable)
- Desktop-optimized layout
- Efficient use of space

**Key Files:**
- Layout: `src/app/components/designB/LayoutB.tsx`
- Pages: `src/app/pages/designB/HomeB.tsx`, `DiningHallDetailB.tsx`, `FoodItemDetailB.tsx`, `FavoritesB.tsx`
- Components: `src/app/components/designB/DiningHallCardB.tsx`, `MenuItemB.tsx`

---

### MB (Map Based)
**Route:** `/mb/`
**Navigation:** Top tab bar
**Layout:** Visual-first with interactive map

**Features:**
- Top tab navigation (Explore, Saved)
- Interactive campus map with location pins
- Swipeable food card interface
- Station-based menu browsing
- Bold visual design with thick borders
- Quick Picks categories

**Key Files:**
- Layout: `src/app/components/designC/LayoutC.tsx`
- Pages: `src/app/pages/designC/HomeC.tsx`, `DiningHallDetailC.tsx`, `FoodItemDetailC.tsx`, `FavoritesC.tsx`
- Components: `src/app/components/designC/DiningHallMapCard.tsx`, `FoodCardSwipe.tsx`

---

## Common Features Across All Designs

1. **Home/Dashboard Page**
   - Search bar for dining halls or food items
   - List of dining halls with status indicators
   - Filters (open now, nearby, meal exchange, low wait time)
   - Each dining hall shows: name, open/closed status, wait time, crowd level, payment options

2. **Dining Hall Detail Page**
   - Dining hall name, location, and directions button
   - Live status and crowd level
   - Menu grouped by food stations
   - Each food item clickable for details

3. **Food Item Detail Page**
   - Item name, location, dietary icons
   - Calorie count
   - Full ingredients list
   - Photo upload functionality
   - Favorite toggle

4. **Favorites Page**
   - Saved food items with availability status
   - Notification option for unavailable items
   - Saved dining halls

---

## Tech Stack

- **Framework:** React 18.3.1 with TypeScript
- **Routing:** React Router 7.13.0 (Data mode)
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React
- **Build Tool:** Vite
- **Package Manager:** pnpm

---

## Project Structure

```
src/
├── app/
│   ├── App.tsx                      # Main app with RouterProvider
│   ├── routes.tsx                   # Route configuration
│   │
│   ├── pages/                       # CB design pages
│   │   ├── DesignSelector.tsx       # Landing page to choose design
│   │   ├── Home.tsx
│   │   ├── DiningHallDetail.tsx
│   │   ├── FoodItemDetail.tsx
│   │   └── Favorites.tsx
│   │
│   ├── pages/designB/               # LB design pages
│   │   ├── HomeB.tsx
│   │   ├── DiningHallDetailB.tsx
│   │   ├── FoodItemDetailB.tsx
│   │   └── FavoritesB.tsx
│   │
│   ├── pages/designC/               # MB design pages
│   │   ├── HomeC.tsx
│   │   ├── DiningHallDetailC.tsx
│   │   ├── FoodItemDetailC.tsx
│   │   └── FavoritesC.tsx
│   │
│   └── components/
│       ├── Layout.tsx               # CB layout
│       ├── DiningHallCard.tsx
│       ├── MenuItem.tsx
│       ├── FilterBar.tsx
│       │
│       ├── designB/                 # LB components
│       │   ├── LayoutB.tsx
│       │   ├── DiningHallCardB.tsx
│       │   └── MenuItemB.tsx
│       │
│       ├── designC/                 # MB components
│       │   ├── LayoutC.tsx
│       │   ├── DiningHallMapCard.tsx
│       │   └── FoodCardSwipe.tsx
│       │
│       └── ui/                      # Shared UI components (shadcn)
│
└── styles/
    ├── theme.css
    └── fonts.css
```

---

## Running the Project

```bash
# Install dependencies
pnpm install

# Start dev server (already running in this environment)
# Navigate to the preview URL

# Choose a design variant:
# - / (design selector)
# - /cb/home (card based)
# - /lb/home (list based)
# - /mb/home (map based)
```

---

## Design Philosophy

**Wireframe Approach:**
- Low-fidelity grayscale design
- Focus on layout and information hierarchy
- Simple boxes and placeholders instead of final imagery
- Clear spacing and component structure

**User Goal:**
Help students make quick dining decisions by showing:
- What's open right now
- How busy locations are
- What food is available
- Dietary information
- Real-time status

---

## Next Steps for Development

1. Choose the most usable design based on user testing
2. Add real data integration (dining hall APIs)
3. Implement actual map integration for MB design
4. Add authentication for personalized favorites
5. Implement notifications for food availability
6. Add final visual design and branding
7. Mobile app conversion (React Native)
