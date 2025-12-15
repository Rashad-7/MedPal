import { Global, Module } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserModel } from "src/DB/model/User.model";
import { UserRepositoryService } from "src/DB/repository/user.repository.service";
import { TokenService } from "../service/token.service";
@Global()
@Module({
    imports:[UserModel],
    providers:[UserRepositoryService,JwtService,TokenService,],
    exports:[UserRepositoryService,JwtService,TokenService,UserModel]
})
export class GlobalAuthModule{
}