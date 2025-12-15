    import { ConflictException, Injectable } from "@nestjs/common";
import { DataBaseRepository } from "./db.repository";
import  { User } from "../model/User.model";
import { FilterQuery, Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";

@Injectable()
export class UserRepositoryService<TDocument> extends DataBaseRepository<TDocument>{
    constructor(@InjectModel (User.name) private readonly userModel:Model<TDocument>){
        super(userModel);
    }
async checkDuplicateEmail(data: FilterQuery<TDocument>) {
  const existingUser = await this.findOne({ filter: data });
  if (existingUser) {
    throw new ConflictException('Email already in use');
  }
}
}