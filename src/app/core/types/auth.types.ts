export interface IUser {
  id: string;
  name: string;
  email: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  name: string;
  email: string;
  password: string;
  planId: string;
}

export interface IAuthResponse {
  user: IUser;
}
