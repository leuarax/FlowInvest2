# VibeInvest - Intelligent Investment Analysis Dashboard

A sleek, Apple-style investment analysis web app that provides AI-powered ROI and risk assessments for various investment types.

## Features

- User onboarding with investment profile creation
- Manual investment entry with type, amount, and duration
- AI-powered ROI and risk assessment
- Interactive dashboard with investment performance visualization
- Scenario simulation capabilities
- Clean, modern Apple-inspired design

## Tech Stack

- React with Material-UI for components
- Tailwind CSS for styling
- Chart.js and Recharts for visualizations
- Local storage for data persistence (can be extended to use a backend)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## Project Structure

- `/src/components` - React components
- `/src/App.js` - Main application component
- `/public` - Static assets
- `/tailwind.config.js` - Tailwind CSS configuration

## Environment Variables

Create a `.env` file in the root directory and add your OpenAI API key:

```
REACT_APP_OPENAI_API_KEY=your_api_key_here
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
