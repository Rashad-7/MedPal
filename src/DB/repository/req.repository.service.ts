
import { Injectable } from "@nestjs/common";
import { DataBaseRepository } from "./db.repository";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";


@Injectable()
export class ReqRepositoryService<TDocument> extends DataBaseRepository<TDocument> {
  constructor(
    @InjectModel(Request.name)
    private readonly ReqestModel: Model<TDocument>,
  ) {
    super(ReqestModel);
  }
}
