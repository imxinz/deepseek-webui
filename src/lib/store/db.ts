import { DataSource } from 'typeorm';
import { StockTrade } from '@/entities/trade';

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'xinz1234',
    database: process.env.DB_NAME || 'jucai_app',
    ssl: null //process.env.DB_SSL ? { rejectUnauthorized: false } : null
};

// console.log(dbConfig, path.join(__dirname, 'entities', '*.{js,ts}'));

export const dataSource = new DataSource({
    type: 'mysql',
    ...dbConfig,
    entities: [StockTrade], // 注册使用的实体
    synchronize: process.env.NODE_ENV !== 'production', // 生产环境禁用
    logging: process.env.NODE_ENV === 'development',
    extra: {
        connectionLimit: 10, // 连接池配置
        connectTimeout: 10000 // 10秒超时
    },
    migrations: [], // 如果有迁移需要配置
    subscribers: []
});