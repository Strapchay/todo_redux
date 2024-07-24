import toast from "react-hot-toast";
import { makeAPIRequest } from "../helpers";

export function useActor(actionUrl, action, token = null, method = "GET") {
  async function handleRequest(payload, extraActions) {
    try {
      const data = await makeAPIRequest(
        actionUrl,
        payload,
        action,
        token,
        method,
      );
      if (data) {
        if (extraActions?.onSuccess) extraActions.onSuccess(data);
      }
    } catch (err) {
      if (extraActions?.onError) extraActions.onError();
      throw new Error(err.message);
    }
  }

  return { handleRequest };
}
