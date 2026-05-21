import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('🔧 Loading AI Service...');
console.log('📡 API Key exists:', !!process.env.GEMINI_API_KEY);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export const analyzeProblem = async (userInput) => {
  console.log('🚀 Analyzing:', userInput);
  
  try {
    // Dynamic prompt that forces UNIQUE response
    const prompt = `You are RootCauseAI. Generate a UNIQUE solution for this specific problem.

Problem: "${userInput}"

Return ONLY this JSON format, no other text:

{
  "hiddenProblem": "1 sentence specific to this problem",
  "wrongSolution": "Expensive solution they asked for",
  "wrongSolutionCost": "high cost between $100,000-$1,000,000",
  "rightSolution": "Simple cheap fix",
  "rightSolutionCost": "low cost between $500-$50,000",
  "savings": "difference between costs",
  "techStack": ["tech1", "tech2", "tech3"]
}

IMPORTANT: Generate a COMPLETELY DIFFERENT response for each problem. Do not reuse the same hidden problem or tech stack.

Now respond for: "${userInput}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean response
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) text = jsonMatch[0];
    
    const analysis = JSON.parse(text);
    console.log('✅ Gemini success:', analysis.hiddenProblem.substring(0, 50));
    return analysis;
    
  } catch (error) {
    console.error('❌ Gemini error:', error.message);
    // Return UNIQUE fallback based on input
    return getUniqueFallback(userInput);
  }
};

// UNIQUE fallback for each problem type
const getUniqueFallback = (input) => {
  const lower = input.toLowerCase();
  console.log('📁 Unique fallback for:', input.substring(0, 40));
  
  const fallbacks = {
    chatbot: {
      hiddenProblem: "Order status tracking is invisible to customers, causing 60% of support calls",
      wrongSolution: "Enterprise AI chatbot with NLP and ticket system integration",
      wrongSolutionCost: "$450,000",
      rightSolution: "Add real-time order tracking page + automated SMS updates",
      rightSolutionCost: "$8,000",
      savings: "$442,000",
      techStack: ["REST API", "Twilio SMS", "Order DB", "React Dashboard"]
    },
    churn: {
      hiddenProblem: "Checkout requires account creation and has 7 steps, causing 75% abandonment",
      wrongSolution: "Machine learning churn prediction with data warehouse and BI tools",
      wrongSolutionCost: "$320,000",
      rightSolution: "Guest checkout option + reduce to 2-step payment flow",
      rightSolutionCost: "$15,000",
      savings: "$305,000",
      techStack: ["Stripe Elements", "LocalStorage", "Express Session"]
    },
    appointment: {
      hiddenProblem: "No automated reminders cause 35% no-show rate for appointments",
      wrongSolution: "AI scheduling engine with predictive algorithms and ML",
      wrongSolutionCost: "$280,000",
      rightSolution: "Automated WhatsApp/SMS reminder system 24h before appointment",
      rightSolutionCost: "$5,000",
      savings: "$275,000",
      techStack: ["Twilio API", "Node-cron", "Google Calendar API"]
    },
    blockchain: {
      hiddenProblem: "User passwords are stored in plain text without 2FA protection",
      wrongSolution: "Enterprise blockchain implementation with distributed ledger",
      wrongSolutionCost: "$850,000",
      rightSolution: "Add TOTP 2FA + bcrypt password hashing + rate limiting",
      rightSolutionCost: "$12,000",
      savings: "$838,000",
      techStack: ["Speakeasy", "bcrypt", "Helmet.js", "Redis"]
    },
    attendance: {
      hiddenProblem: "Employees mark attendance remotely while still in bed, causing trust issues",
      wrongSolution: "Custom React Native app with face recognition",
      wrongSolutionCost: "$180,000",
      rightSolution: "Geofenced check-in with GPS + selfie verification",
      rightSolutionCost: "$25,000",
      savings: "$155,000",
      techStack: ["Geolocation API", "React Native", "Cloudinary"]
    }
  };
  
  // Match by keywords
  if (lower.includes('chat')) return fallbacks.chatbot;
  if (lower.includes('churn') || lower.includes('predict')) return fallbacks.churn;
  if (lower.includes('appointment') || lower.includes('scheduler')) return fallbacks.appointment;
  if (lower.includes('blockchain') || lower.includes('security')) return fallbacks.blockchain;
  if (lower.includes('attendance') || lower.includes('mobile')) return fallbacks.attendance;
  
  // Generic unique response
  return {
    hiddenProblem: `The actual problem is inefficient workflow for: "${input.substring(0, 40)}"`,
    wrongSolution: `Custom enterprise solution for this request`,
    wrongSolutionCost: "$250,000",
    rightSolution: "Process optimization using existing tools",
    rightSolutionCost: "$15,000",
    savings: "$235,000",
    techStack: ["Zapier", "Google Sheets", "API Integration", "Automation"]
  };
};
