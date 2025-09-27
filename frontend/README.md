# BrandX Frontend

A modern web application built with Next.js that enables businesses to create and manage loyalty programs through blockchain technology and AI-powered bounty systems.

## 🚀 Tech Stack

### Core Framework
- **Next.js 15.5.3** - React framework with App Router
- **React 19.1.0** - Latest React with concurrent features
- **TypeScript 5** - Type-safe development

### Authentication & Web3
- **Privy** - Web3 authentication with embedded wallets
- **Ethers.js 5.7.2** - Ethereum blockchain interaction
- **Viem 2.37.5** - Modern Ethereum library for contract interactions

### Database & Backend
- **Supabase** - PostgreSQL database with real-time features
- **Zustand 5.0.8** - Lightweight state management

### UI & Styling
- **Tailwind CSS 4** - Utility-first CSS framework
- **Framer Motion 12.23.12** - Animation library
- **Geist Font** - Modern typography
- **Paper Design Shaders** - WebGL shader effects

### Development Tools
- **ESLint** - Code linting and formatting
- **PostCSS** - CSS processing

## 🎯 Key Features

### Business Management
- **Business Onboarding** - Complete setup flow for new businesses
- **Dashboard** - Comprehensive business analytics and management
- **Brand Analysis** - AI-powered brand sentiment analysis
- **Bounty Management** - Create and manage customer engagement bounties

### Consumer Experience
- **Consumer Dashboard** - Personalized loyalty program interface
- **Bounty Completion** - Interactive task completion system
- **Voucher System** - Digital reward claiming and management
- **Member Profiles** - User profile and loyalty status tracking

### Blockchain Integration
- **Smart Contract Deployment** - Automated contract deployment for businesses
- **ENS Integration** - Ethereum Name Service subdomain management
- **Token Rewards** - Web3 token-based loyalty programs
- **Voucher Claims** - On-chain reward verification and claiming

### AI-Powered Features
- **Bounty Suggestions** - AI-generated engagement task recommendations
- **Brand Analysis** - Automated social media and review sentiment analysis
- **Smart Rewards** - Dynamic reward calculation based on user behavior

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes for backend functionality
│   ├── business-*/        # Business-facing pages
│   ├── consumer/          # Consumer-facing pages
│   └── brand-analysis/    # AI analysis features
├── components/            # Reusable React components
├── lib/                   # Utility functions and configurations
├── stores/                # Zustand state management
└── types/                 # TypeScript type definitions
```

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
# Copy the example env file
cp .env.example .env.local

# Add your environment variables:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🌟 Key Components

### Authentication System
- **Privy Integration** - Web3 wallet authentication
- **Auth Middleware** - Route protection and user state management
- **Auth Store** - Centralized authentication state

### Business Features
- **Business Onboarding Form** - Multi-step business registration
- **Bounty Management** - Create and manage customer engagement tasks
- **Brand Analysis Dashboard** - AI-powered brand monitoring

### Consumer Features
- **Consumer Dashboard** - Personalized loyalty program interface
- **Bounty Completion Modal** - Interactive task completion
- **Voucher Management** - Digital reward system

### Blockchain Features
- **Contract Integration** - Smart contract interaction utilities
- **ENS Management** - Subdomain creation and verification
- **Token Operations** - ERC-20 token reward handling

## 🔗 API Endpoints

The application includes comprehensive API routes for:
- Business management and onboarding
- Bounty creation and completion
- Smart contract interactions
- ENS subdomain operations
- AI-powered brand analysis
- User profile management
- Loyalty program administration

## 🎨 Design System

- **Modern UI** - Clean, professional interface design
- **Responsive Design** - Mobile-first responsive layout
- **Dark Theme** - Consistent dark mode throughout
- **Smooth Animations** - Framer Motion powered transitions
- **Shader Effects** - WebGL background effects for visual appeal

## 🚀 Deployment

The application is optimized for deployment on Vercel with:
- Automatic builds from Git
- Edge runtime optimization
- Static asset optimization
- Environment variable management

## 📝 License

This project is part of the BrandX ecosystem. See the main project LICENSE for details.
