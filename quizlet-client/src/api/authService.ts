import axios from "axios";
import config from "../config/config";
import { handleError } from "../helper/ErrorHandler";
import { UserProfileToken } from "../models/User";

const VITE_LOGIN_URL = `${config.authUrl}/login`;
const VITE_SIGNUP_URL = `${config.authUrl}/signup`; // Updated to use config.authUrl for consistency
// console.log(VITE_LOGIN_URL);
// console.log(VITE_SIGNUP_URL);

export const loginAPI = async (username: string, password: string) => {
  try {
    const data = await axios.post<UserProfileToken>(VITE_LOGIN_URL, {
      username: username,
      password: password,
    });
    return data;
  } catch (error) {
    handleError(error);
  }
};
export const registerAPI = async (
  firstname: string,
  lastname: string,
  username: string,
  password: string,
  role: string,
) => {
  try {
    const data = await axios.post<UserProfileToken>(VITE_SIGNUP_URL, {
      firstname: firstname,
      lastname: lastname,
      username: username,
      password: password,
      role: role,
    });
    return data;
  } catch (error) {
    handleError(error);
  }
};
