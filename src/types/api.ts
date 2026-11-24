import { Category, Contributor, Craft, Culture, VillageHistory, WeavingMotif } from './schema';

export interface PaginatedResponse<T> {
  total: number;
  limit: number;
  offset: number;
  items: T[];
}

export interface CraftsResponse extends PaginatedResponse<Craft> {}

export interface CraftDetailResponse {
  craft: Craft;
}

export interface MotifsResponse extends PaginatedResponse<WeavingMotif> {}

export interface MotifDetailResponse {
  motif: WeavingMotif;
}

export interface CulturesResponse extends PaginatedResponse<Culture> {}

export interface CultureDetailResponse {
  culture: Culture;
}

export interface HistoryResponse {
  total: number;
  eras: VillageHistory[];
}

export interface CategoriesResponse {
  total: number;
  categories: Category[];
}

export interface ContributorsResponse {
  total: number;
  contributors: Contributor[];
}

export interface SettingsResponse {
  settings: Record<string, string>;
}
