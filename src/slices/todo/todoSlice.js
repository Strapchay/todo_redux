import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  todo: [],
  completed: [],
  currentTodo: null,
  loadedFromDb: false,
};

const todoSlice = createSlice({
  name: "todo",
  initialState,
  reducers: {
    createTodo: {
      prepare(payload) {
        const currentTime = Date.now();
        return {
          payload: {
            ...payload,
            todoId: Number(currentTime),
            title: "",
            completed: false,
            task: [],
            lastAdded: new Date(currentTime).toISOString(),
          },
        };
      },
      reducer(state, action) {
        state.todo = [...state.todo, action.payload];
        state.currentTodo = action.payload.todoId;
      },
    },
    updateTodo: {
      prepare(payload) {
        const currentTime = Date.now();
        return {
          payload: {
            ...payload,
            lastAdded: new Date(currentTime).toISOString(),
          },
        };
      },
      reducer(state, action) {
        const todoIndex = state.todo.findIndex(
          (todo) => todo.todoId === state.currentTodo,
        );
        const modState = [...state.todo];
        modState.splice(todoIndex, 1, action.payload);
        state.todo = modState;
      },
    },
    createTaskForTodo: {
      prepare(payload) {
        const currentTime = Date.now();
        return {
          payload: {
            ...payload,
            taskId: Number(currentTime),
            task: "",
            completed: false,
            todoLastAdded: new Date(currentTime).toISOString(),
          },
        };
      },
      reducer(state, action) {
        const todoIndex = state.todo.findIndex(
          (todo) => todo.todoId === state.currentTodo,
        );
        const modState = [...state.todo];
        const currentTodo = state.todo[todoIndex];
        currentTodo.task = [...currentTodo.task, action.payload];
        modState.splice(todoIndex, 1, currentTodo);
        state.todo = modState;
      },
    },
    updateTaskForTodo: {
      prepare(payload) {
        const currentTime = Date.now();
        return {
          payload: {
            ...payload,
            todoLastAdded: new Date(currentTime).toISOString(),
          },
        };
      },
      reducer(state, action) {
        const todoIndex = state.todo.findIndex(
          (todo) => todo.todoId === state.currentTodo,
        );
        const modState = [...state.todo];
        const currentTodo = Object.assign({}, state.todo[todoIndex]);
        const currentTaskIndex = currentTodo.task.findIndex(
          (task) => task.taskId === action.payload.taskId,
        );
        currentTodo.task.splice(currentTaskIndex, 1, action.payload);
        modState.splice(todoIndex, 1, currentTodo);
        state.todo = modState;
      },
    },
    deleteTaskForTodo(state, action) {
      const todoIndex = state.todo.findIndex(
        (todo) => todo.todoId === state.currentTodo,
      );
      const modState = [...state.todo];
      const currentTodo = Object.assign({}, state.todo[todoIndex]);
      const currentTaskIndex = currentTodo.task.findIndex(
        (task) => task.taskId === action.payload.taskId,
      );
      currentTodo.task.splice(currentTaskIndex, 1);
      modState.splice(todoIndex, 1, currentTodo);
      state.todo = modState;
    },
  },
});

export const {
  createTodo,
  updateTodo,
  createTaskForTodo,
  updateTaskForTodo,
  deleteTaskForTodo,
} = todoSlice.actions;
export default todoSlice.reducer;
