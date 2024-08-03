import { useState, useEffect, useCallback } from "react";

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

  const removeToken = useCallback(() => {
    localStorage.removeItem("token");
  }, []);

  const getLocalStates = useCallback(() => {
    const savedTodos = localStorage.getItem("todos");
    const savedDiff = localStorage.getItem("diff");
    if (savedTodos)
      return { todos: JSON.parse(savedTodos), diff: JSON.parse(savedDiff) };
  }, []);

  return { token, setToken, getLocalStates, removeToken };
  // [token, setToken];
}
