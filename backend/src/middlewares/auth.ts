import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('ERROR: JWT_SECRET environment variable is required');
  process.exit(1);
}

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    agencyId: string;
    role: string;
  };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      userId: payload.userId,
      agencyId: payload.agencyId,
      role: payload.role
    };

    // Enforce influencer boundary: they can only access creator portal, logout, and profile
    if (payload.role === 'INFLUENCER') {
      const allowedPaths = [
        '/api/influencer-portal',
        '/api/auth/logout',
        '/api/user'
      ];
      const isAllowed = allowedPaths.some(p => req.originalUrl.startsWith(p));
      if (!isAllowed) {
        return res.status(403).json({ error: 'Access denied: Creator account is restricted from agency administration resources.' });
      }
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};
