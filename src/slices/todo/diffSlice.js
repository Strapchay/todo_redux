import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  APICreateTodo,
  replaceTodos,
  setInitialTodoFromLocalStorageOrAPI,
  updateTodo,
} from "./todoSlice";
import {
  batchRequestWrapper,
  filterToGetTaskBody,
  formatBatchCreatedReturnData,
  getOrderingUrlFromType,
  makeAPIRequest,
  persistDiff,
  updatePendingTaskOrdering,
} from "../../helpers";
import { API } from "../../api";

const initialState = {
  //diffing related properties
  taskToDelete: [],
  todoToDelete: [],
  taskToUpdate: [], //should be to update,sould work with complete and title update
  todoToUpdate: [], //should be to update,sould work with complete and title update
  taskToCreate: [],
  todoToCreate: [],
  todoOrdering: [],
  taskOrdering: [],
  diffActive: false,
  syncActive: false,
};

const diffSlice = createSlice({
  name: "diff",
  initialState,
  reducers: {
    setInitialDiffFromLocalStorage(state, action) {
      return { ...action.payload };
    },
    updateDiffState(state, action) {
      return { ...state, ...action.payload };
    },
    todoToCreate(state, action) {
      const toCreates = [...state.todoToCreate, action.payload.todoId];
      const uniqueToCreates = new Set(toCreates);
      state.todoToCreate = [...uniqueToCreates];
      state.diffActive = true;
    },
    todoToUpdate(state, action) {
      const todoExists = state.todoToUpdate.findIndex(
        (todo) => todo.todoId === action.payload.todoId,
      );

      if (todoExists > 0)
        state.todoToUpdate[todoExists] = {
          ...state.todoToUpdate[todoExists],
          ...action.payload,
        };
      else state.todoToUpdate.push(action.payload);
      state.diffActive = true;
    },
    todoToDelete(state, action) {
      state.todoToDelete.push(action.payload.todoId);
      state.diffActive = true;
    },
    todoOrdering(state, action) {
      state.todoOrdering = [...action.payload];
      state.diffActive = true;
    },
    taskToCreate(state, action) {
      const taskExists = state.taskToCreate.findIndex(
        (task) => task.taskId === action.payload.taskId,
      );

      if (taskExists < 0) state.taskToCreate.push({ ...action.payload });
      state.diffActive = true;
    },
    taskToUpdate(state, action) {
      const taskExists = state.taskToUpdate.findIndex(
        (task) => task.taskId === action.payload.taskId,
      );

      if (taskExists > -1)
        state.taskToUpdate[taskExists] = {
          ...state.taskToUpdate[taskExists],
          ...action.payload,
        };
      else state.taskToUpdate.push(action.payload);
      state.diffActive = true;
    },
    taskToDelete(state, action) {
      state.taskToDelete.push(action.payload);
      state.diffActive = true;
    },
    taskOrdering(state, action) {
      state.taskOrdering = action.payload.ordering_list;
      state.diffActive = true;
    },
    clearTodoItem(state, action) {
      return { ...state, ...action.payload };
    },
    deactivateDiff(state) {
      state.diffActive = false;
      state.syncActive = false;
    },
    activateSync(state) {
      state.syncActive = true;
    },
  },
});

export default diffSlice.reducer;
export const {
  todoToCreate,
  todoToUpdate,
  todoToDelete,
  todoOrdering,
  taskToCreate,
  taskToUpdate,
  taskToDelete,
  taskOrdering,
  deactivateDiff,
  activateSync,
  clearTodoItem,
  updateDiffState,
  setInitialDiffFromLocalStorage,
} = diffSlice.actions;

