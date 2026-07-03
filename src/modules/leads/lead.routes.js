const express = require('express');
const { authenticate, requireAdmin } = require('../../common/middleware/auth.middleware');
const leadController = require('./lead.controller');

const router = express.Router();

// All lead endpoints require a valid JWT.
router.use(authenticate);

// Assignment changes (assigning/reassigning a lead) are admin-only.
// Status/remarks updates stay open to employees. Delegates to the shared
// requireAdmin so the role check is never duplicated.
const restrictAssignmentToAdmin = (req, res, next) => {
  if (req.body && req.body.assignedTo !== undefined) {
    return requireAdmin(req, res, next);
  }
  return next();
};

// GET /api/leads — list with pagination, search and filters
router.get('/', leadController.list);

// POST /api/leads — manual lead creation
router.post('/', leadController.create);

// GET /api/leads/:id — lead detail
router.get('/:id', leadController.getById);

// PATCH /api/leads/:id — update status / remarks (any user); assignedTo (admin only)
router.patch('/:id', restrictAssignmentToAdmin, leadController.update);

// DELETE /api/leads/:id — delete a lead (admin only)
router.delete('/:id', requireAdmin, leadController.remove);

module.exports = router;
