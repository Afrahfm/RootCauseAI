import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Force load .env from backend folder
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('🔧 Loading AI Service...');
console.log('📡 GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const generatePrompt = (userInput) => {
  return `You are RootCauseAI, a business problem detective.

CLIENT SAYS: "${userInput}"

Your job: Find what they REALLY need vs what they asked for.

Return ONLY valid JSON. No other text.

{
  "hiddenProblem": "specific root cause (1 sentence)",
  "wrongSolution": "what they asked for - specific",
  "wrongSolutionCost": "$XXX,XXX",
  "rightSolution": "what they should actually build - specific",
  "rightSolutionCost": "$X,XXX",
  "savings": "$XXX,XXX",
  "techStack": ["tech1", "tech2", "tech3"]
}

Example for "We need an AI chatbot":
{
  "hiddenProblem": "Customers can't find order status without calling",
  "wrongSolution": "AI chatbot with NLP",
  "wrongSolutionCost": "$450,000",
  "rightSolution": "Add order tracking page with SMS updates",
  "rightSolutionCost": "$8,000",
  "savings": "$442,000",
  "techStack": ["REST API", "Twilio", "Order DB"]
}

Now analyze: "${userInput}"
Generate a UNIQUE response specific to this input. Do NOT copy the example.`;
};

export const analyzeProblem = async (userInput) => {
  console.log('🚀 analyzeProblem called with:', userInput);
  
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    console.error('❌ NO GEMINI_API_KEY in .env file! Using unique fallback.');
    return getUniqueFallback(userInput);
  }
  
  try {
    const prompt = generatePrompt(userInput);
    console.log('📤 Sending to Gemini API...');
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('📥 Raw response:', text);
    
    // Clean and parse JSON
    let clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const analysis = JSON.parse(clean);
    
    console.log('✅ Analysis generated successfully');
    console.log('   Hidden Problem:', analysis.hiddenProblem);
    console.log('   Savings:', analysis.savings);
    
    return analysis;
    
  } catch (error) {
    console.error('❌ Gemini API Error:', error.message);
    return getUniqueFallback(userInput);
  }
};

// UNIQUE fallback based on input (not same for all)
const getUniqueFallback = (input) => {
  const lower = input.toLowerCase();
  
  const fallbacks = {
    chatbot: {
      hiddenProblem: "Customers cannot find order or account information without agent help",
      wrongSolution: "Custom AI chatbot with ticket system",
      wrongSolutionCost: "$450,000",
      rightSolution: "Self-service order tracking portal",
      rightSolutionCost: "$8,000",
      savings: "$442,000",
      techStack: ["Order API", "SMS Gateway", "React"]
    },
    churn: {
      hiddenProblem: "Checkout process has too many steps causing abandonment",
      wrongSolution: "ML churn prediction platform",
      wrongSolutionCost: "$320,000",
      rightSolution: "Simplify checkout to 2 clicks",
      rightSolutionCost: "$15,000",
      savings: "$305,000",
      techStack: ["Stripe", "LocalStorage", "One-click"]
    },
    appointment: {
      hiddenProblem: "Patients forget appointments, causing 30% no-show rate",
      wrongSolution: "AI scheduling with ML predictions",
      wrongSolutionCost: "$280,000",
      rightSolution: "Automated SMS reminders 24h before",
      rightSolutionCost: "$5,000",
      savings: "$275,000",
      techStack: ["Twilio", "Node-cron", "Calendar API"]
    },
    blockchain: {
      hiddenProblem: "Weak password policy and lack of 2FA",
      wrongSolution: "Enterprise blockchain implementation",
      wrongSolutionCost: "$850,000",
      rightSolution: "Add 2FA and enforce strong passwords",
      rightSolutionCost: "$12,000",
      savings: "$838,000",
      techStack: ["TOTP", "bcrypt", "Helmet"]
    },
    attendance: {
      hiddenProblem: "Employees marking attendance fraudulently from home",
      wrongSolution: "Custom mobile app with biometrics",
      wrongSolutionCost: "$180,000",
      rightSolution: "Geofenced check-in with GPS verification",
      rightSolutionCost: "$25,000",
      savings: "$155,000",
      techStack: ["Geolocation API", "React Native", "GPS"]
    }
  };
  
  // Find matching fallback
  for (const [key, value] of Object.entries(fallbacks)) {
    if (lower.includes(key)) {
      console.log(`📁 Using fallback for: ${key}`);
      return value;
    }
  }
  
  // Generic unique fallback
  return {
    hiddenProblem: `The real issue is process inefficiency, not technology. Specific to: "${input.substring(0, 50)}"`,
    wrongSolution: `Custom enterprise solution for this request`,
    wrongSolutionCost: "$250,000",
    rightSolution: "Process optimization using existing tools",
    rightSolutionCost: "$15,000",
    savings: "$235,000",
    techStack: ["Process mapping", "API integration", "Automation"]
  };
};
