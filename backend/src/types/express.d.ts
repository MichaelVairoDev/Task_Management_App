import { Request, Response, NextFunction } from 'express';
import { User } from '../entities/User';
import {
  Router as ExpressRouter,
} from "express";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      app?: any;
    }
  }
}

declare global {
  namespace Express {
    export type Response = Response;
    export type NextFunction = NextFunction;
    export type Router = ExpressRouter;
  }
}

export {};

export interface AuthenticatedRequest extends Request {
  user: User;
}

export interface AuthRequest extends Request {
  user: User;
  app?: any;
  body: any;
  query: any;
  params: any;
}

export type TypedRequestHandler<T = any> = (
  req: AuthRequest,
  res: Response,
  next?: NextFunction
) => Promise<T> | T;

export type TypedResponse<T> = Response<T>;
