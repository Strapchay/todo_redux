import { useContext, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { deactivateDiff } from "../slices/todo/diffSlice";
import { persistDiff } from "../helpers";
import { TodoContext } from "../pages/Todo";
import toast from "react-hot-toast";

export function useSyncLocalStorageToAPI() {
  const dispatch = useDispatch()
  const [syncState, setSyncState] = useState(0)
  const diff = useSelector(state => state.diff)
  const toastRef = useRef()
  const modelState = useSelector(state => state.todos)

  const { getLocalStates } = useContext(TodoContext)
  const { todos = null, diffLocal = null } = getLocalStates();
  const pendingStateSync = useRef(diffLocal ? {
    pendingTodos: diffLocal.todoToCreate,
    pendingTasks: diffLocal.taskToCreate,
    pendingTodosToDelete: diffLocal.todoToDelete.map(
      (todo) => +todo,
    ),
    pendingTasksToDelete: diffLocal.taskToDelete,
    pendingTodoToUpdate: diffLocal.todoToUpdate,
    pendingTaskToUpdate: diffLocal.taskToUpdate,
    //ordering
    pendingTodoOrdering: diffLocal.todoOrdering,
    pendingTaskOrdering: diffLocal.taskOrdering
  } : {})
  const toCreatePendingState = useRef({
    createPendingTodos: [],
    createPendingTodosToUpdate: [],
    createPendingTasks: [],
    createPendingTasksToUpdate: [],
    createPendingTaskLinkedToAPITodo: [],
    createPendingTaskLinkedToAPITodoToUpdate: []
  })
  const toCreatePayloadState = useRef({
    createTodoPayload: { payload: [], ids: [] },
    createTaskPayload: { payload: [], ids: [] },
    createTodoToUpdatePayload: { payload: [], ids: [] },
    createTaskToUpdatePayload: { payload: [], ids: [] }
  })


  function startModelInit(init) {
    this._handleStartSync();
  }

  function completeSyncAndLoadData() {
    if (syncState <= 0) {
      setSyncState(0)
      dispatch(deactivateDiff())
      persistDiff(diff)
    }
  }

  _clearInitData() {
    this._init =
      this._loader =
      modelState =
      diffLocal =
      this._diffObj =
      null;
  }

  function initializeSyncProperties() {
    pendingStateSync.current =



  }

  function handleStartSync() {
    filterProperties();

    createPropertiesPayload();

    this._makePropertiesRequest();

    //try to complete sync if no data is to be synced after request
    completeSyncAndLoadData();
    console.log(syncState);
  }

  function filterProperties() {
    //todo to create passes deleted check
    filterDeletedObjectsFromObjects(
      pendingStateSync.current.pendingTodos,
      pendingStateSync.current.pendingTodosToDelete,
      null,
      toCreatePendingState.current.createPendingTodos,
      "todo",
    );

    //todo to update passes deleted check
    filterDeletedObjectsFromObjects(
      pendingStateSync.current.pendingTodoToUpdate,
      pendingStateSync.current.pendingTodosToDelete,
      null,
      toCreatePendingState.current.createPendingTodosToUpdate,
      "todo",
    );

    //task to create passes deleted check
    filterDeletedObjectsFromObjects(
      pendingStateSync.current.pendingTasks,
      pendingStateSync.current.pendingTasksToDelete,
      pendingStateSync.current.pendingTodosToDelete,
      toCreatePayloadState.current.createPendingTasks,
      "task",
    );

    //task to update passes deleted check
    filterDeletedObjectsFromObjects(
      pendingStateSync.current.pendingTaskToUpdate,
      pendingStateSync.current.pendingTasksToDelete,
      pendingStateSync.current.pendingTodosToDelete,
      toCreatePayloadState.current.createPendingTasksToUpdate,
      "task",
    );
  }

  function createPropertiesPayload() {
    //create todo payload
    createTodoPayload(
      pendingStateSync.current.pendingTodos,
      toCreatePendingState.current.createPendingTodos,
      toCreatePayloadState.current.createTodoPayload,
    );
    console.log("the created todo payload", toCreatePayloadState.current.createTodoPayload);

    //create todo to update payload
    createTodoUpdatePayload(
      pendingStateSync.current.pendingTodoToUpdate,
      toCreatePendingState.current.createPendingTodosToUpdate,
      toCreatePendingState.current.createPendingTodos,
      toCreatePayloadState.current.createTodoToUpdatePayload,
    );

    console.log(
      "the created todo to update payload",
      toCreatePayloadState.current.createTodoToUpdatePayload,
    );

    //sort tasks which are not linked to todos to create
    filterPendingTaskLinkedToAPITodo(
      pendingStateSync.current.pendingTasks,
      toCreatePendingState.current.createPendingTasks,
      toCreatePendingState.current.createPendingTodos,
      toCreatePendingState.current.createPendingTaskLinkedToAPITodo,
    );
    console.log(
      "the filtered pending tasks linked to api todo",
      toCreatePendingState.current.createPendingTaskLinkedToAPITodo,
    );

    //sort tasks which are not linked to todos to update
    filterPendingTaskLinkedToAPITodo(
      pendingStateSync.current.pendingTaskToUpdate,
      toCreatePendingState.current.createPendingTasksToUpdate,
      toCreatePendingState.current.createPendingTodos,
      toCreatePendingState.current.createPendingTaskLinkedToAPITodoToUpdate,
    );

    console.log(
      "the filtered pending tasks to update linked to api todo",
      toCreatePendingState.current.createPendingTaskLinkedToAPITodoToUpdate,
    );

    //task not linked to todos to create payload body
    createTaskLinkedToAPITodoBody(
      pendingStateSync.current.pendingTasks,
      toCreatePendingState.current.createPendingTaskLinkedToAPITodo,
      toCreatePayloadState.current.createTaskPayload,
    );

    console.log(
      toCreatePayloadState.current.createTaskPayload,
      "task to create payload for api todo ",
    );

    //sort tasks which are to be updated not in createPendingTaskLinkedToAPITodo Array
    createTaskToUpdateBody(
      pendingStateSync.current.pendingTaskToUpdate,
      toCreatePendingState.current.createPendingTaskLinkedToAPITodoToUpdate,
      toCreatePendingState.current.createPendingTaskLinkedToAPITodo,
      toCreatePayloadState.current.createTaskToUpdatePayload,
    );

    console.log(
      toCreatePayloadState.current.createTaskToUpdatePayload,
      "task to update payload for api todo",
    );
  }

  function makePropertiesRequest() {
    //create batch todoToCreate
    makeTodoCreateRequest(toCreatePayloadState.current.createTodoPayload, toCreatePayloadState.current.pendingTodos);

    //create batch todoToDelete
    makeTodoDeleteRequest(pendingStateSync.current.pendingTodosToDelete);

    //create batch todoUpdate
    makeTodoUpdateRequest(
      toCreatePayloadState.current.createTodoToUpdatePayload,
      pendingStateSync.current.pendingTodoToUpdate,
    );

    //create batch taskToCreate
    makeTaskToCreateRequest(toCreatePayloadState.current.createTaskPayload, pendingStateSync.current.pendingTasks);

    //create batch taskToDelete
    makeTaskToDeleteRequest(pendingStateSync.current.pendingTasksToDelete);

    //create batch taskToUpdate
    makeTaskToUpdateRequest(
      toCreatePayloadState.current.createTaskToUpdatePayload,
      pendingStateSync.current.pendingTaskToUpdate,
    );

    //update ordering todo
    if (pendingStateSync.current.pendingTodoOrdering.length > 0) {
      setSyncState(c => c + 1)
      makeOrderingUpdateRequest(
        pendingStateSync.current.pendingTodoOrdering,
        "todo",
        updateTodoOrderingBatchCallback,
      );
    }

    //update ordering task
    if (pendingStateSync.current.pendingTaskOrdering.length > 0) {
      setSyncState(c => c += 1)
      makeOrderingUpdateRequest(
        pendingStateSync.current.pendingTaskOrdering,
        "task",
        updateTaskOrderingBatchCallBack,
      );
    }
  }

  function makeTodoCreateRequest(createTodoPayload, pendingTodos) {
    //create batch todoToCreate
    if (createTodoPayload.payload.length > 0) {
      const createTodoPayloadLength = createTodoPayload.payload.length;

      if (createTodoPayloadLength > 1) {
        makeBatchRequest(
          API.APIEnum.TODO.BATCH_CREATE,
          batchRequestWrapper(
            createTodoPayload.payload,
            "batch_create",
          ),
          pendingTodos,
          "createBatchTodo",
          createTodoBatchCallBack.bind(this, createTodoPayload.ids),
          "POST",
          true,
        );
        setSyncState(c => c += 1)
      }

      if (createTodoPayloadLength == 1) {
        makeBatchRequest(
          API.APIEnum.TODO.CREATE,
          createTodoPayload.payload[0],
          pendingTodos,
          "createTodo",
          createTodoBatchCallBack.bind(this, createTodoPayload.ids),
          "POST",
          true,
        );
        setSyncState(c => c += 1)
      }
    }
  }

  function makeTodoDeleteRequest(pendingTodosToDelete) {
    //create batch todoToDelete
    if (pendingTodosToDelete.length > 0) {
      const todosToDeleteLength = pendingTodosToDelete.length;

      //if todo doesn't exist in API it should return a NOT FOUND so no need to keep track of type of todo
      if (todosToDeleteLength > 1) {
        makeBatchRequest(
          API.APIEnum.TODO.BATCH_DELETE,
          batchRequestWrapper(pendingTodosToDelete, "batch_delete"),
          pendingTodosToDelete,
          "deleteTodoBatch",
          deleteTodoBatchCallBack.bind(this, pendingTodosToDelete),
          "DELETE",
          true,
        );
        setSyncState(c => c += 1)
      }

      if (todosToDeleteLength == 1) {
        makeBatchRequest(
          API.APIEnum.TODO.DELETE(pendingTodosToDelete[0]),
          pendingTodosToDelete[0],
          pendingTodosToDelete,
          "deleteTodo",
          deleteTodoBatchCallBack.bind(this, pendingTodosToDelete[0]),
          "DELETE",
          true,
        );
        setSyncState(c => c += 1)
      }
    }
  }

  function makeTodoUpdateRequest(createTodoToUpdatePayload, pendingTodoToUpdate) {
    //create batch todoUpdate
    if (createTodoToUpdatePayload.payload.length > 0) {
      const todosToUpdateLength = createTodoToUpdatePayload.payload.length;

      if (todosToUpdateLength > 1) {
        makeBatchRequest(
          API.APIEnum.TODO.BATCH_UPDATE,
          batchRequestWrapper(
            createTodoToUpdatePayload.payload,
            "batch_update",
          ),
          pendingTodoToUpdate,
          "updateBatchTodo",
          updateTodoBatchCallBack.bind(
            this,
            createTodoToUpdatePayload.ids,
          ),
          "PATCH",
          true,
        );
        setSyncState(c => c += 1)
      }

      if (todosToUpdateLength == 1) {
        makeBatchRequest(
          API.APIEnum.TODO.PATCH(
            Number(createTodoToUpdatePayload.payload[0].id),
          ),
          createTodoToUpdatePayload.payload[0],
          pendingTodoToUpdate,
          "updateTodo",
          updateTodoBatchCallBack.bind(
            this,
            createTodoToUpdatePayload.ids,
          ),
          "PATCH",
          true,
        );
        setSyncState(c => c += 1)
      }
    }
  }

  function makeTaskToCreateRequest(createTasksPayload, pendingTasks) {
    //create batch taskToCreate
    if (createTasksPayload.payload.length > 0) {
      const tasksToCreateLength = createTasksPayload.payload.length;

      if (tasksToCreateLength > 1) {
        makeBatchRequest(
          API.APIEnum.TASK.BATCH_CREATE,
          batchRequestWrapper(
            createTasksPayload.payload,
            "batch_create",
          ),
          pendingTasks,
          "createBatchTask",
          createTaskBatchCallBack.bind(this, createTasksPayload.ids),
          "POST",
          true,
        );
        setSyncState(c => c += 1)
      }

      if (tasksToCreateLength == 1) {
        makeBatchRequest(
          API.APIEnum.TASK.CREATE,
          createTasksPayload.payload[0],
          pendingTasks,
          "createTask",
          createTaskBatchCallBack.bind(this, createTasksPayload.ids),
          "POST",
          true,
        );
        setSyncState(c => c += 1)
      }
    }
  }

  function makeTaskToDeleteRequest(pendingTasksToDelete) {
    //create batch taskToDelete
    if (pendingTasksToDelete.length > 0) {
      const tasksToDeleteLength = pendingTasksToDelete.length;

      const pendingTasksToDeletePayload = pendingTasksToDelete.map(
        (task) => task.taskId,
      );

      if (tasksToDeleteLength > 1) {
        makeBatchRequest(
          API.APIEnum.TASK.BATCH_DELETE,
          batchRequestWrapper(
            pendingTasksToDeletePayload,
            "batch_delete",
          ),
          pendingTasksToDelete,
          "deleteBatchTask",
          deleteTaskBatchCallBack.bind(this, pendingTasksToDelete),
          "DELETE",
          true,
        );
        setSyncState(c => c + 1)
      }

      if (tasksToDeleteLength == 1) {
        makeBatchRequest(
          API.APIEnum.TASK.DELETE(pendingTasksToDeletePayload[0]),
          pendingTasksToDeletePayload[0],
          pendingTasksToDelete,
          "deleteTask",
          deleteTaskBatchCallBack.bind(this, pendingTasksToDelete),
          "DELETE",
          true,
        );
        setSyncState(c => c += 1)
      }
    }
  }

  function makeTaskToUpdateRequest(createTaskToUpdatePayload, pendingTaskToUpdate) {
    //create batch taskToUpdate
    if (pendingTaskToUpdate.length > 0) {
      const taskToUpdateLength = createTaskToUpdatePayload.payload.length;

      if (taskToUpdateLength > 1) {
        makeBatchRequest(
          API.APIEnum.TASK.BATCH_UPDATE,
          batchRequestWrapper(
            createTaskToUpdatePayload.payload,
            "batch_update",
          ),
          pendingTaskToUpdate,
          "updateBatchTask",
          updateTaskBatchCallBack.bind(
            this,
            createTaskToUpdatePayload.ids,
          ),
          "PATCH",
          true,
        );
        setSyncState(c => c += 1)
      }

      if (taskToUpdateLength == 1) {
        makeBatchRequest(
          API.APIEnum.TASK.PATCH(createTaskToUpdatePayload.payload[0].id),
          createTaskToUpdatePayload.payload[0],
          pendingTaskToUpdate,
          "updateTask",
          updateTaskBatchCallBack.bind(
            this,
            createTaskToUpdatePayload.ids,
          ),
          "PATCH",
          true,
        );
        setSyncState(c => c += 1)
      }
    }
  }

  function getOrderingUrlFromType(orderingLength, orderingType, objId = undefined) {
    if (orderingLength > 1) {
      if (orderingType === "todo")
        return API.APIEnum.TODO.BATCH_UPDATE_ORDERING;
      if (orderingType === "task")
        return API.APIEnum.TASK.BATCH_UPDATE_ORDERING;
    }
    if (orderingLength === 1) {
      if (orderingType === "todo") return API.APIEnum.TODO.PATCH(objId);
      if (orderingType === "task") return API.APIEnum.TASK.PATCH(objId);
    }
  }

  function makeOrderingUpdateRequest(orderingPayload, type, orderingCallBack) {
    if (orderingPayload.length > 1) {
      makeBatchRequest(
        getOrderingUrlFromType(orderingPayload.length, type),
        batchRequestWrapper(orderingPayload, "batch_update_ordering"),
        null,
        "updateOrdering",
        orderingCallBack,
        "PATCH",
        true,
      );
    }

    if (orderingPayload.length === 1) {
      makeBatchRequest(
        getOrderingUrlFromType(
          orderingPayload.length,
          type,
          orderingPayload[0].id,
        ),
        orderingPayload,
        null,
        "updateOrdering",
        orderingCallBack,
        "PATCH",
        true,
      );
    }
  }

  function formatBatchCreatedReturnData(returnData, objType) {
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

  function createTodoBatchCallBack(payloadIds, returnData, requestStatus) {

    if (requestStatus) {
      const formattedReturnedData = formatBatchCreatedReturnData(
        returnData,
        "todo",
      );

      payloadIds.forEach((payloadId, i) => {
        let todo = modelState.todo.find(
          (todoId) => todoId.todoId === payloadId,
        );

        if (todo) todo = formattedReturnedData[i];

        if (pendingStateSync.current.pendingTodoOrdering.length > 0) {
          const todoOrderingIdUpdateIfCreatedByFallback =
            pendingStateSync.current.pendingTodoOrdering.find(
              (todoOrder) => todoOrder.id === payloadId,
            );
          if (todoOrderingIdUpdateIfCreatedByFallback)
            todoOrderingIdUpdateIfCreatedByFallback.id = todo.todoId;
        }
      });
      //clear the data from the diff
      diffLocal.todoToCreate = [];
    }
    setSyncState(c => c -= 1);
    completeSyncAndLoadData();
  }

  function deleteTodoBatchCallBack(syncState, requestStatus) {
    if (requestStatus) diffLocal.todoToDelete = [];
    setSyncState(c => c -= 1);
    completeSyncAndLoadData();
  }

  function updateTodoBatchCallBack(syncState, requestStatus) {
    if (requestStatus) diffLocal.todoToUpdate = [];
    setSyncState(c => c -= 1);
    completeSyncAndLoadData();
  }

  function updateTodoOrderingBatchCallback(syncState) {
    if (requestStatus) diffLocal.todoOrdering = [];
    setSyncState(c => c -= 1);
    completeSyncAndLoadData();
  }

  function createTaskBatchCallBack(syncState, requestStatus) {

    if (requestStatus) {
      const formattedReturnedData = formatBatchCreatedReturnData(
        returnData,
        "task",
      );

      payloadIds.forEach((payloadId, i) => {
        let task = filterToGetTaskBody(
          payloadId.taskId,
          payloadId.todoId,
          false,
        );

        if (task) task = formattedReturnedData[i];

        if (pendingStateSync.current.pendingTaskOrdering.length > 0) {
          const taskOrderingIdUpdateIfCreatedByFallback =
            pendingStateSync.current.pendingTaskOrdering.find(
              (taskOrder) => taskOrder.id === payloadId.taskId,
            );
          if (taskOrderingIdUpdateIfCreatedByFallback)
            taskOrderingIdUpdateIfCreatedByFallback.id = task.taskId;
        }
      });
      //clear the data from the diff
      diffLocal.taskToCreate = [];
    }
    setSyncState(c => c -= 1);
    completeSyncAndLoadData();
  }

  function deleteTaskBatchCallBack(syncState, requestStatus) {

    if (requestStatus) diffLocal.taskToDelete = [];
    setSyncState(c => c -= 1);
    completeSyncAndLoadData();
  }

  function updateTaskBatchCallBack(psyncState, requestStatus) {

    if (requestStatus) diffLocal.taskToUpdate = [];
    setSyncState(c => c -= 1);
    completeSyncAndLoadData();
  }

  function updateTaskOrderingBatchCallBack(syncState) {
    if (requestStatus) diffLocal.taskOrdering = [];
    setSyncState(c => c -= 1);
    completeSyncAndLoadData();
  }

  function filterDeletedObjectsFromObjects(syncState,
    deletedObjectParent,
    returnList,
    objectType,
  ) {
    if (object.length > 0) {
      const deletedObjectsExists = deletedObjects.length > 0;
      if (deletedObjectsExists) {
        object.forEach((obj) => {
          const deletedObjectExistsInObject = deletedObjects.some(
            (deletedObjId) =>
              returnDeleteObjId(objectType, deletedObjId) ===
              returnObjType(objectType, obj),
          );
          if (!deletedObjectExistsInObject) returnList.push(obj);
        });
      }
      if (!deletedObjectsExists) returnList.push(...object); // && objectType === "todo"

      if (objectType === "task" && returnList.length > 0) {
        for (let i = returnList.length - 1; i > -1; i--) {
          const taskTodoIdInTodoToDeleteExists = deletedObjectParent.some(
            (objId) => objId === returnList[i].todoId,
          );

          if (taskTodoIdInTodoToDeleteExists) returnList.splice(i, 1);
        }
      }
    }
  }

  function createTodoPayload(
    todoToCreateDiffArray,
    todoToCreateFilteredArray,
    todoToCreatePayloadArray,
  ) {
    //create todo payload
    if (
      todoToCreateDiffArray.length > 0 &&
      todoToCreateFilteredArray.length > 0
    )
      todoToCreateFilteredArray.forEach((todo) => {
        //get todo from modelState
        const modelTodos = modelState.todo;
        const todoModelIndex = modelState.todo.findIndex(
          (modelTodo) => modelTodo.todoId === todo.todoId,
        );

        const todoBody = cloneDeep(modelTodos[todoModelIndex]);

        todoToCreatePayloadArray.ids.push(todoBody.todoId);
        //remove ids from todo and tasks
        delete todoBody.todoId;
        console.log("the todo body", todoBody);
        if (todoBody.tasks?.length > 0)
          todoBody.tasks.forEach((task) => delete task.taskId);
        //add formatted data to todos to create
        const formattedTodoBody = formatAPIRequestBody(todoBody, "todo");
        todoToCreatePayloadArray["payload"].push(formattedTodoBody);
      });
    else {
      diffLocal.todoToCreate = [];
    }
  }

  function createTodoUpdatePayload(
    todoToUpdateDiffArray,
    todoToUpdateFilteredArray,
    todoToCreateFilteredArray,
    todoToUpdatePayloadArray,
  ) {
    debugger;
    //create todo to update payload
    if (
      todoToUpdateDiffArray.length > 0 &&
      todoToUpdateFilteredArray.length > 0
    )
      todoToUpdateFilteredArray.forEach((todo) => {
        const todoToUpdateExistsInTodoToCreate =
          todoToCreateFilteredArray.some(
            (pendingTodo) => pendingTodo.todoId === todo.todoId,
          );

        if (!todoToUpdateExistsInTodoToCreate)
          todoToUpdatePayloadArray.payload.push(
            formatAPIRequestBody(todo, "todo", "update"),
          );
        todoToUpdatePayloadArray.ids.push(todo.todoId);
      });
    else {
      diffLocal.todoToUpdate = [];
    }
  }

  function filterPendingTaskLinkedToAPITodo(
    tasksToCreateDiffArray,
    tasksToCreateFilteredArray,
    todoToCreateFilteredArray,
    pendingTaskLinkedToAPITodoArray,
  ) {
    //sort tasks which are not linked to todos to create
    if (
      tasksToCreateDiffArray.length > 0 &&
      tasksToCreateFilteredArray.length > 0
    )
      tasksToCreateFilteredArray.forEach((task) => {
        const pendingTaskTodoExistsInPendingTodos =
          todoToCreateFilteredArray.some(
            (todo) => todo.todoId === task.todoId,
          );

        if (!pendingTaskTodoExistsInPendingTodos)
          pendingTaskLinkedToAPITodoArray.push(task);
      });
  }

  function createTaskLinkedToAPITodoBody(
    taskToCreateDiffArray,
    pendingTaskLinkedToAPITodoArray,
    taskToCreatePayloadArray,
  ) {
    //task not linked to todos to create payload body
    if (
      taskToCreateDiffArray.length > 0 &&
      pendingTaskLinkedToAPITodoArray.length > 0
    )
      pendingTaskLinkedToAPITodoArray.forEach((task) => {
        const taskBody = filterToGetTaskBody(task.taskId, task.todoId);

        taskToCreatePayloadArray.ids.push({
          taskId: task.taskId,
          todoId: task.todoId,
        });

        //add todoId to taskBody
        taskBody.todoId = task.todoId;
        //remove id from task
        delete taskBody.taskId;
        //add formatted data to tasks to create
        taskToCreatePayloadArray.payload.push(
          formatAPIRequestBody(taskBody, "task", "create"),
        );
      });
    else {
      diffLocal.taskToCreate = [];
    }
  }

  function createTaskToUpdateBody(
    taskToUpdateDiffArray,
    pendingTaskLinkedToAPITodoToUpdate,
    pendingTaskLinkedToAPITodo,
    taskToUpdatePayloadArray,
  ) {
    //sort tasks which are to be updated not in createPendingTaskLinkedToAPITodo Array
    if (
      taskToUpdateDiffArray.length > 0 &&
      pendingTaskLinkedToAPITodoToUpdate.length > 0
    )
      pendingTaskLinkedToAPITodoToUpdate.forEach((task) => {
        // const taskToUpdateExists
        const taskToUpdateExistsInTaskAPITodo =
          pendingTaskLinkedToAPITodo.some(
            (APITodoTask) => APITodoTask.taskId === task.taskId,
          );

        if (!taskToUpdateExistsInTaskAPITodo) {
          const taskBody = filterToGetTaskBody(
            task.taskId,
            task.todoId,
          );
          // taskBody.todoId = task.todoId
          taskToUpdatePayloadArray.ids.push({
            taskId: task.taskId,
            todoId: task.todoId,
          });

          //add the time added to the taskBody
          taskBody.todoLastAdded = task.todoLastAdded;
          //remove id from task
          // delete taskBody.taskId
          taskToUpdatePayloadArray.payload.push(
            formatAPIRequestBody(taskBody, "task", "update"),
          );
        }
      });
    else {
      diffLocal.taskToUpdate = [];
    }
  }

  function filterToGetTaskBody(taskId, todoId, clone = true) {
    //get todo from modelState
    const modelTodos = modelState.todo;
    const todoModelIndex = modelState.todo.findIndex(
      (modelTodo) => modelTodo.todoId === todoId,
    );
    const taskIndex = modelTodos[todoModelIndex].tasks.findIndex(
      (modelTask) => modelTask.taskId === taskId,
    );
    if (!clone) return modelTodos[todoModelIndex].tasks[taskIndex];

    const taskBody = cloneDeep(modelTodos[todoModelIndex].tasks[taskIndex]);
    return taskBody;
  }

  function makeBatchRequest(
    requestURL,
    requestPayload,
    requestDiffArray,
    requestActionType,
    requestCallBack,
    requestType,
    requestCallBackParam = false,
  ) {
    const queryObj = {
      endpoint: requestURL,
      token: token.value,
      sec: 5,
      actionType: requestActionType,
      queryData: requestPayload,
      callBack: requestCallBack.bind(this),
      spinner: false,
      alert: false,
      type: requestType,
      callBackParam: requestCallBackParam,
    };
    API.queryAPI(queryObj);
  }

  function wrapper(wrapperName, requestBody) {
    const wrapper = {};
    wrapper[wrapperName] = requestBody;

    return wrapper;
  }

  function batchRequestWrapper(requestBody, requestType) {
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

  updateAndGetToken() { }

  function returnObjType(objType, obj) {
    if (objType === "todo") return obj.todoId;
    if (objType === "task") return obj.taskId;
  }

  function returnDeleteObjId(objType, deleteObj) {
    if (objType === "todo") return deleteObj;
    if (objType === "task") return deleteObj.taskId;
  }

  function createLoader() {
    toastRef.current = toast
  }

  function removeLoader() {
    if (toastRef.current) toastRef.current.remove();
    toastRef.current = null
  }
}
