import { Client, Account, TablesDB, Storage, Functions, Teams } from 'appwrite';
import { APPWRITE_CONFIG } from './config';

export const client = new Client()
  .setEndpoint(APPWRITE_CONFIG.endpoint)
  .setProject(APPWRITE_CONFIG.projectId);

export const account = new Account(client);
export const tablesDB = new TablesDB(client);
export const storage = new Storage(client);
export const functions = new Functions(client);
export const teams = new Teams(client);
