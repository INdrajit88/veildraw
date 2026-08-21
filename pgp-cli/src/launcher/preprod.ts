import axios, { AxiosResponse } from 'axios';
import { createLogger } from '../logger-utils.js';
import { run } from '../index.js';
import { PreprodRemoteConfig } from '../config.js';

// Patch axios.get to override testkit-js 1000ms health check timeout
const originalGet = axios.get;
axios.get = function <T = any, R = AxiosResponse<T>, D = any>(url: string, config?: any): Promise<R> {
  const newConfig = { ...config, timeout: 30000 };
  return originalGet.call(this, url, newConfig) as Promise<R>;
};

if (axios.Axios && axios.Axios.prototype) {
  const originalProtoGet = axios.Axios.prototype.get;
  axios.Axios.prototype.get = function <T = any, R = AxiosResponse<T>, D = any>(url: string, config?: any): Promise<R> {
    const newConfig = { ...config, timeout: 30000 };
    return originalProtoGet.call(this, url, newConfig) as Promise<R>;
  };
}

const config = new PreprodRemoteConfig();
const logger = await createLogger(config.logDir);
const testEnvironment = config.getEnvironment(logger);
await run(config, testEnvironment, logger);
