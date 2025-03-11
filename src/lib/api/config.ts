export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_DEEPSEEK_API_URL || 'https://api.deepseek.com/v1',
  BASE_URL_V0: process.env.NEXT_PUBLIC_DEEPSEEK_API_URL_V0 || 'https://api.deepseek.com/v1',
  BASE_COZE_URL: process.env.NEXT_PUBLIC_COZE_API_URL || 'https://api.coze.cn/v1',
  MODELS: {
    'chat': 'deepseek-r1',
    'coder': 'deepseek-coder',
    'reasoner': 'deepseek-reasoner',
  },
  SINA_API_KEY: 'cffd5e931e5cb2f1b391b84194ff91eb'
} as const;

export type ModelType = keyof typeof API_CONFIG.MODELS; 