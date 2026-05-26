// 结算控制器

const { AppError } = require('../middleware/errorHandler');
const SplitCalculationService = require('../services/SplitCalculationService');

class SettlementController {
  /**
   * 生成结算方案
   */
  static async generateSettlement(req, res, next) {
    try {
      const { tripId } = req.query;
      const { settlementMethod = 'auto' } = req.body;

      if (!tripId) {
        throw new AppError('缺少 tripId 参数', 400);
      }

      // TODO: 验证权限 (用户是否为出行成员)
      // TODO: 从数据库获取出行的所有账单
      // TODO: 计算所有成员的余额

      // 示例数据
      const members = [
        { userId: 'user1', balance: 100 },
        { userId: 'user2', balance: -50 },
        { userId: 'user3', balance: -50 }
      ];

      // 计算结算方案
      const transactions = SplitCalculationService.calculateSettlement(members);

      // TODO: 保存结算记录到数据库

      const settlement = {
        id: 'settlement-' + Date.now(),
        tripId,
        totalAmount: 0,
        transactions,
        status: 'pending',
        settlementMethod,
        createdAt: new Date()
      };

      res.status(201).json({
        code: 0,
        data: settlement
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取结算记录
   */
  static async getSettlement(req, res, next) {
    try {
      const { settlementId } = req.params;

      // TODO: 从数据库查询结算记录
      const settlement = {
        id: settlementId,
        totalAmount: 5000,
        transactions: [],
        status: 'completed'
      };

      res.json({
        code: 0,
        data: settlement
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取用户在该出行的结算汇总
   */
  static async getMySettlementSummary(req, res, next) {
    try {
      const { tripId } = req.query;

      if (!tripId) {
        throw new AppError('缺少 tripId 参数', 400);
      }

      // TODO: 验证权限
      // TODO: 从数据库获取用户在该出行的结算信息

      const summary = {
        userId: req.user.id,
        nickname: '用户1',
        totalPaid: 2000.00,
        totalOwed: 1250.00,
        balance: 750.00,
        status: 'unsettled',
        details: [
          {
            counterparty: { id: 'user2', nickname: '用户2' },
            amount: 250.00,
            direction: 'to_receive'
          }
        ]
      };

      res.json({
        code: 0,
        data: summary
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 标记结算完成
   */
  static async markSettlementComplete(req, res, next) {
    try {
      const { settlementId } = req.params;

      // TODO: 验证权限
      // TODO: 更新数据库

      res.json({
        code: 0,
        message: '结算已完成',
        data: {}
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SettlementController;
