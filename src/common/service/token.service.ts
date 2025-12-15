import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";
import { RoleType, UserDocument } from "src/DB/model/User.model";
import { UserRepositoryService } from "src/DB/repository/user.repository.service";

export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
}
interface IVerifyToken {
  authorization: string;
  type?: TokenType;
}

export enum BearerType {
  Bearer = 'Bearer',
  System = 'System',
}
interface ITokenPayload extends JwtPayload {
  id: Types.ObjectId;
}
interface IGenerateToken {
  role?: RoleType;
  payload: ITokenPayload;
  type?: TokenType;
  expiresIn?: number;
}
@Injectable()
export class TokenService {
  constructor(private readonly jwt: JwtService,
    private readonly userRepositoryService:UserRepositoryService<UserDocument>
  ) {}

   sign({
    payload,
    type = TokenType.ACCESS,
    role = RoleType.USER,
    expiresIn = parseInt(process.env.EXPIRES_IN!)
  }: IGenerateToken) {
    const { accessSignature, refreshSignature } = this.getSignature(role);
    return this.jwt.sign(payload, {
      secret: type === TokenType.ACCESS ? accessSignature : refreshSignature,
      expiresIn: type === TokenType.ACCESS ? expiresIn : parseInt(process.env.EXPIRES_REFRESH_IN!)
    });
  }
private getSignature(role: RoleType): { accessSignature: string; refreshSignature: string } {
  let accessSignature: string;
  let refreshSignature: string;

  switch (role) {
    case RoleType.ADMIN:
      accessSignature = process.env.ADMIN_ACCESS_SIGNATURE!;
      refreshSignature = process.env.ADMIN_REFRESH_SIGNATURE!;
      break;
    case RoleType.USER:
    default:
      accessSignature = process.env.USER_ACCESS_SIGNATURE!;
      refreshSignature = process.env.USER_REFRESH_SIGNATURE!;
      break;
  }
  return { accessSignature, refreshSignature };
}
async verifyToken({ authorization, type = TokenType.ACCESS }: IVerifyToken) {
  if (!authorization) {
    throw new BadRequestException('Authorization header not provided');
  }

  const [bearer, token] = authorization.split(' ') || [];

  if (!token || !bearer) {
    throw new BadRequestException('Token not provided');
  }

  const { accessSignature, refreshSignature } = this.getSignature(
    bearer === BearerType.System ? RoleType.ADMIN : RoleType.USER,
  );

  let decoded: any;
  try {
    decoded = this.jwt.verify(token, {
      secret: type === TokenType.ACCESS ? accessSignature : refreshSignature,
    });
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new UnauthorizedException('Token expired');
    }
    throw new UnauthorizedException('Invalid token');
  }

  if (!decoded) {
    throw new UnauthorizedException('Invalid token');
  }

  const user = await this.userRepositoryService.findOne({
    filter: { _id: decoded.id },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  if (user.changeCredentialTime && user.changeCredentialTime > decoded.iat) {
    throw new UnauthorizedException('Token expired');
  }

  return user;
}
}