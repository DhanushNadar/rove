const { z } = require('zod');

const schema = z.object({
  body: z.object({
    name: z.string()
  })
});

try {
  schema.parse({});
} catch (e) {
  console.log("instanceof ZodError:", e instanceof z.ZodError);
  console.log("e.errors exists:", !!e.errors);
  console.log("e.issues exists:", !!e.issues);
  console.log("Keys:", Object.keys(e));
}
