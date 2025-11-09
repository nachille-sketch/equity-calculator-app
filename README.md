# Financial Planning App

A comprehensive financial planning application for tech workers in the Netherlands. Plan your finances, track RSUs, manage investments, and visualize your wealth growth.

## Features

- 📊 **Financial Dashboard** - Overview of your net worth and key metrics
- 💰 **Yearly Financials** - Detailed projections with income, expenses, and savings
- 🎯 **RSU Management** - Track and manage your RSU grants and vesting schedule
- 📈 **Investment Tracking** - Monitor your investment and pension growth
- 🎨 **Beautiful UI** - Clean, modern design with smooth animations
- 💾 **Local Storage** - All your data is saved locally in your browser

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Lucide React** - Icons

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation

```bash
# Clone the repository
git clone https://github.com/nachille-sketch/equity-calculator-app.git
cd equity-calculator-app

# Install dependencies
npm install

# Start development server
npm run dev
```

Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com/new)
3. Import your GitHub repository
4. Vercel will auto-detect settings and deploy

The app is configured with `vercel.json` for optimal deployment.

## Project Structure

```
financial-planning-app/
├── src/
│   ├── components/     # React components
│   ├── context/        # React context (state management)
│   ├── hooks/          # Custom React hooks
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions (calculations)
│   ├── App.tsx         # Main app component
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── public/             # Static assets
├── index.html          # HTML template
├── vite.config.ts      # Vite configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── vercel.json         # Vercel deployment config
```

## Key Features Explained

### Dutch Tax Calculation
- Accurate 2025 tax brackets and rates
- 30% ruling support
- Social security contributions (AOW, ANW, WLZ)
- Tax credits (Algemene Heffingskorting, Arbeidskorting)

### RSU Tracking
- Multiple grant types (Main, Refresher, Promotion)
- Automatic vesting schedule calculation
- Stock price growth modeling
- Tax impact analysis

### Financial Projections
- Multi-year projections
- Salary growth modeling
- Expense inflation tracking
- Investment return calculations

## License

Private - All rights reserved

## Author

Built for better financial planning

