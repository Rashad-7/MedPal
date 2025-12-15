import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { rolesKey } from '../../decorator/role.decorator';
import { RoleType } from 'src/DB/model/User.model';

@Injectable()
export class AuthorizaionGuard implements CanActivate {
  constructor(private readonly reflector:Reflector){}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const {user}=context.switchToHttp().getRequest()
  const requiredRole=this.reflector.getAllAndOverride<RoleType[]>(rolesKey,[context.getHandler(),context.getClass()])

  if (!requiredRole?.includes(user.role)) {
    throw new ForbiddenException("Not Authorized account")
  }
  
    
    return true;
  }
}
