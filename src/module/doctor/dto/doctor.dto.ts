import { IsEnum, IsNotEmpty } from "class-validator";
import { RequestStatus } from "src/DB/model/Req.model";

export class UpdateRequestStatusDto {
  @IsEnum(RequestStatus)
  @IsNotEmpty()
  status: RequestStatus.ACCEPTED | RequestStatus.REJECTED;
}