import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'bookloop-neon-secret-jwt-key-2026';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
  };
}

/**
 * Verifies the Bearer JWT token and ALWAYS resolves the user's current role
 * from the trusted PostgreSQL database by user ID.
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Authentication token required' });
    }

    let decoded: { id?: string; email?: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id?: string; email?: string };
    } catch {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }

    if (!decoded?.id) {
      return res.status(401).json({ error: 'Unauthorized: Malformed token payload' });
    }

    // Always load the authoritative user & role from the database by unique ID
    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, name: true },
    });

    if (!dbUser) {
      return res.status(401).json({ error: 'Unauthorized: User account no longer exists' });
    }

    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      name: dbUser.name,
    };

    next();
  } catch (err) {
    return res.status(500).json({ error: 'Authentication verification error' });
  }
};

/**
 * Enforces role-based authorization on protected endpoints using the
 * database-verified role attached by authenticateToken.
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Access restricted to ${allowedRoles.join(' or ')} role.`,
      });
    }

    next();
  };
};
