// @ts-nocheck
import React, { useEffect, useState } from "react";
import AuthContext, { IAuthData } from "./AuthContext";

const AuthContextProvider: React.FC = ({ children }) => {
  const [auth, setAuth] = useState<IAuthData>(null as unknown as IAuthData);

  useEffect(() => {
    if (auth) {
      localStorage.setItem("auth", JSON.stringify(auth));
    }
  }, [auth]);

  // useEffect(() => {
  //   if (localStorage.getItem("auth")) {
  //     setAuth(JSON.parse(localStorage.getItem("auth")));
  //   }
  // }, []);

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