export const APICreateDiffTodo = createAsyncThunk(
  "todo/APICreateDiffTodo",
  async (
    {
      token,
      removeToken,
      createTodoPayload,
      pendingState,
      setReqState,
      handleSetSyncState,
    },
    { dispatch, getState, rejectWithValue },
  ) => {
    handleSetSyncState("add");
    const payloadLength = createTodoPayload?.payload?.length;
    const res = await makeAPIRequest(
      payloadLength > 1
        ? API.APIEnum.TODO.BATCH_CREATE
        : API.APIEnum.TODO.CREATE,
      payloadLength > 1
        ? batchRequestWrapper(createTodoPayload.payload, "batch_create")
        : createTodoPayload.payload[0],
      payloadLength > 1 ? "createBatchTodo" : "createTodo",
      token.token,
      "POST",
      removeToken,
      {
        onSuccess: (data) => {
          const formattedReturnedData = formatBatchCreatedReturnData(
            data,
            "todo",
          );
          createTodoPayload.ids.forEach((payloadId, i) => {
            const todos = [...getState().todos.todo];
            const todoIndex = todos.findIndex(
              (todo) => todo.todoId === payloadId,
            );
            todos[todoIndex] = formattedReturnedData[i];
            dispatch(replaceTodos(todos));

            const todoOrdering = pendingState.pendingTodoOrdering;
            if (todoOrdering.length > 0) {
              const todoOrderingIdUpdateIfCreatedByFallback = todoOrdering.find(
                (order) => order.id === payloadId,
              );
              if (todoOrderingIdUpdateIfCreatedByFallback)
                todoOrderingIdUpdateIfCreatedByFallback.id =
                  formattedReturnedData[i].todoId;
            }
          });
          //clear the data from the diff
          dispatch(clearTodoItem({ todoToCreate: [] }));
          setReqState();
          const diff = getState().diff;
          persistDiff(diff);
          handleSetSyncState("remove");
        },
        onError: () => {
          handleSetSyncState("remove");
          const diff = getState().diff;
          persistDiff(diff);
        },
      },
    );
  },
);

export const APIDeleteDiffTodo = createAsyncThunk(
  "todo/APIDeleteDiffTodo",
  async (
    {
      token,
      removeToken,
      pendingTodosToDelete,
      setReqState,
      handleSetSyncState,
    },
    { dispatch, getState, rejectWithValue },
  ) => {
    handleSetSyncState("add");
    const todosToDeleteLength = pendingTodosToDelete.length;
    if (todosToDeleteLength > 0) {
      //if todo doesn't exist in API it should return a NOT FOUND so no need to keep track of type of todo
      const res = await makeAPIRequest(
        todosToDeleteLength > 1
          ? API.APIEnum.TODO.BATCH_DELETE
          : API.APIEnum.TODO.DELETE(pendingTodosToDelete[0]),
        todosToDeleteLength > 1
          ? batchRequestWrapper(pendingTodosToDelete, "batch_delete")
          : pendingTodosToDelete[0],

        todosToDeleteLength > 1 ? "deleteTodoBatch" : "deleteTodo",
        token.token,
        "DELETE",
        removeToken,
        {
          onSuccess: (data) => {
            dispatch(clearTodoItem({ todoToDelete: [] }));
            setReqState();
            const diff = getState().diff;
            persistDiff(diff);
            // persistDiff(pendingState);
            handleSetSyncState("remove");
          },
          onError: () => {
            handleSetSyncState("remove");
            const diff = getState().diff;
            persistDiff(diff);
          },
        },
      );
    }
  },
);

export const APIUpdateDiffTodo = createAsyncThunk(
  "todo/APIUpdateDiffTodo",
  async (
    {
      token,
      removeToken,
      createTodoToUpdatePayload,
      setReqState,
      handleSetSyncState,
    },
    { dispatch, getState, rejectWithValue },
  ) => {
    handleSetSyncState("add");
    const payloadLength = createTodoToUpdatePayload.payload.length;

    if (payloadLength > 0) {
      const res = await makeAPIRequest(
        payloadLength > 1
          ? API.APIEnum.TODO.BATCH_UPDATE
          : API.APIEnum.TODO.PATCH(+createTodoToUpdatePayload.payload[0].id),
        payloadLength > 1
          ? batchRequestWrapper(
              createTodoToUpdatePayload.payload,
              "batch_update",
            )
          : createTodoToUpdatePayload.payload[0],
        payloadLength > 1 ? "updateBatchTodo" : "updateTodo",
        token.token,
        "PATCH",
        removeToken,
        {
          onSuccess: (data) => {
            //clear the data from the diff
            dispatch(clearTodoItem({ todoToUpdate: [] }));
            setReqState();
            const diff = getState().diff;
            persistDiff(diff);
            // persistDiff(pendingState);
            handleSetSyncState("remove");
          },
          onError: () => {
            handleSetSyncState("remove");
            const diff = getState().diff;
            persistDiff(diff);
          },
        },
      );
    }
  },
);

