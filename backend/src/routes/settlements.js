// 结算路由

const express = require('express');
const router = express.Router();
const SettlementController = require('../controllers/SettlementController');

/**
 * 生成结算方案
 * POST /settlements?tripId=xxx
 */
router.post('/', SettlementController.generateSettlement);

/**
 * 获取结算记录
 * GET /settlements/:settlementId
 */
router.get('/:settlementId', SettlementController.getSettlement);

/**
 * 获取用户在该出行的结算汇总
 * GET /settlements/summary?tripId=xxx
 */
router.get('/summary/my-summary', SettlementController.getMySettlementSummary);

/**
 * 标记结算完成
 * PUT /settlements/:settlementId/complete
 */
router.put('/:settlementId/complete', SettlementController.markSettlementComplete);

module.exports = router;
