import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// PROJECT KNOWLEDGE BASE - Everything about RootCauseAI
const PROJECT_KNOWLEDGE = `
# RootCauseAI Project Documentation

## Overview
RootCauseAI is an AI-powered problem detection engine that helps companies save up to 90% on development costs by identifying hidden problems behind client requests.

## Core Features
1. **AI Problem Analysis**: Users enter what their client thinks they need, AI finds the REAL hidden problem
2. **Cost Savings Calculator**: Shows wrong solution cost vs right solution cost
3. **Tech Stack Recommendations**: Suggests specific technologies for the right solution
4. **Analysis History**: Saves all past analyses for each user
5. **User Profiles**: Edit name, email, view member since
6. **Settings**: Dark/light theme, export data, clear history
7. **Google OAuth Login**: Sign in with Google account
8. **Employee Verification**: Only verified company employees can access

## How to Sign Up

### For Large Companies (TCS, Cognizant, Zoho, Infosys, Wipro, Hexaware, etc.)
- Use your company email (e.g., name@tcs.com)
- Enter your Employee ID
- System validates the format automatically

### For Startups / Small Companies
- Use your company email
- Enter the invite code provided by your admin
- Code must be valid and not expired

### Not Allowed
- Personal emails (@gmail.com, @yahoo.com, @outlook.com, etc.) are NOT allowed
- Only verified company employees can access the platform

## How to Use the App

### Step 1: Sign Up / Login
- Go to signup page
- Enter your details based on your company type
- Or login with existing credentials

### Step 2: Analyze a Problem
- Type what your client thinks they need in the input box
- Example: "We need an AI chatbot for customer support"
- Click "Find REAL Problem"

### Step 3: Understand the Results
- **Hidden Root Cause**: What's actually wrong
- **Wrong Solution**: What they asked for + estimated cost
- **Right Solution**: What they should actually build + cost
- **Savings**: How much money they save
- **Recommended Tech Stack**: Specific technologies to use

### Step 4: Save and Review
- All analyses are saved to your history
- You can delete analyses
- Export your data as JSON

## Example Problems to Test

1. "We need an AI chatbot for customer support"
   → Hidden problem: Order tracking issues
   → Savings: ~$442,000

2. "We need AI to predict customer churn"
   → Hidden problem: Complex checkout process
   → Savings: ~$305,000

3. "We need an AI appointment scheduler"
   → Hidden problem: High no-show rate
   → Savings: ~$275,000

4. "We need blockchain for transaction security"
   → Hidden problem: Weak authentication
   → Savings: ~$838,000

5. "We need a mobile app for employee attendance"
   → Hidden problem: Fake attendance marking
   → Savings: ~$155,000

## Profile & Settings

### Profile Page
- Edit your full name
- Edit your email
- View member since date
- Change password

### Settings Page
- **Appearance**: Dark/Light/System theme
- **Compact Mode**: Reduce padding
- **Notifications**: Email alerts, analysis completion
- **Data & Privacy**: Clear history, export data

## Sidebar Menu (☰ icon)
- Profile: View/edit your information
- Settings: Change app preferences
- Logout: Sign out of your account

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: MySQL
- **AI**: Google Gemini API
- **Authentication**: JWT, Google OAuth

## Support
- For questions, use this chatbot
- For technical issues, contact admin
- For company verification, ask your HR/admin
`;

export const chatWithBot = async (userQuestion) => {
   console.log('💬 Chatbot question:', userQuestion);

   try {
      const prompt = `You are RootCauseAI Assistant, a helpful chatbot for the RootCauseAI platform.

PROJECT KNOWLEDGE:
${PROJECT_KNOWLEDGE}

USER QUESTION: "${userQuestion}"

INSTRUCTIONS:
1. Answer based ONLY on the project knowledge above
2. Be friendly, professional, and helpful
3. Keep answers concise (2-4 sentences if possible)
4. If you don't know the answer, say: "I'm not sure about that. Please contact support at afrahfathimahms9333@gmail.com"
5. For signup questions, explain the employee verification process clearly
6. For analysis questions, explain how to use the feature
7. For demo purposes, you can mention the demo account (demo/demo123)

Answer the user's question:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text();
    
    console.log('💬 Chatbot response:', answer.substring(0, 100));
    
    return answer;
    
  } catch (error) {
    console.error('Chatbot error:', error);
    return "I'm having trouble connecting right now. Please try again later or contact support at afrahfathimahms9333@gmail.com";
  }
};
