import { Router, Request, Response, type IRouter } from "express";

export const facebookRouter: IRouter = Router();

facebookRouter.post("/lookup", (_req: Request, res: Response) => {
  res.json({ results: [] });
});

facebookRouter.post("/dump-friends", (_req: Request, res: Response) => {
  res.json({ friends: [] });
});

facebookRouter.post("/bulk-dump-friends", (_req: Request, res: Response) => {
  res.json({ results: [] });
});
