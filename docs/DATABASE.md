# 数据库设计文档

## 数据库选择

支持两种数据库方案：
1. **MySQL** - 传统关系型数据库，推荐用于生产环境
2. **MongoDB** - NoSQL 数据库，适合灵活的文档模型

本文以 MySQL 为主要示例。

## 数据库表设计

### 1. users 用户表

```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
  openid VARCHAR(128) UNIQUE NOT NULL COMMENT '微信 openid',
  nickname VARCHAR(255) COMMENT '昵称',
  avatar_url TEXT COMMENT '头像 URL',
  phone VARCHAR(20) COMMENT '手机号',
  email VARCHAR(255) COMMENT '邮箱',
  
  account_balance DECIMAL(12, 2) DEFAULT 0 COMMENT '账户余额',
  total_expense DECIMAL(12, 2) DEFAULT 0 COMMENT '总消费',
  
  status ENUM('active', 'inactive', 'blocked') DEFAULT 'active' COMMENT '用户状态',
  last_login_at DATETIME COMMENT '最后登录时间',
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  KEY idx_openid (openid),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';
```

### 2. trips 出行表

```sql
CREATE TABLE trips (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '出行ID',
  creator_id BIGINT NOT NULL COMMENT '创建者ID',
  name VARCHAR(255) NOT NULL COMMENT '出行名称',
  description TEXT COMMENT '出行描述',
  
  start_date DATE COMMENT '开始日期',
  end_date DATE COMMENT '结束日期',
  destination VARCHAR(255) COMMENT '目的地',
  
  member_count INT DEFAULT 1 COMMENT '成员数量',
  
  total_expense DECIMAL(12, 2) DEFAULT 0 COMMENT '总花费',
  total_settled DECIMAL(12, 2) DEFAULT 0 COMMENT '已结算金额',
  
  status ENUM('planning', 'ongoing', 'completed', 'archived') DEFAULT 'planning' COMMENT '状态',
  is_settled BOOLEAN DEFAULT FALSE COMMENT '是否已结算',
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME COMMENT '软删除时间',
  
  FOREIGN KEY (creator_id) REFERENCES users(id),
  KEY idx_creator_id (creator_id),
  KEY idx_status (status),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='出行表';
```

### 3. trip_members 出行成员表

```sql
CREATE TABLE trip_members (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID',
  trip_id BIGINT NOT NULL COMMENT '出行ID',
  user_id BIGINT NOT NULL COMMENT '用户ID',
  
  role ENUM('creator', 'member') DEFAULT 'member' COMMENT '角色',
  is_admin BOOLEAN DEFAULT FALSE COMMENT '是否为管理员',
  
  total_paid DECIMAL(12, 2) DEFAULT 0 COMMENT '总支付',
  total_owed DECIMAL(12, 2) DEFAULT 0 COMMENT '总应付',
  balance DECIMAL(12, 2) DEFAULT 0 COMMENT '结算余额',
  
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  left_at DATETIME COMMENT '离开时间',
  is_settled BOOLEAN DEFAULT FALSE COMMENT '是否已结算',
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (trip_id) REFERENCES trips(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_trip_user (trip_id, user_id),
  KEY idx_trip_id (trip_id),
  KEY idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='出行成员表';
```

### 4. bills 账单表

```sql
CREATE TABLE bills (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '账单ID',
  trip_id BIGINT NOT NULL COMMENT '所属出行ID',
  payer_id BIGINT NOT NULL COMMENT '支付者ID',
  
  title VARCHAR(255) NOT NULL COMMENT '账单标题',
  description TEXT COMMENT '账单描述',
  category VARCHAR(50) COMMENT '分类',
  amount DECIMAL(12, 2) NOT NULL COMMENT '总金额',
  
  receipt_image_url TEXT COMMENT '凭证图片URL',
  ocr_data JSON COMMENT 'OCR识别结果',
  
  status ENUM('draft', 'pending_review', 'approved', 'settled', 'archived') DEFAULT 'draft' COMMENT '状态',
  is_settled BOOLEAN DEFAULT FALSE COMMENT '是否已结算',
  
  bill_date DATE COMMENT '账单日期',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME COMMENT '软删除',
  
  FOREIGN KEY (trip_id) REFERENCES trips(id),
  FOREIGN KEY (payer_id) REFERENCES users(id),
  KEY idx_trip_id (trip_id),
  KEY idx_payer_id (payer_id),
  KEY idx_status (status),
  KEY idx_bill_date (bill_date),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='账单表';
```

