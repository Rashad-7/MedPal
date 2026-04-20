import { FilterQuery, Model, PopulateOptions, UpdateWriteOpResult } from "mongoose";
import mongoose from 'mongoose';
export abstract class DataBaseRepository<TDocument> {
    protected constructor(protected readonly model:Model<TDocument>) {}

    async findOne({
        filter,
        populate
    }:{
        filter?:FilterQuery<TDocument>
        populate?:PopulateOptions[]
    }):Promise<TDocument | null>{
        return await this.model.findOne(filter||{}).populate(populate ??[] );
    }

    async create(data:Partial<TDocument>):Promise<TDocument>{
        return await this.model.create(data);
    }
    async updateOne({filter,data}:{filter:FilterQuery<TDocument>,data:any}):Promise<UpdateWriteOpResult>{
        return await this.model.updateOne(filter,data);
    }
        async find({
  filter = {},
  select = "",
  populate = [],
  skip = 0,
  limit= 10,
}: {
  filter?: FilterQuery<any>;
  select?: string;
  populate?: PopulateOptions | PopulateOptions[];
  skip?: number;
  limit?: number;
}) {
  return await this.model
    .find(filter)
    .select(select)
    .populate(populate)
    .skip(skip)
    .limit(limit);
}
async findById({
  id ,
  select = "",
  populate = [],
}: {
  id?:mongoose.Types.ObjectId ;
  select?: string;
  populate?: PopulateOptions | PopulateOptions[];
}) {
  const document = await this.model
    .findById(id)
    .select(select)
    .populate(populate);

  return document;
}
// const deleteOne = async ({ model, filter = {} } = {}) => {
//     const document = await model.deleteOne(filter);
//     return document;
// }
}