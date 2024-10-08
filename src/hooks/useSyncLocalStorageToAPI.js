import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import {
  APICreateDiffTodo,
  APICreateDiffTodoTask,
  APIDeleteDiffTodo,
  APIDeleteDiffTodoTask,
  APIUpdateDiffTodo,
  APIUpdateDiffTodoIndex,
  APIUpdateDiffTodoTask,
  APIUpdateDiffTodoTaskIndex,
  clearTodoItem,
  deactivateDiff,
  setInitialDiffFromLocalStorage,
} from "../slices/todo/diffSlice";
import toast from "react-hot-toast";
import { useEffect } from "react";
import { useCallback } from "react";
import SyncLocalStorageToAPI from "../syncLocalStorageToAPI";
import {
  APIListTodo,
  setInitialTodoFromLocalStorageOrAPI,
} from "../slices/todo/todoSlice";
import store from "../store";
import { persistDiff } from "../helpers";

export function useSyncLocalStorageToAPI(
  token,
  getLocalState,
  setSync,
  removeToken,
) {
  const dispatch = useDispatch();
  const [syncLoading, setSyncLoading] = useState(false);
  const [databaseLoaded, setDatabaseLoaded] = useState(false);
  const dbRef = useRef(false);
  const syncRef = useRef(null);
  const toastRef = useRef();
  const diffRef = useRef(null);

  const makeDispatch = useCallback(
    async (payload, type) => {
      const dict = { token, removeToken, ...payload };
      if (type === "APICreateDiffTodo") {
        return dispatch(APICreateDiffTodo(dict));
      }
      if (type === "APIDeleteDiffTodo") {
        return dispatch(APIDeleteDiffTodo(dict));
      }
      if (type === "APIUpdateDiffTodo")
        return dispatch(APIUpdateDiffTodo(dict));
      if (type === "APICreateDiffTodoTask")
        return dispatch(APICreateDiffTodoTask(dict));
      if (type === "APIDeleteDiffTodoTask")
        return dispatch(APIDeleteDiffTodoTask(dict));
      if (type === "APIUpdateDiffTodoTask")
        return dispatch(APIUpdateDiffTodoTask(dict));
      if (type === "APIUpdateDiffTodoIndex")
        return dispatch(APIUpdateDiffTodoIndex(dict));
      if (type === "APIUpdateDiffTodoTaskIndex")
        return dispatch(APIUpdateDiffTodoTaskIndex(dict));
      if (type === "APIListTodo") return dispatch(APIListTodo(dict));
    },
    [dispatch, token],
  );

  function getModelState() {
    return store.getState().todos;
  }

  const completeSyncAndLoadData = useCallback(
    async (syncDiff) => {
      if (syncLoading) {
        setSyncLoading(false);
        setSync(false);
        syncRef.current = null;
        dispatch(deactivateDiff());
        removeLoader();

        //save diff state after diffing
        if (syncDiff) {
          const diffStateToUpdate = {
            todoToCreate: syncDiff.pendingTodos,
            taskToCreate: syncDiff.pendingTasks,
            todoToDelete: syncDiff.pendingTodosToDelete,
            taskToDelete: syncDiff.pendingTasksToDelete,
            todoToUpdate: syncDiff.pendingTodoToUpdate,
            taskToUpdate: syncDiff.pendingTaskToUpdate,
            todoOrdering: syncDiff.pendingTodoOrdering,
            taskOrdering: syncDiff.pendingTaskOrdering,
          };
          dispatch(clearTodoItem({ payload: diffStateToUpdate }));
          persistDiff(diffStateToUpdate);
        }
        // setLocalDataAdded(false);}
      }
    },
    [dispatch, syncLoading, setSync],
  );

  useEffect(() => {
    const initDb = async () => {
      await makeDispatch({ removeToken }, "APIListTodo");
      completeSyncAndLoadData();
      dbRef.current = true;
    };
    const { todos = null, diff = null } = getLocalState?.() ?? {};
    if (todos) dispatch(setInitialTodoFromLocalStorageOrAPI(todos));
    if (diff) {
      dispatch(setInitialDiffFromLocalStorage(diff));
      const diffState = {
        pendingTodos: diff?.todoToCreate,
        pendingTasks: diff?.taskToCreate,
        pendingTodosToDelete: diff?.todoToDelete.map((todo) => +todo),
        pendingTasksToDelete: diff?.taskToDelete,
        pendingTodoToUpdate: diff?.todoToUpdate,
        pendingTaskToUpdate: diff?.taskToUpdate,
        //ordering
        pendingTodoOrdering: diff?.todoOrdering,
        pendingTaskOrdering: diff?.taskOrdering,
      };
      diffRef.current = diffState;
    } else {
      if (todos) {
        completeSyncAndLoadData();
      }
      if (!dbRef.current) {
        initDb();
      }
    }
  }, [
    dispatch,
    getLocalState,
    completeSyncAndLoadData,
    removeToken,
    makeDispatch,
    databaseLoaded,
  ]);

  const startSync = useCallback(() => {
    if (syncLoading) {
      createLoader();
      // setSyncLoading(true);
      if (diffRef.current && !syncRef.current) {
        const diffState = { ...diffRef.current };
        syncRef.current = new SyncLocalStorageToAPI(
          diffState,
          getModelState,
          makeDispatch,
          completeSyncAndLoadData,
        );
        syncRef.current.handleStartSync();
      }
    }
  }, [makeDispatch, completeSyncAndLoadData, syncLoading]);

  useEffect(() => {
    if (syncLoading) startSync();
  }, [startSync, syncLoading]);

  function createLoader() {
    toastRef.current = toast;
    toastRef.current.loading("Syncing state, Please wait!");
  }

  function removeLoader() {
    if (toastRef.current) toastRef.current.remove();
    toastRef.current = null;
  }

  return { syncLoading, setSyncLoading };
}
