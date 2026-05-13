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
    fileSize=1024*1024*4
}:{validation?:string[],fileSize?:number}): MulterOptions => {
    let basePath=`uploads/`
    return {
        storage: diskStorage({ }),
        fileFilter: (req: Request, file: Express.Multer.File, callback: Function) => {
            
            
            
            return callback(null, true);
        },
        limits:{
                fileSize
        }
    };
    
}
