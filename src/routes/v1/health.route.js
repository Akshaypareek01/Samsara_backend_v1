import express from 'express';

const router = express.Router();

/**
 * Public liveness probe. No DB, no auth — if this returns 200, Express is up.
 * Clients use this to decide "maintenance" vs "this network can't reach us".
 */
router.get('/', (req, res) => {
  res.status(200).json({ ok: true });
});

export default router;
