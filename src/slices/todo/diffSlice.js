import { createSlice } from "@reduxjs/toolkit";
import { APICreateTodo } from "./todoSlice";

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
};

const diffSlice = createSlice({
  name: "diff",
  initialState,
  reducers: {
    todoToCreate(state, action) {
      const toCreates = [...state.todoToCreate, action.payload.todoId];
      const uniqueToCreates = new Set(toCreates);
      state.todoToCreate = [...uniqueToCreates];
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
    },
    todoToDelete(state, action) {
      state.todoToDelete.push(action.payload.todoId);
    },
    todoOrdering(state, action) {
      state.todoOrdering = action.payload.ordering_list;
    },
    taskToCreate(state, action) {
      const taskExists = state.taskToCreate.findIndex(
        (task) => task.taskId === action.payload.taskId,
      );

      if (taskExists < 0) state.taskToCreate.push({ ...action.payload });
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
    },
    taskToDelete(state, action) {
      state.taskToDelete.push(action.payload);
    },
    taskOrdering(state, action) {
      state.taskOrdering = action.payload.ordering_list;
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
} = diffSlice.actions;
