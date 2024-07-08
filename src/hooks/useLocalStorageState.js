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

  return [token, setToken];
}
