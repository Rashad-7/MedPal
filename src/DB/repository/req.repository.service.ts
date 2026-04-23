
import { Injectable } from "@nestjs/common";
import { DataBaseRepository } from "./db.repository";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { Request } from "../model/Req.model";

@Injectable()
export class ReqRepositoryService<TDocument> extends DataBaseRepository<TDocument> {
  constructor(
    @InjectModel(Request.name)
    private readonly RequestModel: Model<TDocument>,
  ) {
    super(RequestModel);
  }
}
