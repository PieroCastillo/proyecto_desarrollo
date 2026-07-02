import { Hono } from "hono";
import { db } from "../db";

const dashboard = new Hono();

const ordersCollection = db.collection("orders");
const productsCollection = db.collection("products");
const consultantsCollection = db.collection("consultants");
const clientsCollection = db.collection("clients");

dashboard.get("/dashboard", async (c) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalSalesAgg, monthlySalesAgg, salesByStatus, productsByCategory, stockAgg, topConsultantsAgg] = await Promise.all([
      ordersCollection.aggregate([{ $group: { _id: null, totalSales: { $sum: "$total" }, totalOrders: { $sum: 1 } } }]).toArray(),
      ordersCollection.aggregate([
        { $match: { createdAt: { $gte: monthStart } } },
        { $group: { _id: null, totalSales: { $sum: "$total" }, totalOrders: { $sum: 1 } } },
      ]).toArray(),
      ordersCollection.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$total" } } },
        { $sort: { count: -1 } },
      ]).toArray(),
      productsCollection.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 }, stock: { $sum: "$stock" } } },
        { $sort: { count: -1 } },
      ]).toArray(),
      productsCollection.aggregate([
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            totalStock: { $sum: "$stock" },
            averagePrice: { $avg: "$price" },
            outOfStock: { $sum: { $cond: [{ $lte: ["$stock", 0] }, 1, 0] } },
            lowStock: { $sum: { $cond: [{ $and: [{ $gt: ["$stock", 0] }, { $lte: ["$stock", 5] }] }, 1, 0] } },
          },
        },
      ]).toArray(),
      ordersCollection.aggregate([
        { $group: { _id: "$consultantId", totalSales: { $sum: "$total" }, orders: { $sum: 1 } } },
        { $sort: { totalSales: -1 } },
        { $limit: 5 },
      ]).toArray(),
    ]);

    const [pendingOrders, clientsCount, consultantsCount, recentOrders] = await Promise.all([
      ordersCollection.countDocuments({ status: "pending" }),
      clientsCollection.countDocuments(),
      consultantsCollection.countDocuments({ deletedAt: null }),
      ordersCollection.find().sort({ createdAt: -1 }).limit(5).toArray(),
    ]);

    const topConsultants = [];
    for (const tc of topConsultantsAgg) {
      if (tc._id) {
        const consultant = await consultantsCollection.findOne({ _id: tc._id });
        if (consultant) {
          topConsultants.push({
            id: consultant._id,
            name: consultant.name,
            totalSales: tc.totalSales,
            orders: tc.orders,
          });
        }
      }
    }

    const totalSales = totalSalesAgg[0]?.totalSales ?? 0;
    const totalOrders = totalSalesAgg[0]?.totalOrders ?? 0;
    const monthlySales = monthlySalesAgg[0]?.totalSales ?? 0;
    const monthlyOrders = monthlySalesAgg[0]?.totalOrders ?? 0;
    const stockSummary = stockAgg[0] ?? {
      totalProducts: 0,
      totalStock: 0,
      averagePrice: 0,
      outOfStock: 0,
      lowStock: 0,
    };

    return c.json({
      generatedAt: now.toISOString(),
      monthlySales,
      monthlyOrders,
      totalSales,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
      pendingOrders,
      lowStockProducts: stockSummary.lowStock,
      outOfStockProducts: stockSummary.outOfStock,
      totalProducts: stockSummary.totalProducts,
      totalStock: stockSummary.totalStock,
      averagePrice: stockSummary.averagePrice ?? 0,
      clientsCount,
      consultantsCount,
      salesByStatus: salesByStatus.map((item) => ({
        status: item._id ?? "unknown",
        count: item.count,
        total: item.total,
      })),
      productsByCategory: productsByCategory.map((item) => ({
        category: item._id ?? "Sin categoria",
        count: item.count,
        stock: item.stock,
      })),
      topConsultants,
      recentOrders: recentOrders.map((order: any) => ({
        id: order._id,
        total: order.total ?? 0,
        status: order.status ?? "unknown",
        createdAt: order.createdAt,
        items: order.items?.length ?? 0,
      })),
    });
  } catch {
    return c.json(
      {
        ok: false,
        error: {
          code: "BAD_REQUEST",
          message: "bad request",
        },
      },
      400
    );
  }
});

export default dashboard;
