const express = require('express');
const { getBalance, getTransactions } = require('../controllers/creditController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/balance', getBalance);
router.get('/transactions', getTransactions);

module.exports = router;
