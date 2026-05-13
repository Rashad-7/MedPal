
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserRepositoryService } from 'src/DB/repository/user.repository.service';
import { DoctorRepositoryService } from 'src/DB/repository/doctor.repository.service';
import { PatientRepositoryService } from 'src/DB/repository/patient.repository.service';
import { UserDocument, RoleType } from 'src/DB/model/User.model';
import { DoctorDocument } from 'src/DB/model/doctor.model';
import { PatientDocument } from 'src/DB/model/patient.model';
import { TokenService, TokenType } from 'src/common/service/token.service';
import { compareHush } from 'src/common/security/hush.security';
import { SOSRepositoryService } from 'src/DB/repository/sos.repository.service';
import { SOSDocument } from 'src/DB/model/SOS.model';
import mongoose, { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { RequestDocument } from 'src/DB/model/Req.model';
import { MedicationLog, MedicationLogDocument } from 'src/DB/model/MedicationLog.model';

@Injectable()
export class SuperAdminService {
  constructor(
    private readonly userRepository: UserRepositoryService<UserDocument>,
    private readonly doctorRepository: DoctorRepositoryService<DoctorDocument>,
    private readonly patientRepository: PatientRepositoryService<PatientDocument>,
    private readonly tokenService: TokenService,
    private readonly SOSRepository:SOSRepositoryService<SOSDocument>,
    
@InjectModel(Request.name)
  private readonly reqModel: Model<RequestDocument>,

  @InjectModel(MedicationLog.name)
  private readonly logModel: Model<MedicationLogDocument>,
  ) {}

  
  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({
      filter: { email, role: RoleType.SUPER_ADMIN },
    });

    if (!user) throw new NotFoundException('Super admin not found');
    if (!compareHush(password, user.password))
      throw new BadRequestException('Invalid credentials');

    const accessToken = this.tokenService.sign({
      payload: { id: user._id },
      role: RoleType.SUPER_ADMIN,
    });

    const refreshToken = this.tokenService.sign({
      payload: { id: user._id },
      role: RoleType.SUPER_ADMIN,
      type: TokenType.REFRESH,
    });

    return { message: 'done', token: { accessToken, refreshToken } };
  }

  
  async getDashboard() {
    const [totalUsers, totalDoctors, totalPatients, pendingDoctors,SOS] =
      await Promise.all([
        this.userRepository['userModel'].countDocuments(),
        this.doctorRepository['DoctorModel'].countDocuments(),
        this.patientRepository['patientModel'].countDocuments(),
        this.doctorRepository['DoctorModel'].countDocuments({ isVerified: false }),
        this.SOSRepository['sosModel'].countDocuments(),
      ]);

    return {
      message: 'done',
      data: { totalUsers, totalDoctors, totalPatients, pendingDoctors,SOS },
    };
  }

  
  async getDoctors(isVerified?: string) {
    const filter: any = {};
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';

    const doctors = await this.doctorRepository.find({
      filter,
      populate: [{ path: 'userId', select: 'fullName email phone createdAt' }],
      limit: 100,
    });

    return { message: 'done', total: doctors.length, data: doctors };
  }

  
async verifyDoctor(userId: mongoose.Types.ObjectId) {

  const user = await this.userRepository.findOne({
    filter: { _id: userId, role: RoleType.ADMIN },
  });

  if (!user) {
    throw new NotFoundException('Doctor not found');
  }

  const doctor = await this.doctorRepository.findOne({
    filter: { userId: user._id },
  });

  if (!doctor) {
    throw new NotFoundException('Doctor profile not found');
  }

  
  if (doctor.isVerified || user.isVerified) {
    throw new BadRequestException('Doctor already verified');
  }

  
  await this.userRepository.updateOne({
    filter: { _id: userId },
    data: { isVerified: true },
  });

  
  await this.doctorRepository.updateOne({
    filter: { userId: user._id },
    data: { isVerified: true },
  });

  return { message: 'Doctor verified successfully' };
}

  
  async rejectDoctor(userId: mongoose.Types.ObjectId) {
    const user = await this.userRepository.findOne({
      filter: { _id: userId, role: RoleType.ADMIN },
    });
    if (!user) throw new NotFoundException('Doctor not found');

    
    await this.doctorRepository.deleteOne({ filter: { userId: user._id } });
    await this.userRepository.deleteOne({ filter: { _id: user._id } });

    return { message: 'Doctor rejected and removed' };
  }

  
  async getPatients() {
    const patients = await this.patientRepository.find({
      filter: {},
      populate: [{ path: 'userId', select: 'fullName email phone createdAt' }],
      limit: 100,
    });

    return { message: 'done', total: patients.length, data: patients };
  }

  
  async toggleBlock(userId: string, block: boolean) {
    const user = await this.userRepository.findOne({ filter: { _id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === RoleType.SUPER_ADMIN)
      throw new BadRequestException('Cannot block super admin');

    await this.userRepository.updateOne({
      filter: { _id: userId },
      data: { isVerified: !block },
    });

    return { message: block ? 'User blocked' : 'User unblocked' };
  }

  
  async deleteUser(userId: mongoose.Types.ObjectId) {
    const user = await this.userRepository.findOne({ filter: { _id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === RoleType.SUPER_ADMIN)
      throw new BadRequestException('Cannot delete super admin');

    await this.userRepository.deleteOne({ filter: { _id: userId } });
if (user.role ==RoleType.USER) {
    await this.patientRepository.deleteOne({ filter: { userId:user._id } });
}
if (user.role ==RoleType.ADMIN) {
    await this.doctorRepository.deleteOne({ filter: { userId:user._id } });
}
    return { message: 'User deleted successfully' };
  }
  async getReportsPage() {
  const [
    totalPatients,
    totalRequests,
    totalMedicationLogs,
    monthlyGrowth,
    userStatus,
    departments,
  ] = await Promise.all([
    
    this.patientRepository['patientModel'].countDocuments(),

    
    this.reqModel.countDocuments({ status: 'accepted' }),

    
    this.logModel.countDocuments(),

    
    this.getMonthlyGrowthData(),

    
    this.getUserStatusData(),

    
    this.getDepartmentData(),
  ]);

  return {
    message: 'done',
    data: {
      stats: {
        totalRevenue: totalPatients * 50,
        totalPatients,
        appointments: totalRequests,
        reportsGenerated: totalMedicationLogs,
      },
      monthlyGrowth,
      userStatus,
      departments,
    },
  };
}


private async getMonthlyGrowthData() {
  const months: { month: string; patients: number; doctors: number }[] = []; 
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

    const [patients, doctors] = await Promise.all([
      this.patientRepository['patientModel'].countDocuments({
        createdAt: { $gte: start, $lt: end },
      }),
      this.doctorRepository['DoctorModel'].countDocuments({
        createdAt: { $gte: start, $lt: end },
      }),
    ]);

    months.push({
      month: start.toLocaleString('en', { month: 'short' }),
      patients,
      doctors,
    });
  }
  return months;
}

private async getUserStatusData() {
  const [active, blocked, pending] = await Promise.all([
    this.userRepository['userModel'].countDocuments({ isVerified: true }),
    this.userRepository['userModel'].countDocuments({
      isVerified: false,
      role: { $ne: 'Doctor' },
    }),
    this.doctorRepository['DoctorModel'].countDocuments({ isVerified: false }),
  ]);

  const total = active + blocked + pending || 1;
  return {
    active: { count: active, percentage: Math.round((active / total) * 100) },
    blocked: { count: blocked, percentage: Math.round((blocked / total) * 100) },
    pending: { count: pending, percentage: Math.round((pending / total) * 100) },
    total,
  };
}

private async getDepartmentData() {
  return this.doctorRepository['DoctorModel'].aggregate([
    {
      $group: {
        _id: '$specialization',
        visits: { $sum: { $size: { $ifNull: ['$patients', []] } } },
      },
    },
    { $sort: { visits: -1 } },
    { $limit: 8 },
    {
      $project: {
        _id: 0,
        department: '$_id',
        visits: 1,
      },
    },
  ]);
}

}