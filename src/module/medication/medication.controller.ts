
import {
  Body, Controller, Delete, Get, Param, Post,
  UploadedFile, UseInterceptors, UsePipes, ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MedicationService } from './medication.service';
import { Auth } from 'src/common/decorator/auth.decorator';
import { RoleType,type UserDocument } from 'src/DB/model/User.model';
import { User } from 'src/common/decorator/user.decorator';
import { AddMedicationDto } from './dto/medication.dto';
import { cloudMulterOptions } from 'src/common/multer/cloud.multer.options';
import multer from 'multer';

@Controller('medication')
export class MedicationController {
  constructor(private readonly medicationService: MedicationService) {}

  @Auth([RoleType.USER])
  @Post('add')  
  @UseInterceptors(FileInterceptor('image', cloudMulterOptions({})))
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async addMedication(
    @Body() body: AddMedicationDto,
    @User() user: UserDocument,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.medicationService.addMedication(user, body, file);
  }

  
  @Auth([RoleType.USER])
  @Post('take/:logId')
  async takeMedication(
    @Param('logId') logId: string,
    @User() user: UserDocument,
  ) {
    return this.medicationService.takeMedication(user, logId);
  }

  
  @Auth([RoleType.USER])
  @Get('my')
  async getMyMedications(@User() user: UserDocument) {
    return this.medicationService.getPatientMedications(user);
  }

  @Auth([RoleType.USER])
  @Get('report')
  async getMedicationReport(@User() user: UserDocument) {
    return this.medicationService.getMedicationReport(user);
  }

  @Auth([RoleType.USER, RoleType.ADMIN])
  @Get()
  async getAllMedicines() {
    return this.medicationService.getAllMedicines();
  }


  @Auth([RoleType.USER])
@Get('pending')
async getPendingLogs(@User() user: UserDocument) {
  return this.medicationService.getPendingLogs(user);
}
  @Auth([RoleType.USER, RoleType.ADMIN])
  @Get(':medicineId')
  async getMedicine(@Param('medicineId') medicineId: string) {
    return this.medicationService.getMedicine(medicineId);
    
  }
  @UseInterceptors(
  FileInterceptor('file', {
    storage: multer.memoryStorage(),
  }),
)
  @Auth([RoleType.USER])
@Post('scan')

async scanMedicine(
  @UploadedFile() file: Express.Multer.File,
  @User() user: UserDocument,
) {
  return this.medicationService.scanAndSave(user, file);
  
}

@Auth([RoleType.USER])
@Get('check-interaction/:medicineName')
async checkInteraction(
  @Param('medicineName') medicineName: string,
  @User() user: UserDocument,
) {
  return this.medicationService.checkInteraction(user, medicineName);
} 
@Auth([RoleType.USER])
@Delete('remove/:medicineId')
async removeMedication(
  @Param('medicineId') medicineId: string,
  @User() user: UserDocument,
) {
  return this.medicationService.removeMedication(user, medicineId);
}
}