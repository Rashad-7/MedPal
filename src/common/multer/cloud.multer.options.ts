import { BadRequestException } from "@nestjs/common";
import { MulterOptions } from "@nestjs/platform-express/multer/interfaces/multer-options.interface";
import { Request } from "express";
import { diskStorage } from "multer";
export const validationFile={
    image:['image/jpeg','image/png','image/gif'],
    file:['plain/text','application/json']
}
export const cloudMulterOptions = ({
    validation=[],
    fileSize=1024*1024
}:{validation?:string[],fileSize?:number}): MulterOptions => {
    let basePath=`uploads/`
    return {
        storage: diskStorage({ }),
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
