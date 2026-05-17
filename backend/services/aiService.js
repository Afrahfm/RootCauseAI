import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || 'dummy_key';
const genAI = new GoogleGenerativeAI(apiKey);

const generateAnalysisPrompt = (userInput) => {
  return `
You are a Root Cause Analysis AI for enterprise clients. Your job is to find the HIDDEN problem behind what the client says they need.

CLIENT SAYS: "${userInput}"

Follow these rules STRICTLY:

RULE 1: Identify the SPECIFIC hidden problem based ONLY on what the client said.
RULE 2: Suggest a UNIQUE solution that directly addresses THAT specific hidden problem.
RULE 3: Calculate REALISTIC cost savings based on industry averages for THAT specific scenario.

OUTPUT ONLY VALID JSON. No extra text. No markdown.

{
  "hiddenProblem": "A specific 1-2 sentence description of what is actually wrong",
  "wrongSolution": "What they asked for (specific description)",
  "wrongSolutionCost": "Realistic cost estimate between $50,000 and $2,000,000",
  "rightSolution": "A specific, simple solution that fixes the hidden problem",
  "rightSolutionCost": "Realistic cost estimate between $500 and $50,000",
  "savings": "Calculate wrongCost - rightCost in dollars",
  "techStack": ["technology1", "technology2", "technology3"]
}

EXAMPLES OF CORRECT OUTPUT:

EXAMPLE 1:
Input: "We need an AI chatbot for customer support"
Output: {
  "hiddenProblem": "Customers cannot find their order status or account balance without calling support",
  "wrongSolution": "Custom AI chatbot with NLP and ticket integration",
  "wrongSolutionCost": "$450,000",
  "rightSolution": "Add a real-time 'Track Order' page with order status API and SMS notifications",
  "rightSolutionCost": "$8,000",
  "savings": "$442,000",
  "techStack": ["REST API", "Twilio SMS", "Order Management System"]
}

EXAMPLE 2:
Input: "We need blockchain for transaction security"
Output: {
  "hiddenProblem": "Your existing system lacks two-factor authentication and has weak password policies",
  "wrongSolution": "Enterprise blockchain implementation with smart contracts",
  "wrongSolutionCost": "$850,000",
  "rightSolution": "Implement 2FA via Google Authenticator + enforce strong password policy",
  "rightSolutionCost": "$12,000",
  "savings": "$838,000",
  "techStack": ["TOTP (RFC 6238)", "Speakeasy library", "HTTPS"]
}

EXAMPLE 3:
Input: "We need AI to predict customer churn"
Output: {
  "hiddenProblem": "Your checkout process has 6 steps, causing 70% cart abandonment",
  "wrongSolution": "Machine learning churn prediction model with data warehousing",
  "wrongSolutionCost": "$320,000",
  "rightSolution": "Reduce checkout to 2 steps: address + payment. Add guest checkout option",
  "rightSolutionCost": "$15,000",
  "savings": "$305,000",
  "techStack": ["React optimization", "Stripe Checkout", "Local storage"]
}

EXAMPLE 4:
Input: "We need an AI appointment scheduler for our hospital"
Output: {
  "hiddenProblem": "30% of patients miss appointments because they don't get reminders",
  "wrongSolution": "AI scheduling engine with patient preference learning",
  "wrongSolutionCost": "$280,000",
  "rightSolution": "Automated WhatsApp/SMS reminder system 24 hours before appointment",
  "rightSolutionCost": "$5,000",
  "savings": "$275,000",
  "techStack": ["Twilio API", "Node.js scheduler", "Calendar integration"]
}

EXAMPLE 5:
Input: "We need a mobile app for employee attendance"
Output: {
  "hiddenProblem": "Employees are marking attendance from home while working remotely",
  "wrongSolution": "React Native mobile app with biometric authentication",
  "wrongSolutionCost": "$180,000",
  "rightSolution": "Geofencing attendance system + GPS verification at office location",
  "rightSolutionCost": "$25,000",
  "savings": "$155,000",
  "techStack": ["Geolocation API", "React Native", "Node.js backend"]
}

Now analyze THIS client input: "${userInput}"

Generate a UNIQUE response specific to this input. DO NOT copy examples word-for-word.
`;
};

export const analyzeProblem = async (userInput) => {
  try {
    if (apiKey === 'your_gemini_api_key_here' || apiKey === 'dummy_key') {
      return getFallbackResponse(userInput);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = generateAnalysisPrompt(userInput);

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Improved JSON cleaning to handle potential markdown or extra text
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI response did not contain valid JSON");
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('AI Service Error:', error);
    return getFallbackResponse(userInput);
  }
};

const getFallbackResponse = (userInput) => {
  console.log('Using AI Fallback Response');
  return {
    hiddenProblem: "The user is likely experiencing a communication or process gap, not a need for complex software.",
    wrongSolution: "Custom Enterprise Solution based on: " + userInput.substring(0, 30) + "...",
    wrongSolutionCost: "$150,000",
    rightSolution: "A simple shared spreadsheet or basic tracking tool.",
    rightSolutionCost: "$5,000",
    savings: "$145,000",
    techStack: ["Google Sheets", "Zapier", "Trello"]
  };
};
