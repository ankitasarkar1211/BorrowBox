const express = require('express');
const { getMyLoans, getLendingLoans, getLoanById, returnLoan } = require('../controllers/loanController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// /my and /lending must be declared before /:id, or Express would try
// to match "my"/"lending" as the :id param.
router.get('/my', getMyLoans);
router.get('/lending', getLendingLoans);

router.get('/:id', getLoanById);
router.patch('/:id/return', returnLoan);

// Deliberately NO generic PUT /:id or PATCH /:id — a loan's status may
// only change through the controlled `return` action above (or, in a
// later module, other explicit action endpoints). This prevents a
// client from ever writing an arbitrary status directly.

module.exports = router;
