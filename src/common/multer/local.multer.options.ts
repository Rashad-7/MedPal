import { BadRequestException } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { MulterOptions } from "@nestjs/platform-express/multer/interfaces/multer-options.interface";
import { Request } from "express";
import { existsSync, mkdirSync } from "fs";
import { diskStorage } from "multer";
import { resolve } from "path";
export const validationFile={
    image:['image/jpeg','image/png','image/gif'],
    file:['plain/text','application/json']
}
export const localMulterOptions = ({
    path='public',
    validation=[],
    fileSize=1024*1024
}:{path:string,validation?:string[],fileSize?:number}): MulterOptions => {
    let basePath=`uploads/${path}`
    return {
        storage: diskStorage({
            destination: (
                req: Request,
                file: Express.Multer.File,
                callback: Function,
            ) => {
        let fullpath=resolve(`./${basePath}/${req['user']._id}`)
        if (!existsSync(fullpath)) {
            mkdirSync(fullpath)
        }
                 callback(null, fullpath);
            },

            filename(req: Request, file: Express.Multer.File, callback: Function) {
               const orgiinalPath=Date.now() + '_' + file.originalname
              file["finalPath"]=`${basePath}/${req['user']._id}/${orgiinalPath}`
                callback(null, orgiinalPath);
            },
        }),
        fileFilter: (req: Request, file: Express.Multer.File, callback: Function) => {
            if (!['image/jpeg'].includes(file.mimetype)) {
                return callback(new BadRequestException("in-valid format"), false);
            }
            return callback(null, true);
        },
        limits:{
                fileSize
        }
    };
    
}
