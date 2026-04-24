import { generateHush } from '../../common/security/hush.security';
import {
  MongooseModule,
  Prop,
  raw,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { IAttachment } from 'src/common/multer/cloud.service';

export enum GenderType {
  MALE = 'male',
  FEMALE = 'female',
}
export enum RoleType {
  USER = 'Patiant',
  ADMIN = 'Doctor',
}
@Schema({
  timestamps: true,
  toObject: { versionKey: true },
  toJSON: { versionKey: true },
})
export class User {
  @Prop({ minLength: 2, maxLength: 30, trim: true, type: String })
  fullName: string;
  @Prop({ required: true, unique: true, type: String })
  email: string;

  @Prop({ required: true, type: String })
  password: string;

  @Prop({ type: String })
  address: string;
  @Prop({ type: Date })
  DOB: Date;
  @Prop({ type: String })
  phone: string;
  @Prop({ type: String, enum: GenderType, default: GenderType.MALE })
  gender: GenderType;
  @Prop({ type: String, enum: RoleType })
  role: RoleType;
  @Prop({ type: Boolean, required: true,default:false })
  isVerified?: boolean
    @Prop({ type: Date })
  confirmEmail: Date;
  @Prop({ type: Date })
  changeCredentialTime: Date;
  @Prop(
    raw({
      secure_url: { type: String, required: false },
      public_id: { type: String, required: false },
    }),
  )
  image?: IAttachment;
  @Prop({ type: String })
  confirmEmailOTP: string;
  @Prop({ type: String })
  forgetPasswordOtp: string;
  @Prop({ type: String })
fcmToken?: string;
}
export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

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

export const UserModel = MongooseModule.forFeatureAsync([
  {
    name: User.name,
    useFactory() {
      UserSchema.pre('save', function (next) {
        if (this.isModified('password')) {
          this.password = generateHush(this.password);
        }
        if (this.isModified('confirmEmailOTP')) {
          this.confirmEmailOTP = generateHush(this.confirmEmailOTP);
        }
        if (this.isModified('forgetPasswordOtp')) {
          this.forgetPasswordOtp = generateHush(this.forgetPasswordOtp);
        }
        next();
      });
      return UserSchema;
    },
  },
]);
