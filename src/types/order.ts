import { z } from "zod";

// Order status enum
export const OrderStatus = {
  ACTIVE: "active",
  DRAFT: "draft",
} as const;

export type OrderStatusType = (typeof OrderStatus)[keyof typeof OrderStatus];

// Order data type
export interface Order {
  orderId: string;
  title: string;
  price: string;
  link: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Request validation schemas
export const CreateOrderSchema = z.object({
  title: z.string().min(1, "Title is required"),
  price: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid number with up to 2 decimal places"),
  link: z.string().url("Link must be a valid URL"),
  status: z.enum([OrderStatus.ACTIVE, OrderStatus.DRAFT], {
    errorMap: () => ({ message: "Status must be either 'active' or 'draft'" }),
  }),
});

export const UpdateOrderSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").optional(),
  price: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid number with up to 2 decimal places")
    .optional(),
  link: z.string().url("Link must be a valid URL").optional(),
  status: z
    .enum([OrderStatus.ACTIVE, OrderStatus.DRAFT], {
      errorMap: () => ({ message: "Status must be either 'active' or 'draft'" }),
    })
    .optional(),
});

// Query parameters schema for GET /api/orders
export const GetOrdersQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : 1))
    .refine((val) => val > 0, { message: "Page must be a positive number" }),
  sortBy: z.enum(["title", "price", "status", "createdAt", "updatedAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  filterBy: z.enum(["title", "price", "status", "link"]).optional(),
  filterValue: z.string().optional(),
});

// Pagination response type
export interface PaginatedOrdersResponse {
  orders: Order[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// Type inference from schemas
export type CreateOrderRequest = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderRequest = z.infer<typeof UpdateOrderSchema>;
export type GetOrdersQuery = z.infer<typeof GetOrdersQuerySchema>;
