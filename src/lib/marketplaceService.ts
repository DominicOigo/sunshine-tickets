import { request } from './api';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  event_count: number;
}

export interface FeaturedOrganizer {
  id: string;
  name: string;
  business_name: string;
  is_verified: boolean;
  event_count: number;
  avg_rating: number;
  total_tickets_sold: number;
}

export const marketplaceService = {
  async getCategories(): Promise<Category[]> {
    return request('/events/categories');
  },

  async getFeaturedOrganizers(): Promise<FeaturedOrganizer[]> {
    return request('/events/featured-organizers');
  },
};
