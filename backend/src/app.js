// 后端应用主入口文件

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// 导入路由
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const tripRoutes = require('./routes/trips');
const billRoutes = require('./routes/bills');
const settlementRoutes = require('./routes/settlements');

// 导入中间件
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/auth');
const requestLogger = require('./middleware/logger');

// 创建 Express 应用
const app = express();

// 信任代理
app.set('trust proxy', 1);

// ============ 安全中间件 ============
app.use(helmet());

// ============ 日志中间件 ============
app.use(morgan('combined', { stream: requestLogger.stream }));

// ============ 解析中间件 ============
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ============ CORS 中间件 ============
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  optionsSuccessStatus: 200
}));

// ============ 健康检查端点 ============
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============ API 路由 ============

// 认证路由 (无需认证)
app.use('/v1/auth', authRoutes);

// 其他路由 (需要认证)
app.use('/v1/users', authenticate, userRoutes);
app.use('/v1/trips', authenticate, tripRoutes);
app.use('/v1/bills', authenticate, billRoutes);
app.use('/v1/settlements', authenticate, settlementRoutes);

// ============ 静态文件 ============
app.use('/uploads', express.static('uploads'));

// ============ 404 处理 ============
app.use(notFound);

// ============ 错误处理 ============
app.use(errorHandler);

// ============ 启动服务器 ============
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`✅ 服务器运行在端口 ${PORT}`);
  console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📝 日志级别: ${process.env.LOG_LEVEL || 'info'}`);
});

// ============ 优雅关闭 ============
process.on('SIGTERM', () => {
  console.log('SIGTERM 接收，正在关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});

module.exports = app;
