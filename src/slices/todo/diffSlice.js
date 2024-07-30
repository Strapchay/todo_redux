import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { APICreateTodo, updateTodo } from "./todoSlice";
import {
  batchRequestWrapper,
  formatBatchCreatedReturnData,
  makeAPIRequest,
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
      state.todoOrdering = action.payload.ordering_list;
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

      if (taskExists > 0)
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
  // extraReducers(builder) {
  // builder.addCase(APICreateTodo.rejected, (state, action) => {
  //   diffSlice.todoToCreate(state, {});
  //   console.log("request failed,builder logic trig");
  // });
  // },
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
      createTodoPayload,
      pendingTodos,
      pendingState,
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
      {
        onSuccess: (data) => {
          const todos = getState().todos.todo;
          //TODO: imp differ
          const formattedReturnedData = formatBatchCreatedReturnData(
            data,
            "todo",
          );
          createTodoPayload.ids.forEach((payloadId, i) => {
            const todo = formattedReturnedData[i];
            dispatch(updateTodo(todo));

            const todoOrdering = pendingState.pendingTodoOrdering;
            if (todoOrdering.length > 0) {
              const todoOrderingIdUpdateIfCreatedByFallback = todoOrdering.find(
                (order) => order.id === payloadId,
              );
              if (todoOrderingIdUpdateIfCreatedByFallback)
                todoOrderingIdUpdateIfCreatedByFallback.id = todo.todoId;
            }
          });
          //clear the data from the diff
          dispatch(clearTodoItem({ todoToCreate: [] }));
          handleSetSyncState("remove");
        },
        onError: () => {
          handleSetSyncState("remove");
        },
      },
    );
  },
);

export const APIDeleteDiffTodo = createAsyncThunk(
  "todo/APIDeleteDiffTodo",
  async (
    { token, pendingTodosToDelete, handleSetSyncState },
    { dispatch, getState, rejectWithValue },
  ) => {
    handleSetSyncState("add");
    const todosToDeleteLength = pendingTodosToDelete.length;
    const j = true;
    console.log("the pending todos to delete", pendingTodosToDelete);
    if (j) return;
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
        {
          onSuccess: (data) => {
            dispatch(clearTodoItem({ todoToDelete: [] }));
            handleSetSyncState("remove");
          },
          onError: () => {
            handleSetSyncState("remove");
          },
        },
      );
    }
  },
);