export const APIUpdateDiffTodoIndex = createAsyncThunk(
  "todo/APIUpdateDiffTodoIndex",
  async (
    {
      token,
      removeToken,
      orderingPayload,
      type,
      setReqState,
      handleSetSyncState,
    },
    { dispatch, getState, rejectWithValue },
  ) => {
    handleSetSyncState("add");
    const payloadLength = orderingPayload.length;
    if (payloadLength > 0) {
      const res = await makeAPIRequest(
        getOrderingUrlFromType(
          payloadLength,
          type,
          payloadLength === 1 ? orderingPayload[0].id : null,
        ),

        payloadLength > 1
          ? batchRequestWrapper(orderingPayload, "batch_update_ordering")
          : orderingPayload,
        "updateOrdering",
        token.token,
        "PATCH",
        removeToken,
        {
          onSuccess: (data) => {
            //clear the data from the diff
            dispatch(clearTodoItem({ todoOrdering: [] }));
            setReqState();
            const diff = getState().diff;
            persistDiff(diff);
            // persistDiff(pendingState);
            handleSetSyncState("remove");
          },
          onError: () => {
            handleSetSyncState("remove");
            const diff = getState().diff;
            persistDiff(diff);
          },
        },
      );
    }
  },
);

export const APICreateDiffTodoTask = createAsyncThunk(
  "todo/APICreateDiffTodoTask",
  async (
    {
      token,
      removeToken,
      createTasksPayload,
      setReqState,
      comp,
      getModelState,
      handleSetSyncState,
    },
    { dispatch, getState, rejectWithValue },
  ) => {
    handleSetSyncState("add");
    const payloadLength = createTasksPayload?.payload?.length;

    if (payloadLength > 0) {
      const res = await makeAPIRequest(
        payloadLength > 1
          ? API.APIEnum.TASK.BATCH_CREATE
          : API.APIEnum.TASK.CREATE,
        payloadLength > 1
          ? batchRequestWrapper(createTasksPayload.payload, "batch_create")
          : createTasksPayload.payload[0],
        payloadLength > 1 ? "createBatchTask" : "createTask",
        token.token,
        "POST",
        removeToken,
        {
          onSuccess: async (data) => {
            //TODO: imp differ
            const formattedReturnedData = formatBatchCreatedReturnData(
              data,
              "task",
            );

            createTasksPayload.ids.forEach((payloadId, i) => {
              const todos = [...getState().todos.todo];
              const todoIndex = todos.findIndex(
                (todo) => todo.todoId === payloadId.todoId,
              );

              const tasks = [...todos[todoIndex].task];
              const taskIndex = tasks.findIndex(
                (task) => task.taskId === payloadId.taskId,
              );
              tasks[taskIndex] = formattedReturnedData[i];

              todos[todoIndex] = { ...todos[todoIndex] };
              todos[todoIndex].task = [...tasks];
              dispatch(replaceTodos(todos));
              dispatch(clearTodoItem({ taskToCreate: [] }));
              setReqState();
              updatePendingTaskOrdering(
                payloadId,
                formattedReturnedData[i],
                comp._diffState,
              );
              // updateOrderingState(payloadId, formattedReturnedData[i]);
              handleSetSyncState("remove");
            });
          },
          onError: () => {
            handleSetSyncState("remove");
            const diff = getState().diff;
            persistDiff(diff);
          },
        },
      );
    }
  },
);

