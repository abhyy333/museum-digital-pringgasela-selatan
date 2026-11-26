const env = import.meta.env;

export const APPWRITE_CONFIG = {
  endpoint: env.VITE_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1',
  projectId: env.VITE_APPWRITE_PROJECT_ID || '6affdaa0003c416ecdb0',
  databaseId: env.VITE_APPWRITE_DATABASE_ID || 'museum_digital',
  storageBucketId: env.VITE_APPWRITE_STORAGE_BUCKET_ID || 'museum-media',
  adminTeamId: env.VITE_APPWRITE_ADMIN_TEAM_ID || 'museum-admins',
  publicApiFunctionId: env.VITE_APPWRITE_PUBLIC_API_FUNCTION_ID || 'museum-public-api',
  adminMediaFunctionId: env.VITE_APPWRITE_ADMIN_MEDIA_FUNCTION_ID || 'museum-admin-media',
  adminMediaGatewayUrl:
    env.VITE_APPWRITE_ADMIN_MEDIA_GATEWAY_URL ||
    'https://museum-admin-media-pringgasela.appwrite.network',
};