### 5. bill_participants 账单参与人表

```sql
CREATE TABLE bill_participants (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID',
  bill_id BIGINT NOT NULL COMMENT '账单ID',
  user_id BIGINT NOT NULL COMMENT '用户ID',
  
  amount DECIMAL(12, 2) NOT NULL COMMENT '应付金额',
  split_ratio DECIMAL(5, 3) DEFAULT 0 COMMENT '分摊比例',
  split_type ENUM('equal', 'ratio', 'custom') DEFAULT 'equal' COMMENT '分摊方式',
  
  is_paid BOOLEAN DEFAULT FALSE COMMENT '是否已支付',
  paid_at DATETIME COMMENT '支付时间',
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_bill_user (bill_id, user_id),
  KEY idx_bill_id (bill_id),
  KEY idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='账单参与人表';
```

### 6. settlements 结算记录表

```sql
CREATE TABLE settlements (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '结算ID',
  trip_id BIGINT NOT NULL COMMENT '所属出行ID',
  
  total_amount DECIMAL(12, 2) NOT NULL COMMENT '结算总额',
  settlement_data JSON NOT NULL COMMENT '结算数据',
  
  status ENUM('pending', 'in_progress', 'completed', 'archived') DEFAULT 'pending' COMMENT '状态',
  settlement_method ENUM('auto', 'manual') DEFAULT 'auto' COMMENT '结算方式',
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  settled_at DATETIME COMMENT '结算完成时间',
  
  FOREIGN KEY (trip_id) REFERENCES trips(id),
  KEY idx_trip_id (trip_id),
  KEY idx_status (status),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='结算记录表';
```

### 7. transactions 交易记录表

```sql
CREATE TABLE transactions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '交易ID',
  settlement_id BIGINT COMMENT '所属结算ID',
  
  from_user_id BIGINT NOT NULL COMMENT '付款方ID',
  to_user_id BIGINT NOT NULL COMMENT '收款方ID',
  
  amount DECIMAL(12, 2) NOT NULL COMMENT '交易金额',
  description VARCHAR(255) COMMENT '交易描述',
  
  status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending' COMMENT '状态',
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at DATETIME COMMENT '完成时间',
  
  FOREIGN KEY (settlement_id) REFERENCES settlements(id),
  FOREIGN KEY (from_user_id) REFERENCES users(id),
  FOREIGN KEY (to_user_id) REFERENCES users(id),
  KEY idx_from_user_id (from_user_id),
  KEY idx_to_user_id (to_user_id),
  KEY idx_status (status),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='交易记录表';
```

### 8. audit_logs 审计日志表

```sql
CREATE TABLE audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID',
  
  user_id BIGINT COMMENT '操作用户ID',
  
  action VARCHAR(100) NOT NULL COMMENT '操作类型',
  entity_type VARCHAR(50) NOT NULL COMMENT '实体类型',
  entity_id BIGINT NOT NULL COMMENT '实体ID',
  
  old_values JSON COMMENT '旧值',
  new_values JSON COMMENT '新值',
  
  ip_address VARCHAR(50) COMMENT 'IP 地址',
  user_agent TEXT COMMENT 'User Agent',
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  KEY idx_user_id (user_id),
  KEY idx_entity (entity_type, entity_id),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审计日志表';
```

## 初始化脚本

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS travel_cost_splitter 
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE travel_cost_splitter;

-- 创建所有表 (执行上述 CREATE TABLE 语句)

-- 创建索引
CREATE INDEX idx_trip_user_status ON bills(trip_id, status);
CREATE INDEX idx_trip_date ON bills(trip_id, bill_date);
CREATE INDEX idx_user_trip_balance ON trip_members(user_id, trip_id, balance);
```

## 数据备份与恢复

```bash
# MySQL 备份
mysqldump -u root -p travel_cost_splitter > backup.sql

# MySQL 恢复
mysql -u root -p travel_cost_splitter < backup.sql
```

---

**版本**: 1.0
**最后更新**: 2026-05-26
