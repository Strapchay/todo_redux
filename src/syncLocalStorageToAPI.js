import {
  filterToGetTaskBody,
  formatAPIRequestBody,
  formatAPIResponseBody,
} from "./helpers.js";
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
  _syncState = 0;

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

  _handleSetSyncState(type) {
    if (type === "add") this._syncState += 1;
    if (type === "remove") this._syncState -= 1;
  }

  handleStartSync() {
    this._filterProperties();
    this._createPropertiesPayload();
    this._makePropertiesRequest();
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
    this._filterDeletedObjectsFromObjects(
      this._diffState.pendingTodoToUpdate,
      this._diffState.pendingTodosToDelete,
      null,
      this._toCreatePendingState.createPendingTodosToUpdate,
      "todo",
    );

    //task to create passes deleted check
    this._filterDeletedObjectsFromObjects(
      this._diffState.pendingTasks,
      this._diffState.pendingTasksToDelete,
      this._diffState.pendingTodosToDelete,
      this._toCreatePendingState.createPendingTasks,
      "task",
    );

    //task to update passes deleted check
    this._filterDeletedObjectsFromObjects(
      this._diffState.pendingTaskToUpdate,
      this._diffState.pendingTasksToDelete,
      this._diffState.pendingTodosToDelete,
      this._toCreatePendingState.createPendingTasksToUpdate,
      "task",
    );

    //filter and remove pending tasks that are to be created in create todo from tasks to be created
    // this._refilterTasksToCreateAndUpdate(todoToCreatePayload, taskToCreatePayload, taskToUpdatePayload)
  }

  _createPropertiesPayload() {
    //create todo payload
    this._createTodoPayload(
      this._diffState.pendingTodos,
      this._toCreatePendingState.createPendingTodos,
      this._toCreatePayloadState.createTodoPayload,
      this._to,
    );

    //create todo to update payload
    this._createTodoUpdatePayload(
      this._diffState.pendingTodoToUpdate,
      this._toCreatePendingState.createPendingTodosToUpdate,
      this._toCreatePendingState.createPendingTodos,
      this._toCreatePayloadState.createTodoToUpdatePayload,
    );

    //sort tasks which are not linked to todos to create
    this._filterPendingTaskLinkedToAPITodo(
      this._diffState.pendingTasks,
      this._toCreatePendingState.createPendingTasks,
      this._toCreatePendingState.createPendingTodos,
      this._toCreatePendingState.createPendingTaskLinkedToAPITodo,
    );

    // //sort tasks which are not linked to todos to update
    this._filterPendingTaskLinkedToAPITodo(
      this._diffState.pendingTaskToUpdate,
      this._toCreatePendingState.createPendingTasksToUpdate,
      this._toCreatePendingState.createPendingTodos,
      this._toCreatePendingState.createPendingTaskLinkedToAPITodoToUpdate,
    );

    //task not linked to todos to create payload body
    this._createTaskLinkedToAPITodoBody(
      this._toCreatePayloadState.createTodoPayload,
      this._diffState.pendingTasks,
      this._toCreatePendingState.createPendingTaskLinkedToAPITodo,
      this._toCreatePayloadState.createTaskPayload,
    );

    //sort tasks which are to be updated not in createPendingTaskLinkedToAPITodo Array
    this._createTaskToUpdateBody(
      this._toCreatePayloadState.createTodoPayload,
      this._diffState.pendingTaskToUpdate,
      this._toCreatePendingState.createPendingTaskLinkedToAPITodoToUpdate,
      this._toCreatePendingState.createPendingTaskLinkedToAPITodo,
      this._toCreatePayloadState.createTaskToUpdatePayload,
    );
  }

  async _makePropertiesRequest() {
    //create batch todoToCreate
    await this._makeTodoCreateRequest(
      this._toCreatePayloadState.createTodoPayload,
      this._diffState.pendingTodos,
    );

    //create batch todoToDelete
    await this._makeTodoDeleteRequest(this._diffState.pendingTodosToDelete);

    //create batch todoUpdate
    await this._makeTodoUpdateRequest(
      this._toCreatePayloadState.createTodoToUpdatePayload,
      this._diffState.pendingTodoToUpdate,
    );
    // //create batch taskToCreate
    await this._makeTaskToCreateRequest(
      this._toCreatePayloadState.createTaskPayload,
      this._diffState.pendingTasks,
    );

    //create batch taskToDelete
    await this._makeTaskToDeleteRequest(this._diffState.pendingTasksToDelete);

    //create batch taskToUpdate
    await this._makeTaskToUpdateRequest(
      this._toCreatePayloadState.createTaskToUpdatePayload,
      this._diffState.pendingTaskToUpdate,
    );

    //update ordering todo
    await this._makeOrderingUpdateRequest(
      this._diffState.pendingTodoOrdering,
      "todo",
    );

    // //update ordering task
    await this._makeOrderingUpdateRequest(
      this._diffState.pendingTaskOrdering,
      "task",
    );

    //try to complete sync if no data is to be synced after request
    this._completeSync(this._diffState);
  }

  async _makeTodoCreateRequest(createTodoPayload, pendingTodos) {
    function setPendingCreatesToNull() {
      this._diffState.pendingTodos = [];
    }
    //create batch todoToCreate
    if (createTodoPayload.payload.length > 0) {
      const pendingState = this._diffState;
      await this._request(
        {
          createTodoPayload,
          pendingState,
          setReqState: setPendingCreatesToNull.bind(this),
          handleSetSyncState: this._handleSetSyncState.bind(this),
        },
        "APICreateDiffTodo",
      );
    } else setPendingCreatesToNull.bind(this)();
  }

  async _makeTodoDeleteRequest(pendingTodosToDelete) {
    //create batch todoToDelete
    function setPendingDeletesToNull() {
      this._diffState.pendingTodosToDelete = [];
    }

    if (pendingTodosToDelete.length > 0) {
      await this._request(
        {
          pendingTodosToDelete,
          setReqState: setPendingDeletesToNull.bind(this),
          handleSetSyncState: this._handleSetSyncState.bind(this),
        },
        "APIDeleteDiffTodo",
      );
    } else setPendingDeletesToNull.bind(this)();
  }

  async _makeTodoUpdateRequest(createTodoToUpdatePayload, pendingTodoToUpdate) {
    function setPendingUpdatesToNull() {
      this._diffState.pendingTodoToUpdate = [];
    }
    //create batch todoUpdate
    const todosToUpdateLength = createTodoToUpdatePayload?.payload?.length;
    if (todosToUpdateLength > 0) {
      await this._request(
        {
          createTodoToUpdatePayload,
          setReqState: setPendingUpdatesToNull.bind(this),
          handleSetSyncState: this._handleSetSyncState.bind(this),
        },
        "APIUpdateDiffTodo",
      );
    } else setPendingUpdatesToNull.bind(this)();
  }

  async _makeTaskToCreateRequest(createTasksPayload, pendingTasks) {
    function setPendingCreatesToNull() {
      this._diffState.pendingTasks = [];
    }

    //create batch taskToCreate
    const tasksToCreateLength = createTasksPayload?.payload?.length;
    if (tasksToCreateLength > 0) {
      await this._request(
        {
          createTasksPayload,
          setReqState: setPendingCreatesToNull.bind(this),
          // diffState: this._diffState,
          comp: this,
          getModelState: this._getModelState.bind(this),
          handleSetSyncState: this._handleSetSyncState.bind(this),
        },
        "APICreateDiffTodoTask",
      );
    } else setPendingCreatesToNull.bind(this)();
  }

  async _makeTaskToDeleteRequest(pendingTasksToDelete) {
    function setPendingDeletesNull() {
      this._diffState.pendingTasksToDelete = [];
    }

    //create batch taskToDelete
    const tasksToDeleteLength = pendingTasksToDelete?.length;
    if (tasksToDeleteLength > 0) {
      await this._request(
        {
          pendingTasksToDelete,
          setReqState: setPendingDeletesNull.bind(this),
          handleSetSyncState: this._handleSetSyncState.bind(this),
        },
        "APIDeleteDiffTodoTask",
      );
    } else setPendingDeletesNull.bind(this)();
  }

  async _makeTaskToUpdateRequest(
    createTaskToUpdatePayload,
    pendingTaskToUpdate,
  ) {
    function setPendingUpdatesNull() {
      this._diffState.pendingTaskToUpdate = [];
    }
    //create batch taskToUpdate
    const taskToUpdateLength = createTaskToUpdatePayload?.payload?.length;
    if (taskToUpdateLength > 0) {
      await this._request(
        {
          createTaskToUpdatePayload,
          setReqState: setPendingUpdatesNull.bind(this),
          handleSetSyncState: this._handleSetSyncState.bind(this),
        },
        "APIUpdateDiffTodoTask",
      );
    } else setPendingUpdatesNull.bind(this)();
  }

  async _makeOrderingUpdateRequest(orderingPayload, type) {
    function setPendingOrderingsNull(type) {
      if (type === "todo") this._diffState.todoOrdering = [];
      if (type === "task") this._diffState.taskOrdering = [];
    }

    if (orderingPayload?.length > 1) {
      await this._request(
        {
          orderingPayload,
          type,
          setReqState: setPendingOrderingsNull.bind(this),
          handleSetSyncState: this._handleSetSyncState.bind(this),
        },
        type === "todo"
          ? "APIUpdateDiffTodoIndex"
          : "APIUpdateDiffTodoTaskIndex",
      );
    }
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

  // _refilterTasksToCreateAndUpdate(
  //   todoToCreatePayload,
  //   taskToCreatePayload,
  //   taskToUpdatePayload,
  // ) {
  //   if(todoToCreatePayload)
  // }

  _createTodoPayload(
    todoToCreateDiffArray,
    todoToCreateFilteredArray,
    todoToCreatePayloadArray,
  ) {
    //create todo payload
    if (
      todoToCreateDiffArray?.length > 0 &&
      todoToCreateFilteredArray?.length > 0
    )
      todoToCreateFilteredArray.forEach((todo) => {
        //get todo from modelState
        const modelTodos = this._getModelState()?.todo;
        const todoModelIndex = modelTodos.findIndex(
          (modelTodo) => modelTodo.todoId === todo,
        );
        const todoVal = modelTodos?.[todoModelIndex];
        if (todoVal) {
          const todoBody = cloneDeep(todoVal);

          todoToCreatePayloadArray.ids.push(todoBody.todoId);
          //remove ids from todo and tasks
          delete todoBody.todoId;
          if (todoBody.tasks?.length > 0)
            todoBody.tasks.forEach((task) => delete task.taskId);
          //add formatted data to todos to create
          const formattedTodoBody = formatAPIRequestBody(todoBody, "todo");
          todoToCreatePayloadArray["payload"].push(formattedTodoBody);
        }
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
      todoToUpdateDiffArray?.length > 0 &&
      todoToUpdateFilteredArray?.length > 0
    )
      todoToUpdateFilteredArray.forEach((todo) => {
        const todoToUpdateExistsInTodoToCreate = todoToCreateFilteredArray.some(
          (todoId) => todoId === todo.todoId,
        );

        if (!todoToUpdateExistsInTodoToCreate) {
          todoToUpdatePayloadArray.payload.push(
            formatAPIRequestBody(todo, "todo", "update"),
          );
          todoToUpdatePayloadArray.ids.push(todo.todoId);
        }
      });
    else {
      this._diffState.todoToUpdate = [];
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
      tasksToCreateDiffArray?.length > 0 &&
      tasksToCreateFilteredArray?.length > 0
    ) {
      tasksToCreateFilteredArray.forEach((task) => {
        const pendingTaskTodoExistsInPendingTodos =
          todoToCreateFilteredArray.some((todo) => todo.todoId === task.todoId);

        if (!pendingTaskTodoExistsInPendingTodos)
          pendingTaskLinkedToAPITodoArray.push(task);
      });
    }
  }

  _createTaskLinkedToAPITodoBody(
    todoToCreatePayloadObject,
    taskToCreateDiffArray,
    pendingTaskLinkedToAPITodoArray,
    taskToCreatePayloadArray,
  ) {
    //task not linked to todos to create payload body
    if (
      taskToCreateDiffArray?.length > 0 &&
      pendingTaskLinkedToAPITodoArray.length > 0
    ) {
      //first remove tasks linked to todoToCreate if it still exists
      const pendingLinkedTaskNotInTodoToCreate =
        pendingTaskLinkedToAPITodoArray.filter(
          (task, i) =>
            !todoToCreatePayloadObject.ids.find((id) => id === task.todoId) &&
            task,
        );
      pendingTaskLinkedToAPITodoArray = [...pendingLinkedTaskNotInTodoToCreate];

      if (pendingTaskLinkedToAPITodoArray.length)
        pendingTaskLinkedToAPITodoArray.forEach((task) => {
          const taskBody = filterToGetTaskBody(
            this._getModelState.bind(this),
            task.taskId,
            task.todoId,
          );
          if (taskBody) {
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
          }
        });
      else this._diffState.taskToCreate = [];
    } else {
      this._diffState.taskToCreate = [];
    }
  }

  _createTaskToUpdateBody(
    todoToCreatePayload,
    taskToUpdateDiffArray,
    pendingTaskLinkedToAPITodoToUpdate,
    pendingTaskLinkedToAPITodo,
    taskToUpdatePayloadArray,
  ) {
    //sort tasks which are to be updated not in createPendingTaskLinkedToAPITodo Array
    if (
      taskToUpdateDiffArray?.length > 0 &&
      pendingTaskLinkedToAPITodoToUpdate?.length > 0
    ) {
      const pendingTaskLinkedToUpdateNotInTodoToCreate =
        pendingTaskLinkedToAPITodoToUpdate
          .filter(
            (task) =>
              !todoToCreatePayload.ids.find((id) => id === task.taskId) && task,
          )
          .filter((task) => task);

      pendingTaskLinkedToAPITodoToUpdate = [
        ...pendingTaskLinkedToUpdateNotInTodoToCreate,
      ];

      if (pendingTaskLinkedToAPITodoToUpdate.length)
        pendingTaskLinkedToAPITodoToUpdate.forEach((task) => {
          // const taskToUpdateExists
          const taskToUpdateExistsInTaskAPITodo =
            pendingTaskLinkedToAPITodo.some(
              (APITodoTask) => APITodoTask.taskId === task.taskId,
            );

          if (!taskToUpdateExistsInTaskAPITodo) {
            const taskBody = filterToGetTaskBody(
              this._getModelState.bind(this),
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
      else this._diffState.taskToUpdate = [];
    } else {
      this._diffState.taskToUpdate = [];
    }
  }

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
