import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../database/db';
import type { DatabaseCategory } from '../database/models';

export const CATEGORIES_QUERY_KEY = 'categories';

// Get all categories - returns database models
export const useCategories = () => {
  return useQuery({
    queryKey: [CATEGORIES_QUERY_KEY],
    queryFn: async () => {
      const uiCategories = await db.getCategories();
      // Convert UI models back to database format
      return uiCategories.map(category => ({
        id: category.id,
        name: category.name,
        order: category.order,
        created_at: category.createdAt,
        updated_at: category.updatedAt,
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Add category - accepts database model
export const useAddCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: Omit<DatabaseCategory, 'id'>) => {
      // Convert database format to UI format for the database service
      const uiCategory = {
        name: category.name,
        order: category.order,
        createdAt: category.created_at,
        updatedAt: category.updated_at,
      };
      return db.addCategory(uiCategory);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY] });
    },
  });
};

// Update category - accepts database model
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: DatabaseCategory) => {
      // Convert database format to UI format for the database service
      const uiCategory = {
        id: category.id,
        name: category.name,
        order: category.order,
        createdAt: category.created_at,
        updatedAt: category.updated_at,
      };
      return db.updateCategory(uiCategory);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY] });
    },
  });
};

// Delete category
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) => db.deleteCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY] });
    },
  });
};

// Update category order
export const useUpdateCategoryOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, newOrder }: { categoryId: string; newOrder: number }) =>
      db.updateCategoryOrder(categoryId, newOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY] });
    },
  });
};
