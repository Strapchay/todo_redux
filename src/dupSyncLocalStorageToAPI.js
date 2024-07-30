import { formatAPIRequestBody, formatAPIResponseBody } from "./helpers.js";
import { API } from "./api.js";
import { cloneDeep } from "lodash";
import { APICreateDiffTodo } from "./slices/todo/diffSlice.js";

class SyncLocalStorageToAPI {
  _diffState;
  _toCreatePendingState;
  _toCreatePayloadState;
  _token;
  _getModelState;
  _request;
  _completeSync;

  constructor(diffState, getModelState, dispatcher, completeSync) {
    this._diffState = diffState;
    this._getModelState = getModelState;
    this._request = dispatcher;
    this._completeSync = completeSync;
    this._toCreatePendingState = {
      createPendingTodos: [],
      createPendingTodosToUpdate: [],
      createPendingTasks: [],
      createPendingTasksToUpdate: [],
      createPendingTaskLinkedToAPITodo: [],
      createPendingTaskLinkedToAPITodoToUpdate: [],
    };
    this._toCreatePayloadState = {
      createTodoPayload: { payload: [], ids: [] },
      createTaskPayload: { payload: [], ids: [] },
      createTodoToUpdatePayload: { payload: [], ids: [] },
      createTaskToUpdatePayload: { payload: [], ids: [] },
    };
  }

  handleStartSync() {
    this._filterProperties();

    this._createPropertiesPayload();

    this._makePropertiesRequest();

    this._completeSync();

    // //try to complete sync if no data is to be synced after request
    // this._completeSyncAndLoadData();
    // console.log(this._syncState);
  }

  _filterProperties() {
    //todo to create passes deleted check
    this._filterDeletedObjectsFromObjects(
      this._diffState.pendingTodos,
      this._diffState.pendingTodosToDelete,
      null,
      this._toCreatePendingState.createPendingTodos,
      "todo",
    );

    //todo to update passes deleted check
    // this._filterDeletedObjectsFromObjects(
    //   this.pendingTodoToUpdate,
    //   this.pendingTodosToDelete,
    //   null,
    //   this.createPendingTodosToUpdate,
    //   "todo",
    // );

    // //task to create passes deleted check
    // this._filterDeletedObjectsFromObjects(
    //   this.pendingTasks,
    //   this.pendingTasksToDelete,
    //   this.pendingTodosToDelete,
    //   this.createPendingTasks,
    //   "task",
    // );

    // //task to update passes deleted check
    // this._filterDeletedObjectsFromObjects(
    //   this.pendingTaskToUpdate,
    //   this.pendingTasksToDelete,
    //   this.pendingTodosToDelete,
    //   this.createPendingTasksToUpdate,
    //   "task",
    // );
  }

  _createPropertiesPayload() {
    //create todo payload
    this._createTodoPayload(
      this._diffState.pendingTodos,
      this._toCreatePendingState.createPendingTodos,
      this._toCreatePayloadState.createTodoPayload,
    );

    //create todo to update payload
    this._createTodoUpdatePayload(
      this._diffState.pendingTodoToUpdate,
      this._toCreatePendingState.createPendingTodosToUpdate,
      this._toCreatePendingState.createPendingTodos,
      this._toCreatePayloadState.createTodoToUpdatePayload,
    );

    console.log(
      "the created todo to update payload",
      this._toCreatePayloadState,
    );

    //sort tasks which are not linked to todos to create
    this._filterPendingTaskLinkedToAPITodo(
      this._diffState.pendingTasks,
      this._toCreatePendingState.createPendingTasks,
      this._toCreatePendingState.createPendingTodos,
      this._toCreatePendingState.createPendingTaskLinkedToAPITodo,
    );
    // console.log(
    //   "the filtered pending tasks linked to api todo",
    //   this.createPendingTaskLinkedToAPITodo,
    // );

    // //sort tasks which are not linked to todos to update
    this._filterPendingTaskLinkedToAPITodo(
      this._diffState.pendingTaskToUpdate,
      this._toCreatePendingState.createPendingTasksToUpdate,
      this._toCreatePendingState.createPendingTodos,
      this._toCreatePendingState.createPendingTaskLinkedToAPITodoToUpdate,
    );

    // console.log(
    //   "the filtered pending tasks to update linked to api todo",
    //   this.createPendingTaskLinkedToAPITodoToUpdate,
    // );

    // //task not linked to todos to create payload body
    this._createTaskLinkedToAPITodoBody(
      this._diffState.pendingTasks,
      this._toCreatePendingState.createPendingTaskLinkedToAPITodo,
      this._toCreatePayloadState.createTaskPayload,
    );

    // console.log(this.createTaskPayload, "task to create payload for api todo ");

    // //sort tasks which are to be updated not in createPendingTaskLinkedToAPITodo Array
    this._createTaskToUpdateBody(
      this._diffState.pendingTaskToUpdate,
      this._toCreatePendingState.createPendingTaskLinkedToAPITodoToUpdate,
      this._toCreatePendingState.createPendingTaskLinkedToAPITodo,
      this._toCreatePayloadState.createTaskToUpdatePayload,
    );

    // console.log(
    //   this.createTaskToUpdatePayload,
    //   "task to update payload for api todo",
    // );
  }

