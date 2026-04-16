import { Injectable } from '@nestjs/common';
import { DoctorDocument } from 'src/DB/model/doctor.model';
import { UserDocument } from 'src/DB/model/User.model';
import { DoctorRepositoryService } from 'src/DB/repository/doctor.repository.service';
import { UserRepositoryService } from 'src/DB/repository/user.repository.service';

@Injectable()
export class DoctorService {
constructor(
        private readonly userRepository:UserRepositoryService<UserDocument>,
         private readonly doctorRepository:DoctorRepositoryService<DoctorDocument>
){   
}
      async profile(user:UserDocument){
       const doctor=await this.doctorRepository.findOne({filter:{userId:user._id}})
        return ({message:"done",data:{user,doctor}})
       }
}
