import { API } from "./api";
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
export function persistTodo(state) {
  localStorage.setItem("todos", JSON.stringify(state));
}

export function persistDiff(state) {
  localStorage.setItem("diff", JSON.stringify(state));
}

async function getDeleteRes(data, requestType) {
  if (requestType === "deleteTask") return null;
  if (["deleteTodo", "deleteTodoBatch"].includes(requestType)) {
    let res;
    try {
      res = await data.json();
      console.log("the res val", res);
    } catch (_) {
      res = null;
    }

    if (res && res?.detail.toLowerCase() === "not found.")
      return { status: 405 };

    return res;
  }
  // if (requestType === "deleteTodoBatch") return await data.json();
}

export function getInitError(data) {
  if (typeof data === "object") {
    const errorKeys = Object.keys(data);
    console.log("the error keys", errorKeys);
    if (errorKeys.length === 1) return `${errorKeys}:${data[errorKeys]}`;
    else return `${errorKeys[0]}:${data[errorKeys[0]]}`;
  }
  return data;
}

export const formatDateTime = (dateTime) => {
  return new Date(dateTime);
};

export function getOrderingUrlFromType(
  orderingLength,
  orderingType,
  objId = undefined,
) {
  if (orderingLength > 1) {
    if (orderingType === "todo") return API.APIEnum.TODO.BATCH_UPDATE_ORDERING;
    if (orderingType === "task") return API.APIEnum.TASK.BATCH_UPDATE_ORDERING;
  }
  if (orderingLength === 1) {
    if (orderingType === "todo") return API.APIEnum.TODO.PATCH(objId);
    if (orderingType === "task") return API.APIEnum.TASK.PATCH(objId);
  }
}

export function filterToGetTaskBody(getModel, taskId, todoId, clone = true) {
  //get todo from modelState
  const modelTodos = getModel()?.todo;
  const todoModelIndex = modelTodos.findIndex(
    (modelTodo) => modelTodo.todoId === todoId,
  );
  const taskIndex = modelTodos[todoModelIndex].task.findIndex(
    (modelTask) => modelTask.taskId === taskId,
  );
  if (!clone) return modelTodos[todoModelIndex].task[taskIndex];

  const task = modelTodos[todoModelIndex]?.task[taskIndex];

  if (task) {
    const taskBody = JSON.parse(JSON.stringify(task));
    return taskBody;
  }
  return task;
}

export async function updatePendingTaskOrdering(payload, task, state) {
  console.log("the task id value", task.taskId);
  const pendingTaskOrdering = [...state.pendingTaskOrdering];
  if (pendingTaskOrdering?.length > 0) {
    const taskOrderingIdUpdateIfCreatedByFallback =
      pendingTaskOrdering.findIndex(
        (taskOrder) => taskOrder.id === payload.taskId,
      );
    if (taskOrderingIdUpdateIfCreatedByFallback > -1) {
      console.log("the pending task ordering v", pendingTaskOrdering);
      pendingTaskOrdering[taskOrderingIdUpdateIfCreatedByFallback] = {
        ...pendingTaskOrdering[taskOrderingIdUpdateIfCreatedByFallback],
        id: task.taskId,
      };
      state.pendingTaskOrdering = [...pendingTaskOrdering];
      console.log("the pending task ordering after", pendingTaskOrdering);
    }
    // taskOrderingIdUpdateIfCreatedByFallback.id = task.taskId;
  }
}

