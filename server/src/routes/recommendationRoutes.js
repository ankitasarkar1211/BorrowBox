const express = require('express');
const { createRecommendation } = require('../controllers/recommendationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', createRecommendation);

module.exports = router;
