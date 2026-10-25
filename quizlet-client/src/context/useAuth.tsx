import axios from "axios";
import React, { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { loginAPI, logoutAPI, registerAPI } from "../api/authService";
import { UserProfile } from "../models/User";

type UserContextType = {
  user: UserProfile | null;
  token: string | null;
  registerUser: (
    firstname: string,
    lastname: string,
    username: string,
    password: string,
    role: string,
  ) => void;
  loginUser: (username: string, password: string) => void;
  logout: () => Promise<void>;
  isLoggedIn: () => boolean;
  isAdmin: () => boolean;
};

type Props = { children: React.ReactNode };

const UserContext = createContext<UserContextType>({} as UserContextType);

const setAuthHeader = (token: string | null) => {
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common["Authorization"];
  }
};

export const UserProvider = ({ children }: Props) => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const userdata = localStorage.getItem("user");
    const tokendata = localStorage.getItem("token");
    if (userdata && tokendata) {
      setUser(JSON.parse(userdata));
      setToken(tokendata);
      setAuthHeader(tokendata);
    }
    setIsReady(true);
  }, []);

  const registerUser = async (
    firstname: string,
    lastname: string,
    username: string,
    password: string,
    role: string,
  ) => {
    await registerAPI(firstname, lastname, username, password, role)
      .then((res) => {
        if (res) {
          toast.success("Account Created Successfully!");
          navigate("/login");
        }
      })
      .catch((err) => toast.warning("Server error occured :" + err));
  };

  const loginUser = async (username: string, password: string) => {
    await loginAPI(username, password)
      .then((res) => {
        if (res) {
          const newToken: string = res?.data.token;
          const userObj: UserProfile = {
            firstname: res?.data.firstname,
            lastname: res?.data.lastname,
            username: res?.data.username,
            role: res?.data.role,
          };
          localStorage.setItem("token", newToken);
          localStorage.setItem("user", JSON.stringify(userObj));
          setAuthHeader(newToken);
          setToken(newToken);
          setUser(userObj);
          toast.success("Login Success!");
          navigate("/");
        }
      })
      .catch((err) => toast.warning("Server error occured : " + err));
  };

  const isLoggedIn = () => {
    return !!user;
  };

  const isAdmin = () => {
    return user?.role === "ADMIN";
  };

  const logout = async () => {
    // Ends the server-side session so its uploaded materials are removed; local logout proceeds regardless.
    if (token) {
      await logoutAPI().catch(() => undefined);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuthHeader(null);
    setUser(null);
    setToken(null);
    navigate("/login");
  };

  return (
    <UserContext.Provider
      value={{
        loginUser,
        user,
        token,
        logout,
        isLoggedIn,
        isAdmin,
        registerUser,
      }}
    >
      {isReady ? children : null}
    </UserContext.Provider>
  );
};

export const useAuth = () => React.useContext(UserContext);
