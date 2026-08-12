import { AppError } from "@/lib/contracts/errors";

export function assertSameOrigin(request: Request, allowedOrigin: string): void {
  const origin = request.headers.get("origin");
  if (!origin || origin !== allowedOrigin) {
    throw new AppError("FORBIDDEN", "The request origin is not allowed.", 403);
  }
}
