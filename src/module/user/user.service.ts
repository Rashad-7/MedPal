import { CloudService } from './../../common/multer/cloud.service';
import { UserDocument } from 'src/DB/model/User.model';
import { UserRepositoryService } from './../../DB/repository/user.repository.service';
import { Injectable, InternalServerErrorException, NotFoundException, Req } from '@nestjs/common';
import mongoose from 'mongoose';
import { UpdateProfileDto } from './udateProfile.dto';


@Injectable()
export class UserService { 
  constructor(private readonly CloudService:CloudService,
    private readonly userRepository:UserRepositoryService<UserDocument>
    ){}  
      profile(user:UserDocument){
    return ({message:"done",data:{user}})
    
     }
async updateImage(file: Express.Multer.File, user: UserDocument) {
  if (!file) throw new Error('Profile image is required');

  try {
    const folderId = String(Math.floor(100000 + Math.random() * 900000));
    const { secure_url, public_id } = await this.CloudService.uploadFile(file, {
      folder: `${process.env.APP_NAME}/users/${user._id}/profile/${folderId}`,
    });

    user.image = { secure_url, public_id };
    await user.save();

    return { message: 'done', secure_url, public_id };
  } catch (err) {
    console.error('Error in updateImage:', err);
    throw new InternalServerErrorException(err.message);
  }
}
  async updateProfile(user: UserDocument, body: UpdateProfileDto) {
    try {
      const existingUser = await this.userRepository.findOne({ filter: { _id: new mongoose.Types.ObjectId(user._id) } });
      if (!existingUser) throw new NotFoundException('Invalid user');

      const updatedData: Partial<UserDocument> = { ...body };

      const updatedUser = await this.userRepository.updateOne({
        filter: { _id: new mongoose.Types.ObjectId(user._id) },
        data: { $set: updatedData },
      });

      return { message: 'done', user: updatedUser };
    } catch (err) {
      console.error('Error in updateProfile:', err);
      throw new InternalServerErrorException(err.message);
    }
  }
}
