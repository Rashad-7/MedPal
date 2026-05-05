// src/module/superadmin/superadmin.service.ts
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

@Injectable()
export class SuperAdminService {
  constructor(
    private readonly userRepository: UserRepositoryService<UserDocument>,
    private readonly doctorRepository: DoctorRepositoryService<DoctorDocument>,
    private readonly patientRepository: PatientRepositoryService<PatientDocument>,
    private readonly tokenService: TokenService,
    private readonly SOSRepository:SOSRepositoryService<SOSDocument>
  ) {}

  // ── Login ──
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

  // ── Dashboard Stats ──
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

  // ── Get All Doctors (مع فلتر الـ verified) ──
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

  // ── Verify Doctor ──
  async verifyDoctor(doctorUserId: string) {
    const user = await this.userRepository.findOne({
      filter: { _id: doctorUserId, role: RoleType.ADMIN },
    });
    if (!user) throw new NotFoundException('Doctor not found');

    await this.userRepository.updateOne({
      filter: { _id: doctorUserId },
      data: { isVerified: true },
    });

    await this.doctorRepository.updateOne({
      filter: { userId: doctorUserId },
      data: { isVerified: true },
    });

    return { message: 'Doctor verified successfully' };
  }

  // ── Reject Doctor ──
  async rejectDoctor(doctorUserId: string) {
    const user = await this.userRepository.findOne({
      filter: { _id: doctorUserId, role: RoleType.ADMIN },
    });
    if (!user) throw new NotFoundException('Doctor not found');

    // احذف الدكتور والـ user
    await this.doctorRepository.deleteOne({ filter: { userId: doctorUserId } });
    await this.userRepository.deleteOne({ filter: { _id: doctorUserId } });

    return { message: 'Doctor rejected and removed' };
  }

  // ── Get All Patients ──
  async getPatients() {
    const patients = await this.patientRepository.find({
      filter: {},
      populate: [{ path: 'userId', select: 'fullName email phone createdAt' }],
      limit: 100,
    });

    return { message: 'done', total: patients.length, data: patients };
  }

  // ── Block / Unblock User ──
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

  // ── Delete User ──
  async deleteUser(userId: string) {
    const user = await this.userRepository.findOne({ filter: { _id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === RoleType.SUPER_ADMIN)
      throw new BadRequestException('Cannot delete super admin');

    await this.userRepository.deleteOne({ filter: { _id: userId } });

    return { message: 'User deleted successfully' };
  }
}