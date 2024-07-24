import { configureStore } from "@reduxjs/toolkit";
import todoReducer from "./slices/todo/todoSlice";
import diffReducer from "./slices/todo/diffSlice";

const store = configureStore({
  reducer: {
    todos: todoReducer,
    diff: diffReducer,
  },
});

export default store;
