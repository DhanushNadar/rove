const { z } = require('zod');

const createWhiteboardSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(100).optional(),
    isPublic: z.boolean().optional()
  })
});

const saveCanvasSchema = z.object({
  body: z.object({
    canvasData: z.any({ required_error: 'Canvas data is required' })
  })
});

const shareWhiteboardSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required'),
    role: z.enum(['viewer', 'editor']).default('viewer')
  })
});

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: 'fail',
        errors: error.issues.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      });
    }
    return res.status(400).json({
      status: 'fail',
      message: error.message || 'Validation failed'
    });
  }
};

module.exports = {
  validate,
  createWhiteboardSchema,
  saveCanvasSchema,
  shareWhiteboardSchema
};
