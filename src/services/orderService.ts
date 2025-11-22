import { asc, desc, eq, ilike, sql } from "drizzle-orm";
import { db } from "../config/database";
import { ErrorCode, ErrorMessages } from "../constants/errorCodes";
import { orders } from "../db/schema";
import type { Order, PaginatedOrdersResponse } from "../types/order";

// Custom error class that includes error code
class ServiceError extends Error {
  constructor(
    public readonly errorCode: ErrorCode,
    message?: string,
  ) {
    super(message || ErrorMessages[errorCode]);
    this.name = "ServiceError";
  }
}

/**
 * Get orders with pagination, sorting, and filtering
 */
export async function getOrders(
  page = 1,
  sortBy?: string,
  sortOrder: "asc" | "desc" = "desc",
  filterBy?: string,
  filterValue?: string,
): Promise<PaginatedOrdersResponse> {
  const itemsPerPage = 30;
  const offset = (page - 1) * itemsPerPage;

  // Build the query
  let query = db.select().from(orders);

  // Apply filtering if provided
  if (filterBy && filterValue) {
    switch (filterBy) {
      case "title":
        query = query.where(ilike(orders.title, `%${filterValue}%`)) as typeof query;
        break;
      case "status":
        query = query.where(eq(orders.status, filterValue)) as typeof query;
        break;
      case "link":
        query = query.where(ilike(orders.link, `%${filterValue}%`)) as typeof query;
        break;
      case "price":
        query = query.where(eq(orders.price, filterValue)) as typeof query;
        break;
    }
  }

  // Apply sorting if provided
  if (sortBy) {
    const orderFn = sortOrder === "asc" ? asc : desc;
    switch (sortBy) {
      case "title":
        query = query.orderBy(orderFn(orders.title)) as typeof query;
        break;
      case "price":
        query = query.orderBy(orderFn(orders.price)) as typeof query;
        break;
      case "status":
        query = query.orderBy(orderFn(orders.status)) as typeof query;
        break;
      case "createdAt":
        query = query.orderBy(orderFn(orders.createdAt)) as typeof query;
        break;
      case "updatedAt":
        query = query.orderBy(orderFn(orders.updatedAt)) as typeof query;
        break;
    }
  } else {
    // Default sorting by createdAt desc
    query = query.orderBy(desc(orders.createdAt)) as typeof query;
  }

  // Get total count for pagination
  const countQuery = db.select({ count: sql<number>`count(*)` }).from(orders);
  let totalItems = 0;

  // Apply the same filter to count query
  if (filterBy && filterValue) {
    let countQueryWithFilter = countQuery;
    switch (filterBy) {
      case "title":
        countQueryWithFilter = countQueryWithFilter.where(
          ilike(orders.title, `%${filterValue}%`),
        ) as typeof countQuery;
        break;
      case "status":
        countQueryWithFilter = countQueryWithFilter.where(
          eq(orders.status, filterValue),
        ) as typeof countQuery;
        break;
      case "link":
        countQueryWithFilter = countQueryWithFilter.where(
          ilike(orders.link, `%${filterValue}%`),
        ) as typeof countQuery;
        break;
      case "price":
        countQueryWithFilter = countQueryWithFilter.where(
          eq(orders.price, filterValue),
        ) as typeof countQuery;
        break;
    }
    const [countResult] = await countQueryWithFilter;
    totalItems = Number(countResult?.count) || 0;
  } else {
    const [countResult] = await countQuery;
    totalItems = Number(countResult?.count) || 0;
  }

  // Apply pagination
  const ordersResult = await query.limit(itemsPerPage).offset(offset);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return {
    orders: ordersResult,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage,
    },
  };
}

/**
 * Create a new order
 */
export async function createOrder(
  title: string,
  price: string,
  link: string,
  status: string,
): Promise<Order> {
  const [newOrder] = await db
    .insert(orders)
    .values({
      title,
      price,
      link,
      status,
    })
    .returning();

  if (!newOrder) {
    throw new ServiceError(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to create order");
  }

  return newOrder;
}

/**
 * Get order by ID
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  const [order] = await db.select().from(orders).where(eq(orders.orderId, orderId)).limit(1);

  if (!order) {
    return null;
  }

  return order;
}

/**
 * Update order data
 */
export async function updateOrder(
  orderId: string,
  updates: { title?: string; price?: string; link?: string; status?: string },
): Promise<Order> {
  const [order] = await db.select().from(orders).where(eq(orders.orderId, orderId)).limit(1);

  if (!order) {
    throw new ServiceError(ErrorCode.ORDER_NOT_FOUND);
  }

  // Prepare update data
  const updateData: {
    title?: string;
    price?: string;
    link?: string;
    status?: string;
    updatedAt: string;
  } = {
    updatedAt: new Date().toISOString(),
  };

  if (updates.title !== undefined) {
    updateData.title = updates.title;
  }
  if (updates.price !== undefined) {
    updateData.price = updates.price;
  }
  if (updates.link !== undefined) {
    updateData.link = updates.link;
  }
  if (updates.status !== undefined) {
    updateData.status = updates.status;
  }

  // Update order
  const [updatedOrder] = await db
    .update(orders)
    .set(updateData)
    .where(eq(orders.orderId, orderId))
    .returning();

  if (!updatedOrder) {
    throw new ServiceError(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to update order");
  }

  return updatedOrder;
}

/**
 * Delete order by ID
 */
export async function deleteOrder(orderId: string): Promise<void> {
  const [order] = await db.select().from(orders).where(eq(orders.orderId, orderId)).limit(1);

  if (!order) {
    throw new ServiceError(ErrorCode.ORDER_NOT_FOUND);
  }

  // Delete order
  await db.delete(orders).where(eq(orders.orderId, orderId));
}
