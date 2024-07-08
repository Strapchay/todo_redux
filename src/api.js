// import { timeout, timeoutWithoutPromise } from "./helper.js";
// import {
//   BASE_API_URL,
//   HTTP_400_RESPONSE_LOGIN_USER,
//   HTTP_200_RESPONSE,
//   HTTP_400_RESPONSE_CREATE_USER,
//   ALERT_STATUS_ERRORS,
//   HTTP_204_SUCCESS_NO_CONTENT,
//   PREVENT_DESTRUCTURING_FROM_API_ENDPOINT_RESP,
// } from "./config.js";
// import { Loader } from "./components/loader.js";
// import { Alert } from "./components/alerts.js";

export class API {
  static APIEnum = {
    USER: {
      CREATE: "user/create/",
      GET: "user/me/",
      PUT: "user/me/",
      PATCH: "user/me/",
      TOKEN: "user/token/",
      UPDATE_INFO: "user/update_info/",
      UPDATE_PWD: "user/change_password/",
      RESET_PWD: "user/password-reset/",
      RESET_PWD_CONFIRM: "user/password-reset-confirm/",
    },

    TODO: {
      CREATE: "todo/todos/",
      BATCH_CREATE: "todo/todos/batch_create/",
      LIST: "todo/todos/",
      GET: (todoId) => `todo/todos/${todoId}/`,
      PUT: (todoId) => `todo/todos/${todoId}/`,
      PATCH: (todoId) => `todo/todos/${todoId}/`,
      BATCH_UPDATE_ORDERING: "todo/todos/batch_update_ordering/",
      BATCH_UPDATE: "todo/todos/batch_update/",
      DELETE: (todoId) => `todo/todos/${todoId}/`,
      BATCH_DELETE: "todo/todos/batch_delete",
    },

    TASK: {
      CREATE: "todo/tasks/",
      BATCH_CREATE: "todo/tasks/batch_create/",
      LIST: "todo/tasks/",
      GET: (taskId) => `todo/tasks/${taskId}/`,
      PUT: (taskId) => `todo/tasks/${taskId}/`,
      PATCH: (taskId) => `todo/tasks/${taskId}/`,
      DELETE: (taskId) => `todo/tasks/${taskId}/`,
      BATCH_DELETE: "todo/tasks/batch_delete/",
      BATCH_UPDATE: "todo/tasks/batch_update/",
      BATCH_UPDATE_ORDERING: "todo/tasks/batch_update_ordering/",
    },
  };
  static timeout = 20; //timeout in 20s

  static createTodoPayload = {
    title: "",
  };

  static getDefaultPayloadType(actionType) {
    switch (actionType) {
      case "createTodo":
        return API.createTodoPayload;
    }
  }

  // static queryAPI(queryObj) {
  //   //switch the timeout secs if null
  //   queryObj.sec = queryObj.sec ?? API.timeout;
  //   //create the loader based on the queryObj
  //   API.loaderCreator(queryObj);

  //   (async () => await API.querier(queryObj))().then((returnData) => {
  //     if (returnData) {
  //       queryObj.loader ? queryObj.loader.remove() : null;
  //       queryObj.alert
  //         ? new Alert(
  //             HTTP_200_RESPONSE[queryObj.actionType](returnData),
  //             null,
  //             "success",
  //           ).component()
  //         : null;
  //       if (queryObj.callBack)
  //         queryObj.callBack(returnData, queryObj.callBackParam ?? true);

  //       queryObj = {};
  //     }

  //     if (!returnData && queryObj.callBack) queryObj.callBack(); //call the fallback to handle thee failure

  //     //if token expired render credeential issues msg and logout user
  //     if (queryObj.resStatus === 401) {
  //       new Alert(
  //         HTTP_200_RESPONSE[queryObj.actionType](returnData),
  //         null,
  //         "success",
  //       ).component();
  //       timeoutWithoutPromise(5, API.logoutUser);
  //     }
  //   });
  // }

  // static getResponseToRender(response, queryObj, resStatus) {
  //   //set the resStatus on the queryObj
  //   if (resStatus) queryObj.resStatus = resStatus;

  //   if (response.non_field_errors) return HTTP_400_RESPONSE_LOGIN_USER;

  //   if (response instanceof Array) return response[0];

  //   const formError = Object.getOwnPropertyNames(response);
  //   const formErrorsLength = Object.getOwnPropertyNames(response).length;

  //   if (formErrorsLength > 0)
  //     return (() => {
  //       if (queryObj.callBack) queryObj.callBack(response);
  //       return formErrorsLength >= 1
  //         ? API.destructureError(response[formError[0]], formError[0])
  //         : queryObj.actionType === "create"
  //           ? HTTP_400_RESPONSE_CREATE_USER
  //           : API.destructureError(response[formError[0]], formError[0]);
  //     })();
  // }

  // static loaderCreator(queryObj) {
  //   if (queryObj.spinner) {
  //     //add the loader to the queryObj
  //     queryObj.loader = new Loader(queryObj.sec);
  //     queryObj.loader.component();
  //   }
  // }

  static destructureError(error, key) {
    if (error instanceof Object) return error[key] ?? error.join("\n");
    if (error instanceof Array) return error.join("\n");
    return error;
  }

  // static destructureSuccessResponse(resp, queryObj) {
  //   const preventDestructureList = PREVENT_DESTRUCTURING_FROM_API_ENDPOINT_RESP;
  //   let preventDestructure = false;
  //   //if theres an empty data value returned as an empty array reeturn it
  //   if (resp instanceof Array && resp.length === 0) return resp;
  //   //if its not empty destructure
  //   if (resp instanceof Object) {
  //     preventDestructure = preventDestructureList.some(
  //       (listItem) => listItem === queryObj.actionType,
  //     );

  //     if (!preventDestructure) {
  //       const respKey = Object.keys(resp);
  //       return resp[respKey[0]];
  //     }
  //   }
  //   return resp;
  // }

  // static makeRequest(queryObj) {
  //   switch (queryObj.type) {
  //     case "POST":
  //       return API.requestJSON(queryObj);
  //     case "PATCH":
  //       return API.requestJSON(queryObj);
  //     case "DELETE":
  //       return API.requestJSON(queryObj);
  //     case "PUT":
  //       return API.requestJSON(queryObj);
  //     case "GET":
  //       return API.requestJSON(queryObj);
  //     default:
  //       return fetch(`${BASE_API_URL}${queryObj.endpoint}`, queryObj.queryData);
  //   }
  // }

  // static requestJSON(queryObj) {
  //   const fetchParams = {
  //     method: queryObj.type,
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //   };
  //   if (queryObj.queryData)
  //     fetchParams.body = JSON.stringify(queryObj.queryData);
  //   if (queryObj.token)
  //     fetchParams.headers.Authorization = `Token ${queryObj.token}`;

  //   return fetch(`${BASE_API_URL}${queryObj.endpoint}`, fetchParams);
  // }

  static logoutUser() {
    localStorage.removeItem("token");
    window.location.reload();
  }
}
