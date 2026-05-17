import express from 'express';
import pool from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';
import { validate, analyzeSchema } from '../middleware/validation.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import { analyzeProblem } from '../services/aiService.js';

const router = express.Router();

router.post('/analyze', authenticate, apiLimiter, validate(analyzeSchema), async (req, res) => {
  try {
    const { userInput } = req.body;
    
    const aiResult = await analyzeProblem(userInput);

    const result = await pool.query(
      `INSERT INTO analyses 
      (user_id, user_input, hidden_problem, wrong_solution, wrong_solution_cost, right_solution, right_solution_cost, savings, tech_stack) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        req.user.id,
        userInput,
        aiResult.hiddenProblem,
        aiResult.wrongSolution,
        aiResult.wrongSolutionCost,
        aiResult.rightSolution,
        aiResult.rightSolutionCost,
        aiResult.savings,
        JSON.stringify(aiResult.techStack)
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during analysis' });
  }
});

router.get('/analyses', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM analyses WHERE user_id = $1 ORDER BY id DESC', [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/analyses/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM analyses WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/analyses/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM analyses WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Analysis not found or unauthorized' });
    }
    res.json({ message: 'Analysis deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
