import { ALERT_STATUS_ERRORS, BASE_API_URL, successCodes } from "./constants";

// function getRequestResponse(res, query, resStatus) {
//   //set the resStatus on the queryObj
//   if (resStatus) queryObj.resStatus = resStatus

//   if (response.non_field_errors)
//     return HTTP_400_RESPONSE_LOGIN_USER

//   if (response instanceof Array) return response[0]

//   const formError = Object.getOwnPropertyNames(response)
//   const formErrorsLength = Object.getOwnPropertyNames(response).length

//   if (formErrorsLength > 0) return (() => {
//     if (queryObj.callBack) queryObj.callBack(response);
//     return formErrorsLength >= 1 ? API.destructureError(response[formError[0]], formError[0]) : queryObj.actionType === "create" ? HTTP_400_RESPONSE_CREATE_USER : API.destructureError(response[formError[0]], formError[0])
//   })()
// }
//
export function getInitError(data) {
  if (typeof data === "object") {
    const errorKeys = Object.keys(data);
    if (errorKeys.length === 1) return `${errorKeys}:${data[errorKeys]}`;
    else return `${errorKeys[0]}:${data[errorKeys[0]]}`;
  }
  return data;
}

export async function makeAPIRequest(
  url,
  payload = null,
  action = null,
  token = null,
) {
  try {
    const prepare = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };
    if (payload) prepare.body = JSON.stringify(payload);
    if (token) prepare.headers.Authorization = `Token ` + token;

    // const res = await fetch(url, prepare);
    const res = await Promise.race([
      fetch(BASE_API_URL + url, prepare),
      timeout(20, action),
    ]);
    const data = await res.json();
    if (!res.ok || !successCodes.includes(res.status))
      throw new Error(getInitError(data));
    return data;
  } catch (err) {
    throw new Error(err.message);
  }
  //`${ALERT_STATUS_ERRORS.find(s => s === res.status) ? }`
}

export const timeout = (sec = 20, actionType, fn = undefined) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error(
        `Could not ${actionType} at this moment, Please try again later!`,
      );
      reject(fn ? fn() && error : error);
    }, sec * 1000);
  });
};

export const timeoutWithoutPromise = (sec, fn) => {
  return new Promise((resolve, _) => {
    setTimeout(() => {
      resolve(fn());
    }, sec * 1000);
  });
};
