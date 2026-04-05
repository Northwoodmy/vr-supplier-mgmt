import { createTRPCRouter } from '../trpc/trpc';
import { authRouter } from './routers/auth';
import { userRouter } from './routers/user';
import { auditLogRouter } from './routers/audit';
import { supplierRouter } from './routers/supplier';
import { projectRouter } from './routers/project';
import { evaluationRouter } from './routers/evaluation';
import { capacityRouter } from './routers/capacity';

export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  auditLog: auditLogRouter,
  supplier: supplierRouter,
  project: projectRouter,
  evaluation: evaluationRouter,
  capacity: capacityRouter,
});

export type AppRouter = typeof appRouter;
