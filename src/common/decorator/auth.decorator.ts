
import { applyDecorators, UseGuards } from '@nestjs/common';
import { RoleType } from 'src/DB/model/User.model';
import { Roles, rolesKey } from './role.decorator';
import { AuthGuard } from '../guard/auth/auth.guard';
import { AuthorizaionGuard } from '../guard/authorizaion/authorizaion.guard';

export function Auth(roles: RoleType[]) {
  return applyDecorators(
    Roles(roles),
    UseGuards(AuthGuard,AuthorizaionGuard),
  
  );
}
