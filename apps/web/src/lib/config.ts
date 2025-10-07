/**
 * Configurações da aplicação centralizadas
 * Todas as variáveis de ambiente são acessadas através deste módulo
 */

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = import.meta.env[key];
  if (value === undefined || value === '') return defaultValue;
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

const getEnvString = (key: string, defaultValue: string): string => {
  const value = import.meta.env[key];
  return value !== undefined && value !== '' ? value : defaultValue;
};

export const config = {
  app: {
    name: getEnvString('VITE_APP_NAME', 'TaskManager'),
    description: getEnvString('VITE_APP_DESCRIPTION', 'Gerenciador de Tarefas Colaborativo'),
  },
  
  api: {
    delay: {
      min: getEnvNumber('VITE_API_DELAY_MIN', 200),
      max: getEnvNumber('VITE_API_DELAY_MAX', 400),
      getUsers: getEnvNumber('VITE_API_DELAY_GET_USERS', 200),
      listTasks: getEnvNumber('VITE_API_DELAY_LIST_TASKS', 300),
      getTask: getEnvNumber('VITE_API_DELAY_GET_TASK', 250),
      createTask: getEnvNumber('VITE_API_DELAY_CREATE_TASK', 400),
      updateTask: getEnvNumber('VITE_API_DELAY_UPDATE_TASK', 350),
      deleteTask: getEnvNumber('VITE_API_DELAY_DELETE_TASK', 300),
      getComments: getEnvNumber('VITE_API_DELAY_GET_COMMENTS', 250),
      addComment: getEnvNumber('VITE_API_DELAY_ADD_COMMENT', 300),
    },
  },
  
  websocket: {
    interval: getEnvNumber('VITE_WEBSOCKET_INTERVAL', 30000),
    notificationProbability: getEnvNumber('VITE_WEBSOCKET_NOTIFICATION_PROBABILITY', 0.7),
  },
  
  auth: {
    simulationDelay: getEnvNumber('VITE_AUTH_SIMULATION_DELAY', 1000),
  },
} as const;

// Type-safe config access
export type Config = typeof config;

