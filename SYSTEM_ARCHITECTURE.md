# System Architecture Document - Simulador de Parcelas

## 1. Project Overview
The **Simulador de Parcelas** is a specialized financial application designed for the Brazilian market. It allows users to simulate personal loan installments based on a principal amount, a monthly interest rate, and a range of installments. The application calculates the total amount to be paid, the estimated profit for the lender, and generates a formatted proposal ready for sharing (e.g., via WhatsApp).

## 2. Technology Stack
- **Core**: [React 19](https://react.dev/)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Motion](https://motion.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 3. Application Structure
- **`src/main.tsx`**: The entry point of the React application. It handles the DOM mounting and wraps the root component in `StrictMode`.
- **`src/App.tsx`**: The central logic hub. It manages application state (theme, inputs, results), handles user events, and coordinates the simulation flow.
- **`src/utils`**: Contains modularized logic for numerical processing. For example, `calculations.ts` handles currency formatting, string-to-number conversions, and the core simulation algorithm.
- **`types.ts`**: Defines strict TypeScript interfaces (e.g., `SimulationResult`, `SimulationInput`) to ensure data consistency across the application.
- **`index.css`**: Manages the design system via CSS variables (tokens) and Tailwind `@theme` directives. It defines the glassmorphism effects, shadows, and dark/light mode switches.

## 4. Application Flow
1. **Initialization**: Vite bundles the assets and serves `index.html`. The browser loads `main.tsx`, which renders the `App` component.
2. **State Setup**: `App.tsx` initializes state from `localStorage` (theme) and defaults.
3. **User Interaction**: The user enters financial data into restricted input fields.
4. **Trigger**: Clicking "Gerar Simulação" calls `handleGerar`, which validates inputs and invokes utility functions.
5. **Rendering**: React re-renders the UI with the calculation results, animating the transition using Motion.

## 5. Data Processing Logic
The application utilizes a specific calculation strategy based on the SAC (Sistema de Amortização Constante) logic variation for the Brazilian context:
- **Interest Formula**: `jurosTotal = principal * taxa * (n + 1) / 2`.
- **Rounding Logic**: After calculating the theoretical total, the application rounds the installment to the nearest multiple of 5 (via `Math.round((total / n) / 5) * 5`) to simplify cash transactions or standard billing.
- **Profit Calculation**: Profit is derived from the difference between the sum of adjusted installments and the original principal.

## 6. Extension Strategy
To add new features safely:
- **Numerical Logic**: Add new functions to `src/utils/calculations.ts` with unit tests in mind.
- **New States**: Add new interfaces to `types.ts` before implementing them in `App.tsx`.
- **UI Components**: Use the design tokens defined in `index.css` to maintain visual consistency.
- **External Integration**: If adding the Gemini API (already present in `package.json`), utilize the established `env` pattern in `vite.config.ts`.
