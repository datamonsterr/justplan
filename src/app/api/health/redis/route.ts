import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

/**
 * Redis Health Check API
 * 
 * GET /api/health/redis
 * 
 * Returns the health status of the Upstash Redis REST connection.
 * Useful for monitoring and debugging.
 * 
 * @returns {Object} { status: 'healthy' | 'unhealthy', timestamp: string }
 */
export async function GET() {
  try {
    const result = await redis.ping();
    const isHealthy = result === "PONG";
    const timestamp = new Date().toISOString();

    if (!isHealthy) {
      return NextResponse.json(
        {
          status: "unhealthy",
          message: "Redis ping failed",
          timestamp,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "healthy",
      message: "Redis connection successful",
      timestamp,
    });
  } catch (error) {
    console.error("Redis health check error:", error);

    return NextResponse.json(
      {
        status: "unhealthy",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
