import axios, { AxiosRequestConfig } from 'axios';
import { CoreTasksAPI } from '@/lib/api';
import { config } from '@/lib/config';
import { useAuthStore } from '@/lib/store';

const baseUrl = config.api.baseUrl;

export const coreTasksApi = new CoreTasksAPI({
  BASE: baseUrl,
  WITH_CREDENTIALS: false,
  CREDENTIALS: 'include',
  TOKEN: async () => useAuthStore.getState().accessToken ?? '',
});

type RetriableRequestConfig = AxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string> | null = null;

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config: requestConfig } = error;
    const originalRequest = requestConfig as RetriableRequestConfig;

    if (!response || response.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    if (!refreshPromise) {
      refreshPromise = coreTasksApi.auth
        .authControllerRefresh({
          requestBody: { refreshToken },
        })
        .then(({ accessToken, refreshToken: newRefreshToken }) => {
          useAuthStore
            .getState()
            .setTokens({ accessToken, refreshToken: newRefreshToken });
          return accessToken;
        })
        .catch((refreshError) => {
          useAuthStore.getState().logout();
          throw refreshError;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    try {
      const newAccessToken = await refreshPromise;
      originalRequest.headers = {
        ...(originalRequest.headers ?? {}),
        Authorization: `Bearer ${newAccessToken}`,
      };
      return axios(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);