  _makePropertiesRequest() {
    //create batch todoToCreate
    this._makeTodoCreateRequest(
      this._toCreatePayloadState.createTodoPayload,
      this._diffState.pendingTodos,
    );

    //create batch todoToDelete
    console.log(
      "the todos being deltetd",
      this._diffState.pendingTodosToDelete,
    );
    this._makeTodoDeleteRequest(this._diffState.pendingTodosToDelete);

    // //create batch todoUpdate
    // this._makeTodoUpdateRequest(
    //   this.createTodoToUpdatePayload,
    //   this.pendingTodoToUpdate,
    // );

    // //create batch taskToCreate
    // this._makeTaskToCreateRequest(this.createTaskPayload, this.pendingTasks);

    // //create batch taskToDelete
    // this._makeTaskToDeleteRequest(this.pendingTasksToDelete);

    // //create batch taskToUpdate
    // this._makeTaskToUpdateRequest(
    //   this.createTaskToUpdatePayload,
    //   this.pendingTaskToUpdate,
    // );

    // //update ordering todo
    // if (this.pendingTodoOrdering.length > 0) {
    //   this._syncState.count += 1;
    //   this._makeOrderingUpdateRequest(
    //     this.pendingTodoOrdering,
    //     "todo",
    //     this._updateTodoOrderingBatchCallback,
    //   );
    // }

    // //update ordering task
    // if (this.pendingTaskOrdering.length > 0) {
    //   this._syncState.count += 1;
    //   this._makeOrderingUpdateRequest(
    //     this.pendingTaskOrdering,
    //     "task",
    //     this._updateTaskOrderingBatchCallBack,
    //   );
    // }
  }

  _makeTodoCreateRequest(createTodoPayload, pendingTodos) {
    //create batch todoToCreate
    if (createTodoPayload.payload.length > 0) {
      const pendingState = this._diffState;
      this._request(
        { createTodoPayload, pendingTodos, pendingState },
        "APICreateDiffTodo",
      );
    }
  }

  _makeTodoDeleteRequest(pendingTodosToDelete) {
    //create batch todoToDelete
    if (pendingTodosToDelete.length > 0)
      this._request({ pendingTodosToDelete }, "APIDeleteDiffTodo");
  }

  _makeTodoUpdateRequest(createTodoToUpdatePayload, pendingTodoToUpdate) {
    //create batch todoUpdate
    if (createTodoToUpdatePayload.payload.length > 0) {
      const todosToUpdateLength = createTodoToUpdatePayload.payload.length;

      if (todosToUpdateLength > 1) {
        this._makeBatchRequest(
          API.APIEnum.TODO.BATCH_UPDATE,
          this._batchRequestWrapper(
            createTodoToUpdatePayload.payload,
            "batch_update",
          ),
          pendingTodoToUpdate,
          "updateBatchTodo",
          this._updateTodoBatchCallBack.bind(
            this,
            createTodoToUpdatePayload.ids,
          ),
          "PATCH",
          true,
        );
        this._syncState.count += 1;
      }

      if (todosToUpdateLength == 1) {
        this._makeBatchRequest(
          API.APIEnum.TODO.PATCH(
            Number(createTodoToUpdatePayload.payload[0].id),
          ),
          createTodoToUpdatePayload.payload[0],
          pendingTodoToUpdate,
          "updateTodo",
          this._updateTodoBatchCallBack.bind(
            this,
            createTodoToUpdatePayload.ids,
          ),
          "PATCH",
          true,
        );
        this._syncState.count += 1;
      }
    }
  }

