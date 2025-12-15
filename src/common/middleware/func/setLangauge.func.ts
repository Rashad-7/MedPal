import { NextFunction,Response,Request } from "express";

export const setDefaulteLangauge=(req:Request,res:Response,next:NextFunction)=>{
req.headers["accept-language"]=req.headers["accept-language"]?req.headers["accept-language"]:'en';
return next()
}