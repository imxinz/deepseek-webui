import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { API_CONFIG } from '../api/config';
import { ChatSettings, FunctionDefinition } from '@/types';

interface SettingsState {
  settings: ChatSettings;
  apiKey: string;
  updateSettings: (settings: Partial<ChatSettings>) => void;
  setApiKey: (apiKey: string) => void;
  addFunction: (func: Omit<FunctionDefinition, 'id'>) => void;
  updateFunction: (id: string, func: Partial<FunctionDefinition>) => void;
  deleteFunction: (id: string) => void;
  resetFunctions: () => void;
}

const defaultFunctions: FunctionDefinition[] = [
  {
    id: 'weather',
    name: 'get_weather',
    description: '获取指定城市的天气信息，城市中文需要转换成拼音',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: '城市名称、邮编或坐标，例如：北京、Shanghai、London、Paris',
        },
        aqi: {
          type: 'string',
          description: '是否包含空气质量数据',
          enum: ['yes', 'no'],
        },
        lang: {
          type: 'string',
          description: '返回数据的语言',
          enum: ['zh', 'en'],
        }
      },
      required: ['location'],
    },
    url: 'https://api.weatherapi.com/v1/current.json?q={location}&units={unit}',
    method: 'GET',
    headers: {
      "key": "Yours API Key"
    },
  },
  {
    id: 'search',
    name: 'search_web',
    description: '搜索网页内容',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '搜索关键词',
        },
        limit: {
          type: 'number',
          description: '返回结果数量',
        },
      },
      required: ['query'],
    },
    url: 'https://serpapi.com/search.json',
    method: 'GET',
    headers: {
      'api_key': '{SERP_API_KEY}',
    },
  },
  {
    id: 'translate',
    name: 'translate_text',
    description: '翻译文本内容',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: '要翻译的文本',
        },
        source_lang: {
          type: 'string',
          description: '源语言',
          enum: ['auto', 'en', 'zh', 'ja', 'ko', 'fr', 'de'],
        },
        target_lang: {
          type: 'string',
          description: '目标语言',
          enum: ['en', 'zh', 'ja', 'ko', 'fr', 'de'],
        },
      },
      required: ['text', 'target_lang'],
    },
    url: 'https://api.deepl.com/v2/translate',
    method: 'POST',
    headers: {
      'Authorization': 'DeepL-Auth-Key {DEEPL_API_KEY}',
    },
  },
  {
    id: 'image_generation',
    name: 'generate_image',
    description: '根据文本描述生成图片',
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: '图片描述文本',
        },
        size: {
          type: 'string',
          description: '图片尺寸',
          enum: ['256x256', '512x512', '1024x1024'],
        },
        style: {
          type: 'string',
          description: '图片风格',
          enum: ['realistic', 'artistic', 'anime'],
        },
      },
      required: ['prompt'],
    },
    url: 'https://api.stability.ai/v1/generation',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer {STABILITY_API_KEY}',
      'Content-Type': 'application/json',
    },
  },
];

const defaultSettings: ChatSettings = {
  temperature: 0.7,
  topP: 0.9,
  topK: 50,
  maxLength: 2000,
  systemPrompt: '',
  model: 'chat',
  functions: defaultFunctions,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      apiKey: API_CONFIG.DEEPSEEK_API_KEY,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      setApiKey: (apiKey) => set({ apiKey }),
      addFunction: (func) =>
        set((state) => ({
          settings: {
            ...state.settings,
            functions: [
              ...(state.settings.functions || []),
              { ...func, id: `func_${Date.now()}` },
            ],
          },
        })),
      updateFunction: (id, func) =>
        set((state) => ({
          settings: {
            ...state.settings,
            functions: (state.settings.functions || []).map((f) =>
              f.id === id ? { ...f, ...func } : f
            ),
          },
        })),
      deleteFunction: (id) =>
        set((state) => ({
          settings: {
            ...state.settings,
            functions: (state.settings.functions || []).filter((f) => f.id !== id),
          },
        })),
      resetFunctions: () =>
        set((state) => ({
          settings: {
            ...state.settings,
            functions: defaultFunctions,
          },
        })),
    }),
    {
      name: 'settings-store',
      partialize: (state) => ({ settings: state.settings, apiKey: state.apiKey }),
      onRehydrateStorage: () => (state) => {
        if (!state?.settings.functions?.length) {
          state?.resetFunctions();
        }
      },
    }
  )
); 