export async function makeAPIRequest(
  url,
  payload = null,
  action = null,
  token = null,
  method = "GET",
  extraActions = null,
) {
  try {
    const prepare = {
      method: method,
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
    const data =
      method !== "DELETE" ? await res.json() : await getDeleteRes(res, action);
    if (!res.ok || !successCodes.includes(res.status)) {
      throw new Error(getInitError(data));
    }
    if (extraActions) extraActions.onSuccess(data);
    return data;
  } catch (err) {
    console.log("triggered the error", err);
    if (extraActions)
      extraActions.onError(action === "deleteTodo" ? err?.message : null);
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

const formatAPITodoTasks = (APITasks, formatType) => {
  if (APITasks.length > 0) {
    const APItaskList = [];
    APITasks.forEach((task) =>
      APItaskList.push(formatAPIResponseBody(task, formatType)),
    );
    const orderedTaskList = APItaskList.sort(
      (a, d) => a?.ordering - d?.ordering,
    );
    if (!orderedTaskList) return APItaskList;
    return orderedTaskList;
  }

  // return [formatAPIResponseBody(APITasks[0], formatType)]
  return APITasks;
};

const formatAPIRequestTodoTasks = (APIRequestTasks, formatType) => {
  if (APIRequestTasks.length > 0) {
    const APItaskList = [];
    APIRequestTasks.forEach((task) =>
      APItaskList.push(formatAPIRequestBody(task, formatType)),
    );
    return APItaskList;

    //implement task todo request formatting
  }
  return APIRequestTasks;
  //return [formatAPIRequestBody(APIRequestTasks[0], formatType)]
};

export const formatAPIResponseBody = (responseBody, type, fallback = false) => {
  let formattedBody;
  if (fallback) return responseBody;

  if (type === "todo")
    formattedBody = {
      todoId: responseBody.id,
      title: responseBody.title,
      task: formatAPITodoTasks(responseBody.tasks, "todoTask"),
      lastAdded: formatDateTime(responseBody.last_added).toISOString(),
      completed: responseBody.completed,
      ordering: responseBody.ordering,
    };

  if (type === "task")
    formattedBody = {
      taskId: responseBody.id,
      task: responseBody.task,
      completed: responseBody.completed,
      todoId: responseBody.todo_id,
      todoLastAdded: responseBody.todo_last_added,
      ordering: responseBody.ordering,
    };

  if (type === "todoTask")
    formattedBody = {
      taskId: responseBody.id,
      task: responseBody.task,
      completed: responseBody.completed,
      ordering: responseBody.ordering ?? null,
    };
  return formattedBody;
};

export const formatAPIRequestBody = (
  requestBody,
  type,
  optionalType = undefined,
) => {
  // debugger;
  let formattedBody;

  if (![requestBody].length > 0) return requestBody;

  if (type === "todo") {
    formattedBody = {};
    if (requestBody.title || requestBody?.title?.length === 0)
      formattedBody.title = requestBody.title;
    if (optionalType === "update") {
      formattedBody.id = requestBody.todoId;
      formattedBody.completed = requestBody.completed;
    }

    if (optionalType !== "update") {
      formattedBody.tasks = formatAPIRequestTodoTasks(
        requestBody.task,
        "todoTask",
      );
      formattedBody.last_added = requestBody.lastAdded;
      formattedBody.completed = requestBody.completed;
    }
  }

  if (type === "todoTask")
    formattedBody = {
      task: requestBody.task,
      completed: requestBody.completed,
    };

  if (type === "task") {
    formattedBody = {
      task: requestBody.task ?? null,
      completed: requestBody.completed ?? null,
    };
    if (optionalType === "create") formattedBody.todo_id = requestBody.todoId;
    if (optionalType === "update") {
      formattedBody.id = requestBody.taskId;
      formattedBody.todo_last_added = requestBody.todoLastAdded;
    }
  }

  return formattedBody;
};

export const formatAPIPayloadForUpdateReorder = function (payload, type) {
  let requestObj;

  if (type === "tasks") {
    const listItems = [];

    payload.tasks.forEach((task, i) =>
      listItems.push({ id: task.taskId, ordering: i + 1 }),
    );
    requestObj = {
      ordering_list: listItems,
    };
  }

  if (type === "todos") {
    const listItems = [];

    payload.forEach((todo, i) =>
      listItems.push({ id: todo.todoId, ordering: i + 1 }),
    );
    requestObj = {
      ordering_list: listItems,
    };
  }

  return requestObj;
};

export function wrapper(wrapperName, requestBody) {
  const wrapper = {};
  wrapper[wrapperName] = requestBody;

  return wrapper;
}

export function batchRequestWrapper(requestBody, requestType) {
  if (requestType === "batch_update") {
    return wrapper("update_list", requestBody);
  }

  if (requestType === "batch_update_ordering") {
    return wrapper("ordering_list", requestBody);
  }

  if (requestType === "batch_create") {
    return wrapper("create_list", requestBody);
  }

  if (requestType === "batch_delete") {
    return wrapper("delete_list", requestBody);
  }
}

export function formatBatchCreatedReturnData(returnData, objType) {
  let formattedReturnedData = [];

  if (Array.isArray(returnData)) {
    returnData.forEach((data, i) =>
      formattedReturnedData.push(formatAPIResponseBody(data, objType)),
    );
  }
  if (!Array.isArray(returnData))
    formattedReturnedData.push(formatAPIResponseBody(returnData, objType));

  return formattedReturnedData;
}
