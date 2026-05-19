import { analyzeProblem } from './backend/services/aiService.js';

(async () => {
  try {
    console.log('Testing analyzeProblem...');
    const result = await analyzeProblem("We need an AI chatbot");
    console.log('Result:', result);
  } catch (err) {
    console.error('Crash:', err);
  }
})();
