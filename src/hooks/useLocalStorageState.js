import { useState, useEffect } from "react";

export function useLocalStorageState(initialState, authToken) {
  const [token, setToken] = useState(function () {
    const storedToken = localStorage.getItem(authToken);
    return storedToken ? JSON.parse(storedToken) : initialState;
  });

  useEffect(
    function () {
      localStorage.setItem(authToken, JSON.stringify(token));
    },
    [token, authToken],
  );

  // function getTodos() {
  //   const savedTodos = localStorage.getItem("todos");
  //   if (savedTodos) return JSON.parse(savedTodos);
  // }

  function getLocalStates() {
    const savedTodos = localStorage.getItem("todos");
    const savedDiff = localStorage.getItem("diff");
    if (savedTodos)
      return { todos: JSON.parse(savedTodos), diff: JSON.parse(savedDiff) };
  }

  // function getDiffs() {}

  return { token, setToken, getLocalStates };
  // [token, setToken];
}
