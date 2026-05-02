import { Role } from "../enums/role.enum";

export interface UserPayload {
  sub: string;
  email: string;
  role: Role;
}