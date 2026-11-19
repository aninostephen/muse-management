export interface AppConfig {
  port: number;
  frontendUrl: string;
  cacheTtlMs: number;
  auth: {
    jwtSecret: string;
    jwtExpiresInSeconds: number;
    adminEmail: string;
    adminPassword: string;
    adminName: string;
  };
  infloww: {
    apiUrl: string;
    apiKey: string;
    agencyOid: string;
    timeoutMs: number;
  };
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT || '3000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  cacheTtlMs: parseInt(process.env.CACHE_TTL_MS || '300000', 10),
  auth: {
    jwtSecret:
      process.env.JWT_SECRET ||
      'muse-agency-management-jwt-secret-key-2026-hs256',
    jwtExpiresInSeconds: parseInt(
      process.env.JWT_EXPIRES_IN_SECONDS || '86400',
      10,
    ),
    adminEmail: process.env.ADMIN_EMAIL || 'admin@musemanagement.com',
    adminPassword: process.env.ADMIN_PASSWORD || 'Admin@123',
    adminName: process.env.ADMIN_NAME || 'Agency Administrator',
  },
  infloww: {
    apiUrl: (
      process.env.INFLOWW_API_URL || 'https://openapi.infloww.com/v1'
    ).replace(/\/$/, ''),
    apiKey: (process.env.INFLOWW_API_KEY || '').trim(),
    agencyOid: (process.env.INFLOWW_AGENCY_OID || '').trim(),
    timeoutMs: parseInt(process.env.INFLOWW_TIMEOUT_MS || '15000', 10),
  },
});
