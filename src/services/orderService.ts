import { eq } from "drizzle-orm";
import { db } from "../config/database";
import { ErrorCode, ErrorMessages } from "../constants/errorCodes";
import { orders } from "../db/schema";
import type { Order } from "../types/order";

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
