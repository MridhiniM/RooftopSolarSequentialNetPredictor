# ☀️ Rooftop Solar Predictor

A web application that helps users estimate their rooftop's solar energy generation potential, installation costs, and payback period. Trace your roof on an interactive map and get instant solar energy predictions tailored to your location.

**Live Demo:** https://rooftop-solar-sequential-net-predic.vercel.app/

## Features

- 🗺️ **Interactive Map Tracing** — Use Mapbox GL to trace your rooftop outline and calculate area
- ⚡ **Solar Generation Estimates** — Get annual energy generation predictions based on location and roof parameters
- 💰 **Financial Projections** — View installation costs, annual savings, and payback period
- 📊 **Monthly Generation Chart** — Visualize seasonal energy generation patterns
- 🌍 **Multi-City Support** — Currently supports Bangalore and Mumbai (easily extensible)
- 🎨 **Solar-Themed UI** — Warm, inviting interface with yellow accents and smooth animations
- 📱 **Responsive Design** — Works on desktop and mobile devices

## Tech Stack

**Frontend:**
- React 19 with TypeScript
- Mapbox GL JS & react-map-gl (v8)
- Recharts for data visualization
- Tailwind CSS & Poppins font
- Vite (build tool)

**Backend:**
- Python FastAPI (separate repo)
- Physics-based solar prediction model with climatology data

**Deployment:**
- Vercel (frontend)
- Backend deployed separately

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- A Mapbox API token (free at https://mapbox.com)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd rooftop-solar-predictor/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` and add your Mapbox token:
   ```
   VITE_MAPBOX_TOKEN=your_mapbox_token_here
   VITE_API_URL=http://localhost:8000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   The app will open at `http://localhost:5173`

5. **Build for production**
   ```bash
   npm run build
   npm run preview
   ```

## Usage

1. **Select a city** from the dropdown (Bangalore or Mumbai)
2. **Trace your rooftop** by clicking points on the map to outline your roof area
3. **Adjust parameters** (optional):
   - Panel tilt angle (leave blank for optimal auto-calculated value)
   - Azimuth angle (180° = south-facing, optimal for northern hemisphere)
4. **Click "PREDICT ENERGY OUTPUT"** to see:
   - System size in kWp
   - Annual energy generation in kWh
   - Installation cost in INR
   - Payback period in years
   - Monthly generation chart
   - Projected 5-year and 10-year savings

## Environment Variables

Create a `.env.local` file with the following variables:

```
VITE_MAPBOX_TOKEN=your_mapbox_token
VITE_API_URL=http://localhost:8000  # Backend API URL
```

See `.env.example` for all available variables.

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── RoofMap.tsx         # Mapbox map for roof tracing
│   │   └── ResultsDashboard.tsx # Results visualization
│   ├── App.tsx                 # Main application component
│   ├── api.ts                  # API client functions
│   ├── index.css               # Global styles & animations
│   └── main.tsx                # Entry point
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## How It Works

1. **Area Calculation** — Uses Turf.js to calculate polygon area from traced roof coordinates
2. **Solar Prediction** — Sends roof area, city, tilt, and azimuth to backend API
3. **Backend Processing** — Physics-based model calculates generation using:
   - Local solar irradiance (climatology data)
   - Panel efficiency (standard 20%)
   - Temperature derating
   - Angle of incidence losses
4. **Financial Estimates** — Calculates costs based on ₹60/Wp system cost (configurable)

## Styling & Design

The app features a solar-themed design with:
- Warm cream background (#fffbf0)
- Golden yellow accents (#fbbf24)
- Sharp, geometric corners (no border-radius)
- Poppins font family
- Pulsing sun animation on results
- Responsive grid layout

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repo to Vercel at https://vercel.com
3. Set environment variables in Vercel dashboard:
   - `VITE_MAPBOX_TOKEN` — Your Mapbox public token
   - `VITE_API_URL` — Backend API URL (e.g., https://api.example.com)
4. Deploy! Vercel will automatically build and deploy on push

## Performance Notes

- Mapbox bundle is ~2MB (gzipped ~500KB)
- Total bundle size: ~200KB gzipped (without Mapbox)
- Map loads at zoom 19 for precise roof tracing
- Monthly generation data is paginated in results

## Known Limitations

- Currently limited to Bangalore and Mumbai (extend by adding cities to backend)
- Uses placeholder climatology data (replace with trained ML model for production)
- Panel degradation not modeled
- Cost figures are illustrative averages, not bankable quotes
- Doesn't account for shading or roof obstacles

## Contributing

To add new cities:

1. **Backend:** Add city to the cities endpoint with latitude/longitude
2. **Frontend:** City will automatically appear in the dropdown

## Future Enhancements

- [ ] Add more Indian cities
- [ ] 3D roof visualization
- [ ] PDF report generation
- [ ] Integration with solar installer directories
- [ ] Comparison with grid electricity costs
- [ ] Export results as PDF

## License

[Add your license here]

## Contact

For questions or support, reach out at [your-email]

---

**Built with ❤️ for solar energy adoption in India**