  _makeTaskToCreateRequest(createTasksPayload, pendingTasks) {
    //create batch taskToCreate
    if (createTasksPayload.payload.length > 0) {
      const tasksToCreateLength = createTasksPayload.payload.length;

      if (tasksToCreateLength > 1) {
        this._makeBatchRequest(
          API.APIEnum.TASK.BATCH_CREATE,
          this._batchRequestWrapper(createTasksPayload.payload, "batch_create"),
          pendingTasks,
          "createBatchTask",
          this._createTaskBatchCallBack.bind(this, createTasksPayload.ids),
          "POST",
          true,
        );
        this._syncState.count += 1;
      }

      if (tasksToCreateLength == 1) {
        this._makeBatchRequest(
          API.APIEnum.TASK.CREATE,
          createTasksPayload.payload[0],
          pendingTasks,
          "createTask",
          this._createTaskBatchCallBack.bind(this, createTasksPayload.ids),
          "POST",
          true,
        );
        this._syncState.count += 1;
      }
    }
  }

  _makeTaskToDeleteRequest(pendingTasksToDelete) {
    //create batch taskToDelete
    if (pendingTasksToDelete.length > 0) {
      const tasksToDeleteLength = pendingTasksToDelete.length;

      const pendingTasksToDeletePayload = pendingTasksToDelete.map(
        (task) => task.taskId,
      );

      if (tasksToDeleteLength > 1) {
        this._makeBatchRequest(
          API.APIEnum.TASK.BATCH_DELETE,
          this._batchRequestWrapper(
            pendingTasksToDeletePayload,
            "batch_delete",
          ),
          pendingTasksToDelete,
          "deleteBatchTask",
          this._deleteTaskBatchCallBack.bind(this, pendingTasksToDelete),
          "DELETE",
          true,
        );
        this._syncState.count += 1;
      }

      if (tasksToDeleteLength == 1) {
        this._makeBatchRequest(
          API.APIEnum.TASK.DELETE(pendingTasksToDeletePayload[0]),
          pendingTasksToDeletePayload[0],
          pendingTasksToDelete,
          "deleteTask",
          this._deleteTaskBatchCallBack.bind(this, pendingTasksToDelete),
          "DELETE",
          true,
        );
        this._syncState.count += 1;
      }
    }
  }

  _makeTaskToUpdateRequest(createTaskToUpdatePayload, pendingTaskToUpdate) {
    //create batch taskToUpdate
    if (pendingTaskToUpdate.length > 0) {
      const taskToUpdateLength = createTaskToUpdatePayload.payload.length;

      if (taskToUpdateLength > 1) {
        this._makeBatchRequest(
          API.APIEnum.TASK.BATCH_UPDATE,
          this._batchRequestWrapper(
            createTaskToUpdatePayload.payload,
            "batch_update",
          ),
          pendingTaskToUpdate,
          "updateBatchTask",
          this._updateTaskBatchCallBack.bind(
            this,
            createTaskToUpdatePayload.ids,
          ),
          "PATCH",
          true,
        );
        this._syncState.count += 1;
      }

      if (taskToUpdateLength == 1) {
        this._makeBatchRequest(
          API.APIEnum.TASK.PATCH(createTaskToUpdatePayload.payload[0].id),
          createTaskToUpdatePayload.payload[0],
          pendingTaskToUpdate,
          "updateTask",
          this._updateTaskBatchCallBack.bind(
            this,
            createTaskToUpdatePayload.ids,
          ),
          "PATCH",
          true,
        );
        this._syncState.count += 1;
      }
    }
  }

