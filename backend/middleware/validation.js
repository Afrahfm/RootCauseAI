import { z } from 'zod';

export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    return res.status(400).json({ error: 'Validation failed', details: error.errors });
  }
};

export const signupSchema = z.object({
  body: z.object({
    email: z.string().email(),
    fullName: z.string().min(2),
    password: z.string().min(8),
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().min(1),
    password: z.string()
  })
});

export const analyzeSchema = z.object({
  body: z.object({
    userInput: z.string().min(10)
  })
});
