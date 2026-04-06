export interface SighUpData{
  email : string;
  password : string;
  name : string;
  orgName : string;
}

export interface SignInData {
  email : string;
  password : string;
}
export interface AuthResult {
  error?: string;
  success?: boolean;
}