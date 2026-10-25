import axios from "axios";
import { toast } from "react-toastify";

type ApiErrorBody = {
  detail?: string | { msg?: string; loc?: unknown[] }[];
  errors?: unknown;
  message?: string;
};

const messageFromBody = (data: unknown): string | undefined => {
  if (!data) return undefined;
  if (typeof data === "string") return data;
  const body = data as ApiErrorBody;
  if (typeof body.detail === "string") return body.detail;
  if (Array.isArray(body.detail)) {
    return body.detail
      .map((d) => {
        const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : undefined;
        return field ? `${String(field)}: ${d.msg ?? "invalid"}` : (d.msg ?? "invalid");
      })
      .join("\n");
  }
  if (typeof body.message === "string") return body.message;
  return undefined;
};

export const handleError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const err = error.response;
    if (!err) {
      toast.warning("Cannot reach the server. Is the backend running?");
      return;
    }
    const message = messageFromBody(err.data);
    if (err.status === 401) {
      toast.warning(message ?? "Please login again");
      return;
    }
    toast.warning(message ?? `Request failed (${err.status})`);
  }
};
