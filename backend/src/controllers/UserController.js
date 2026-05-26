// 用户控制器

const { AppError } = require('../middleware/errorHandler');

class UserController {
  /**
   * 获取用户信息
   */
  static async getUserInfo(req, res, next) {
    try {
      const { userId } = req.params;

      // 验证权限：用户只能查看自己的信息
      if (userId !== req.user.id) {
        throw new AppError('无权访问他人信息', 403);
      }

      // TODO: 从数据库查询用户信息
      const user = {
        id: userId,
        nickname: '用户昵称',
        avatarUrl: '',
        totalExpense: 0,
        createdAt: new Date()
      };

      res.json({
        code: 0,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新用户信息
   */
  static async updateUserInfo(req, res, next) {
    try {
      const { userId } = req.params;
      const { nickname, phone, email } = req.body;

      // 验证权限
      if (userId !== req.user.id) {
        throw new AppError('无权修改他人信息', 403);
      }

      // TODO: 验证输入数据
      // TODO: 更新数据库

      res.json({
        code: 0,
        message: '更新成功',
        data: {
          id: userId,
          nickname,
          phone,
          email
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取用户统计信息
   */
  static async getUserStatistics(req, res, next) {
    try {
      const { userId } = req.params;

      if (userId !== req.user.id) {
        throw new AppError('无权访问他人信息', 403);
      }

      // TODO: 从数据库查询统计信息
      const statistics = {
        totalTrips: 0,
        totalExpense: 0,
        totalSettled: 0,
        pendingAmount: 0
      };

      res.json({
        code: 0,
        data: statistics
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
