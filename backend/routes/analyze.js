import express from 'express';
import pool from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';
import { analyzeProblem } from '../services/aiService.js';

const router = express.Router();

// POST /api/analyze - Analyze a client problem
router.post('/analyze', authenticate, async (req, res) => {
  try {
    const userInput = req.body.userInput || req.body.user_input || req.body.problem;

    if (!userInput) {
      return res.status(400).json({ error: 'Problem description is required' });
    }

    console.log('📊 Analysis request for user:', req.user.id);
    console.log('📝 Problem:', userInput);

    // Call the AI service
    const aiResult = await analyzeProblem(userInput);

    console.log('🤖 AI Result:', aiResult);

    // Save to database using native mysql2 ? placeholders
    const [insertResult] = await pool.query(
      `INSERT INTO analyses 
      (user_id, user_input, hidden_problem, wrong_solution, wrong_solution_cost, right_solution, right_solution_cost, savings, tech_stack) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

    const [rows] = await pool.query('SELECT * FROM analyses WHERE id = ?', [insertResult.insertId]);

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('❌ Analysis error:', error);
    res.status(500).json({ error: 'Server error during analysis', details: error.message });
  }
});

// GET /api/analyses - Get user's analysis history
router.get('/analyses', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM analyses WHERE user_id = ? ORDER BY id DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error('❌ History fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/analyses/:id - Get single analysis
router.get('/analyses/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM analyses WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/analyses/:id - Delete analysis
router.delete('/analyses/:id', authenticate, async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM analyses WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Analysis not found or unauthorized' });
    }
    res.json({ message: 'Analysis deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;