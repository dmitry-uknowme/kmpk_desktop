// @ts-nocheck
import React, { createContext } from "react";

export interface IAuthData {
  user: {
    full_name: string;
    position: string;
    org_name: string;
  };
  object: {
    name: string;
    point_number: string;
  };
  start_time?: string;
  end_time?: string;
}

export interface IAuthContext {
  auth: IAuthData | null;
  setAuth: React.Dispatch<React.SetStateAction<IAuthData | null>>;
}

const AuthContext = createContext(null as unknown as IAuthContext);

export default AuthContext;