export const APIDeleteDiffTodoTask = createAsyncThunk(
  "todo/APIDeleteDiffTodoTask",
  async (
    {
      token,
      removeToken,
      pendingTasksToDelete,
      setReqState,
      handleSetSyncState,
    },
    { dispatch, getState, rejectWithValue },
  ) => {
    handleSetSyncState("add");
    const payloadLength = pendingTasksToDelete.length;
    if (payloadLength > 0) {
      const payload = pendingTasksToDelete.map((task) => task.taskId);
      //if todo doesn't exist in API it should return a NOT FOUND so no need to keep track of type of todo
      const res = await makeAPIRequest(
        payloadLength > 1
          ? API.APIEnum.TASK.BATCH_DELETE
          : API.APIEnum.TASK.DELETE(payload[0]),
        payloadLength > 1
          ? batchRequestWrapper(payload, "batch_delete")
          : payload[0],
        payloadLength > 1 ? "deleteBatchTask" : "deleteTask",
        token.token,
        "DELETE",
        removeToken,
        {
          onSuccess: (data) => {
            dispatch(clearTodoItem({ taskToDelete: [] }));
            setReqState();
            const diff = getState().diff;
            persistDiff(diff);
            // persistDiff(pendingState);
            handleSetSyncState("remove");
          },
          onError: () => {
            handleSetSyncState("remove");
            const diff = getState().diff;
            persistDiff(diff);
          },
        },
      );
    }
  },
);

export const APIUpdateDiffTodoTask = createAsyncThunk(
  "todo/APIUpdateDiffTodoTask",
  async (
    {
      token,
      removeToken,
      createTaskToUpdatePayload,
      setReqState,
      handleSetSyncState,
    },
    { dispatch, getState, rejectWithValue },
  ) => {
    handleSetSyncState("add");
    const payloadLength = createTaskToUpdatePayload.payload.length;

    if (payloadLength > 0) {
      const res = await makeAPIRequest(
        payloadLength > 1
          ? API.APIEnum.TASK.BATCH_UPDATE
          : API.APIEnum.TASK.PATCH(+createTaskToUpdatePayload.payload[0].id),
        payloadLength > 1
          ? batchRequestWrapper(
              createTaskToUpdatePayload.payload,
              "batch_update",
            )
          : createTaskToUpdatePayload.payload[0],
        payloadLength > 1 ? "updateBatchTask" : "updateTask",
        token.token,
        "PATCH",
        removeToken,
        {
          onSuccess: (data) => {
            //clear the data from the diff
            dispatch(clearTodoItem({ taskToUpdate: [] }));
            setReqState();
            const diff = getState().diff;
            persistDiff(diff);
            // persistDiff(pendingState);
            handleSetSyncState("remove");
          },
          onError: () => {
            handleSetSyncState("remove");
            const diff = getState().diff;
            persistDiff(diff);
          },
        },
      );
    }
  },
);

export const APIUpdateDiffTodoTaskIndex = createAsyncThunk(
  "todo/APIUpdateDiffTodoTaskIndex",
  async (
    {
      token,
      removeToken,
      orderingPayload,
      type,
      setReqState,
      handleSetSyncState,
    },
    { dispatch, getState, rejectWithValue },
  ) => {
    handleSetSyncState("add");
    const payloadLength = orderingPayload.length;
    if (payloadLength > 0) {
      const res = await makeAPIRequest(
        getOrderingUrlFromType(
          payloadLength,
          type,
          payloadLength === 1 ? orderingPayload[0].id : null,
        ),

        payloadLength > 1
          ? batchRequestWrapper(orderingPayload, "batch_update_ordering")
          : orderingPayload,
        "updateOrdering",
        token.token,
        "PATCH",
        removeToken,
        {
          onSuccess: (data) => {
            //clear the data from the diff
            dispatch(clearTodoItem({ taskOrdering: [] }));
            setReqState(type);
            const diff = getState().diff;
            persistDiff(diff);
            // persistDiff(pendingState);
            handleSetSyncState("remove");
          },
          onError: () => {
            handleSetSyncState("remove");
            const diff = getState().diff;
            persistDiff(diff);
          },
        },
      );
    }
  },
);
