import { DeleteResult, FilterQuery, Model, PopulateOptions, UpdateWriteOpResult } from "mongoose";
import mongoose from 'mongoose';
export abstract class DataBaseRepository<TDocument> {
    protected constructor(protected readonly model:Model<TDocument>) {}

  async findOne<T = TDocument>({
  filter,
  populate,
  projection,
  options,
}: {
  filter?: FilterQuery<TDocument>;
  populate?: PopulateOptions[];
  projection?: any;
  options?: { lean?: boolean };
}): Promise<T | null> {
  let query = this.model.findOne(filter || {}, projection || {});

  if (populate?.length) {
    query = query.populate(populate);
  }

  const result = options?.lean
    ? await query.lean<T>().exec()
    : await query.exec();

  return result as T | null;
}

    async create(data:Partial<TDocument>):Promise<TDocument>{
        return await this.model.create(data);
    }
    async updateOne({filter,data}:{filter:FilterQuery<TDocument>,data:any}):Promise<UpdateWriteOpResult>{
        return await this.model.updateOne(filter,data);
    }
      async find({
  filter = {},
  select = '',
  populate = [],
  skip = 0,
  limit,
}: {
  filter?: FilterQuery<any>;
  select?: string;
  populate?: PopulateOptions | PopulateOptions[];
  skip?: number;
  limit?: number;
}) {
  const query = this.model
    .find(filter)
    .select(select)
    .populate(populate)
    .skip(skip);
  if (limit) {
    query.limit(limit);
  }

  return await query;
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
async deleteOne({
  filter,
}: {
  filter: FilterQuery<TDocument>;
}): Promise<DeleteResult> {
  return await this.model.deleteOne(filter);
}
}