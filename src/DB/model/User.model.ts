
import { generateHush } from '../../common/security/hush.security';
import { MongooseModule, Prop, raw, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import type { IAttachment } from 'src/common/multer/cloud.service';

export enum GenderType {
  MALE = "male",
  FEMALE = "female" 
}
export enum RoleType {
  USER = "Patiant", 
  ADMIN = "Doctor"
}
@Schema({timestamps:true,toObject:{versionKey:true},toJSON:{versionKey:true}})
export class User {
fullName:string
  @Prop({ required: true ,unique:true,type:String})
  email: string;

  @Prop({ required: true ,type:String})
  password: string;

  @Prop({ minLength:2,maxLength:30,trim:true,type:String })
    firstName: string;
        @Prop({ minLength:2,maxLength:30,trim:true,type:String })
    lastName: string;
    @Prop({type:String})
    address: string
    @Prop({type:Date})
    DOB: Date
    @Prop({type:String})
    phone: string
    @Prop({ type: String,enum:GenderType,default:GenderType.MALE })
    gender: GenderType
    @Prop({ type: String,enum:RoleType,default:RoleType.USER })
    role: RoleType
    @Prop({ type: Date })
    confirmEmail: Date
    @Prop({ type: Date })
    changeCredentialTime: Date
  @Prop(raw({
    secure_url: { type: String, required: true },
    public_id: { type: String, required: true },
  }))
  image?: IAttachment; 
    confirmEmailOTP: string
    }
    export type UserDocument =HydratedDocument <User>
  export const UserSchema = SchemaFactory.createForClass(User);
  UserSchema.virtual('fullName')
  .get(function (this: User) {
    return `${this.firstName} ${this.lastName}`;
  })
  .set(function (this: User, name: string) {
    const [firstName, lastName] = name.split(' ');
    this.firstName = firstName;
    this.lastName = lastName;
  });
//   UserSchema.pre('save', function (next) {
//   if (this.isModified('password')) {
//     this.password = generateHush(this.password);
//   }
//   if (this.isModified('confirmEmailOTP')) {
//     this.confirmEmailOTP = generateHush(this.confirmEmailOTP);
//   }
//   next();
// });

  // export const UserModel = MongooseModule.forFeature([{name:User.name,schema:UserSchema}])

  
 export const UserModel = MongooseModule.forFeatureAsync([{name:User.name,useFactory(){
    UserSchema.pre('save', function (next) {
  if (this.isModified('password')) {
    this.password = generateHush(this.password);
  }
  if (this.isModified('confirmEmailOTP')) {
    this.confirmEmailOTP = generateHush(this.confirmEmailOTP);
  }
  next();
});
    return UserSchema;
  }}])
