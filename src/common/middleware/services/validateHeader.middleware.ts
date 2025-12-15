import { Injectable, NestMiddleware } from "@nestjs/common";
import type { Request,Response } from "express";
@Injectable()
export class ValidateHeaderMeddelware implements NestMiddleware{
    use(req: Request, res: Response, next: (error?: any) => void) {
        if (req.headers.authorization?.split(' ').length!=2) {
            return res.status(400).json({message:
                'in-vaild Authorization header'
            })
        }
        // console.log('hi middelware');
        return next()
        
    }
}