import { SetMetadata } from '@nestjs/common';
import { RoleType } from './../../DB/model/User.model';
export const rolesKey='roles'
export const Roles = (roles: RoleType[]) => {
  return SetMetadata(rolesKey, roles);
}