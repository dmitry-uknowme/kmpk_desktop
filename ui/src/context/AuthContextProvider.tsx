import React, { useState } from "react";
import AuthContext, { IAuthData } from "./AuthContext";

const AuthContextProvider: React.FC = ({ children }) => {
  const [auth, setAuth] = useState<IAuthData>(null as unknown as IAuthData);
  return (
    <AuthContext.Provider
      value={{
        auth,
        setAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContextProvider;