  _getOrderingUrlFromType(orderingLength, orderingType, objId = undefined) {
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

  _makeOrderingUpdateRequest(orderingPayload, type, orderingCallBack) {
    if (orderingPayload.length > 1) {
      this._makeBatchRequest(
        this._getOrderingUrlFromType(orderingPayload.length, type),
        this._batchRequestWrapper(orderingPayload, "batch_update_ordering"),
        null,
        "updateOrdering",
        orderingCallBack,
        "PATCH",
        true,
      );
    }

    if (orderingPayload.length === 1) {
      this._makeBatchRequest(
        this._getOrderingUrlFromType(
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

  _formatBatchCreatedReturnData(returnData, objType) {
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

  _createTodoBatchCallBack(payloadIds, returnData, requestStatus) {
    if (requestStatus) {
      const formattedReturnedData = this._formatBatchCreatedReturnData(
        returnData,
        "todo",
      );
      const modelTodos = this._getModelState().todo;

      payloadIds.forEach((payloadId, i) => {
        let todo = modelTodos.find((todoId) => todoId.todoId === payloadId);

        if (todo) todo = formattedReturnedData[i];

        if (this.pendingTodoOrdering.length > 0) {
          const todoOrderingIdUpdateIfCreatedByFallback =
            this.pendingTodoOrdering.find(
              (todoOrder) => todoOrder.id === payloadId,
            );
          if (todoOrderingIdUpdateIfCreatedByFallback)
            todoOrderingIdUpdateIfCreatedByFallback.id = todo.todoId;
        }
      });
      //clear the data from the diff
      this._diffState.todoToCreate = [];
    }
    this._syncState.count -= 1;
    this._completeSyncAndLoadData();
  }
  _deleteTodoBatchCallBack(deletePayload, returnData, requestStatus) {
    if (requestStatus) this._diffState.todoToDelete = [];
    this._syncState.count -= 1;
    this._completeSyncAndLoadData();
  }

  _updateTodoBatchCallBack(payloadIds, returnData, requestStatus) {
    if (requestStatus) this._diffState.todoToUpdate = [];
    this._syncState.count -= 1;
    this._completeSyncAndLoadData();
  }

  _updateTodoOrderingBatchCallback(returnData, requestStatus) {
    if (requestStatus) this._diffState.todoOrdering = [];
    this._syncState.count -= 1;
    this._completeSyncAndLoadData();
  }

  _createTaskBatchCallBack(payloadIds, returnData, requestStatus) {
    if (requestStatus) {
      const formattedReturnedData = this._formatBatchCreatedReturnData(
        returnData,
        "task",
      );

      payloadIds.forEach((payloadId, i) => {
        let task = this._filterToGetTaskBody(
          payloadId.taskId,
          payloadId.todoId,
          false,
        );

        if (task) task = formattedReturnedData[i];

        if (this.pendingTaskOrdering.length > 0) {
          const taskOrderingIdUpdateIfCreatedByFallback =
            this.pendingTaskOrdering.find(
              (taskOrder) => taskOrder.id === payloadId.taskId,
            );
          if (taskOrderingIdUpdateIfCreatedByFallback)
            taskOrderingIdUpdateIfCreatedByFallback.id = task.taskId;
        }
      });
      //clear the data from the diff
      this._diffState.taskToCreate = [];
    }
    this._syncState.count -= 1;
    this._completeSyncAndLoadData();
  }

  _deleteTaskBatchCallBack(payloadIds, returnData, requestStatus) {
    if (requestStatus) this._diffState.taskToDelete = [];
    this._syncState.count -= 1;
    this._completeSyncAndLoadData();
  }

  _updateTaskBatchCallBack(payloadIds, returnData, requestStatus) {
    if (requestStatus) this._diffState.taskToUpdate = [];
    this._syncState.count -= 1;
    this._completeSyncAndLoadData();
  }

  _updateTaskOrderingBatchCallBack(returnData, requestStatus) {
    if (requestStatus) this._diffState.taskOrdering = [];
    this._syncState.count -= 1;
    this._completeSyncAndLoadData();
  }

  _filterDeletedObjectsFromObjects(
    object,
    deletedObjects,
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
              this._returnDeleteObjId(objectType, deletedObjId) ===
              this._returnObjType(objectType, obj),
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

  _createTodoPayload(
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
        const modelTodos = this._getModelState()?.todo;
        const todoModelIndex = modelTodos.findIndex(
          (modelTodo) => modelTodo.todoId === todo,
        );
        const todoBody = cloneDeep(modelTodos[todoModelIndex]);

        todoToCreatePayloadArray.ids.push(todoBody.todoId);
        //remove ids from todo and tasks
        delete todoBody.todoId;
        if (todoBody.tasks?.length > 0)
          todoBody.tasks.forEach((task) => delete task.taskId);
        //add formatted data to todos to create
        const formattedTodoBody = formatAPIRequestBody(todoBody, "todo");
        todoToCreatePayloadArray["payload"].push(formattedTodoBody);
      });
    else {
      this._diffState.todoToCreate = [];
    }
  }

  _createTodoUpdatePayload(
    todoToUpdateDiffArray,
    todoToUpdateFilteredArray,
    todoToCreateFilteredArray,
    todoToUpdatePayloadArray,
  ) {
    //create todo to update payload
    if (
      todoToUpdateDiffArray.length > 0 &&
      todoToUpdateFilteredArray.length > 0
    )
      todoToUpdateFilteredArray.forEach((todo) => {
        const todoToUpdateExistsInTodoToCreate = todoToCreateFilteredArray.some(
          (pendingTodo) => pendingTodo.todoId === todo.todoId,
        );

        if (!todoToUpdateExistsInTodoToCreate)
          todoToUpdatePayloadArray.payload.push(
            formatAPIRequestBody(todo, "todo", "update"),
          );
        todoToUpdatePayloadArray.ids.push(todo.todoId);
      });
    else {
      console.log("triggered the else block");
      // this._diffState.todoToUpdate = [];
    }
  }

  _filterPendingTaskLinkedToAPITodo(
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
          todoToCreateFilteredArray.some((todo) => todo.todoId === task.todoId);

        if (!pendingTaskTodoExistsInPendingTodos)
          pendingTaskLinkedToAPITodoArray.push(task);
      });
  }

  _createTaskLinkedToAPITodoBody(
    taskToCreateDiffArray,
    pendingTaskLinkedToAPITodoArray,
    taskToCreatePayloadArray,
  ) {
    //task not linked to todos to create payload body
    if (
      taskToCreateDiffArray?.length > 0 &&
      pendingTaskLinkedToAPITodoArray.length > 0
    )
      pendingTaskLinkedToAPITodoArray.forEach((task) => {
        const taskBody = this._filterToGetTaskBody(task.taskId, task.todoId);

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
      console.log("the diffstate tasktocreate state");
      // this._diffState.taskToCreate = [];
    }
  }

  _createTaskToUpdateBody(
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
        const taskToUpdateExistsInTaskAPITodo = pendingTaskLinkedToAPITodo.some(
          (APITodoTask) => APITodoTask.taskId === task.taskId,
        );

        if (!taskToUpdateExistsInTaskAPITodo) {
          const taskBody = this._filterToGetTaskBody(task.taskId, task.todoId);
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
      this._diffState.taskToUpdate = [];
    }
  }

  _filterToGetTaskBody(taskId, todoId, clone = true) {
    //get todo from modelState
    const modelTodos = this._getModelState()?.todo;
    const todoModelIndex = modelTodos.findIndex(
      (modelTodo) => modelTodo.todoId === todoId,
    );
    const taskIndex = modelTodos[todoModelIndex].tasks.findIndex(
      (modelTask) => modelTask.taskId === taskId,
    );
    if (!clone) return modelTodos[todoModelIndex].tasks[taskIndex];

    const taskBody = cloneDeep(modelTodos[todoModelIndex].tasks[taskIndex]);
    return taskBody;
  }

  _makeBatchRequest(
    requestURL,
    requestPayload,
    requestDiffArray,
    requestActionType,
    requestCallBack,
    requestType,
    requestCallBackParam = false,
  ) {
    console.log(this);
    console.log(this._token);
    const queryObj = {
      endpoint: requestURL,
      token: this._token.value,
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

  _wrapper(wrapperName, requestBody) {
    const wrapper = {};
    wrapper[wrapperName] = requestBody;

    return wrapper;
  }

  _batchRequestWrapper(requestBody, requestType) {
    if (requestType === "batch_update") {
      return this._wrapper("update_list", requestBody);
    }

    if (requestType === "batch_update_ordering") {
      return this._wrapper("ordering_list", requestBody);
    }

    if (requestType === "batch_create") {
      return this._wrapper("create_list", requestBody);
    }

    if (requestType === "batch_delete") {
      return this._wrapper("delete_list", requestBody);
    }
  }

  updateAndGetToken() {}

  _returnObjType(objType, obj) {
    if (objType === "todo") return obj.todoId;
    if (objType === "task") return obj.taskId;
  }

  _returnDeleteObjId(objType, deleteObj) {
    if (objType === "todo") return deleteObj;
    if (objType === "task") return deleteObj.taskId;
  }
}

export default SyncLocalStorageToAPI;
