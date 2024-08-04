import toast from "react-hot-toast";
import { makeAPIRequest } from "../helpers";

export function useAuth(
  authUrl,
  formReset,
  formAction,
  token = null,
  removeToken,
) {
  async function handleRequest(payload, extraActions, action = "POST") {
    try {
      const data = await makeAPIRequest(
        authUrl,
        payload,
        formAction,
        token,
        action,
        removeToken,
      );
      if (data) {
        //prevents form resetting to old values for updateInfo form
        formAction !== "updateInfo" ? formReset() : null;
        if (extraActions?.onSuccess) extraActions.onSuccess(data);
      }
    } catch (err) {
      toast.error(err.message);
      if (extraActions?.onError) extraActions.onError();
    }
  }

  return { handleRequest };
}
