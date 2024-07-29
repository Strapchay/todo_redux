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
    clearTodoToCreate(state) {
      state.todoToCreate = [];
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
  clearTodoToCreate,
  updateDiffState,
  setInitialDiffFromLocalStorage,
} = diffSlice.actions;

export const APICreateDiffTodo = createAsyncThunk(
  "todo/APICreateDiffTodo",
  async (
    { token, createTodoPayload, pendingTodos, pendingRef, setSyncCount },
    { dispatch, getState, rejectWithValue },
  ) => {
    const res = await makeAPIRequest(
      API.APIEnum.TODO.BATCH_CREATE,
      batchRequestWrapper(createTodoPayload.payload, "batch_create"),
      "createBatchTodo",
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
          createTodoPayload.payload.ids.forEach((payloadId, i) => {
            const todo = formattedReturnedData[i];
            dispatch(updateTodo(todo));

            const todoOrdering = pendingRef.current.pendingTodoOrdering;
            if (todoOrdering.length > 0) {
              const todoOrderingIdUpdateIfCreatedByFallback = todoOrdering.find(
                (order) => order.id === payloadId,
              );
              if (todoOrderingIdUpdateIfCreatedByFallback)
                todoOrderingIdUpdateIfCreatedByFallback.id = todo.todoId;
            }
          });
          //clear the data from the diff
          dispatch(clearTodoToCreate());
          setSyncCount((c) => (c -= 1));
        },
        onError: () => {},
      },
    );
  },
);
