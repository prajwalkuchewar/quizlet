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

// A 401 from these endpoints means bad credentials or an expired session, not a stale token.
const AUTH_ENDPOINT_SUFFIXES = ["/login", "/signup", "/logout"];

const setAuthHeader = (token: string | null) => {
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common["Authorization"];
  }
};

const isUserProfile = (value: unknown): value is UserProfile =>
  typeof value === "object" &&
  value !== null &&
  "firstname" in value &&
  typeof value.firstname === "string" &&
  "lastname" in value &&
  typeof value.lastname === "string" &&
  "username" in value &&
  typeof value.username === "string" &&
  "role" in value &&
  typeof value.role === "string";

const getStoredSession = () => {
  const token = localStorage.getItem("token");
  const userdata = localStorage.getItem("user");
  if (!token && !userdata) {
    return null;
  }

  try {
    const storedUser: unknown = userdata ? JSON.parse(userdata) : null;
    if (token && isUserProfile(storedUser)) {
      return { token, user: storedUser };
    }
  } catch {
    // Invalid persisted data is cleared below so it cannot block app startup.
  }

  localStorage.removeItem("token");
  localStorage.removeItem("user");
  toast.warning("Your saved session is invalid. Please log in again.");
  return null;
};

export const UserProvider = ({ children }: Props) => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const session = getStoredSession();
    if (session) {
      setUser(session.user);
      setToken(session.token);
      setAuthHeader(session.token);
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    const syncSession = (event: StorageEvent) => {
      if (
        event.storageArea !== localStorage ||
        (event.key !== null && event.key !== "token" && event.key !== "user")
      ) {
        return;
      }

      const session = getStoredSession();
      if (session) {
        setUser(session.user);
        setToken(session.token);
        setAuthHeader(session.token);
      } else {
        setAuthHeader(null);
        setUser(null);
        setToken(null);
      }
    };

    window.addEventListener("storage", syncSession);
    return () => window.removeEventListener("storage", syncSession);
  }, []);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const url: string = error?.config?.url ?? "";
        const isAuthCall = AUTH_ENDPOINT_SUFFIXES.some((suffix) => url.endsWith(suffix));
        if (
          axios.isAxiosError(error) &&
          error.response?.status === 401 &&
          !isAuthCall &&
          localStorage.getItem("token")
        ) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setAuthHeader(null);
          setUser(null);
          setToken(null);
          toast.warning("Your session has expired. Please log in again.");
          navigate("/login");
        }
        return Promise.reject(error);
      },
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, [navigate]);

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
