// libs/common/src/correlation/correlation-id.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
    namespace Express {
        interface Request {
            correlationId?: string;
        }
    }
}

// This middleware runs at the Gateway on every incoming request.
// If the request already has a correlation ID (forwarded from another system),
// we keep it. If not, we generate a fresh one.
// This is the birthplace of the ID — it only gets created once per request.
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction): void {
        const correlationId =
            (req.headers['x-correlation-id'] as string) ?? uuidv4();

        // Attach to the request so guards and controllers can read it
        req['correlationId'] = correlationId;

        // Also send it back in the response so the client can reference it
        // This is crucial — if the client reports a bug, they send you this ID
        res.setHeader('x-correlation-id', correlationId);

        next();
    }
}