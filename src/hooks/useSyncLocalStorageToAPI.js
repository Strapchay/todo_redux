import { useContext, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  APICreateDiffTodo,
  APICreateDiffTodoTask,
  APIDeleteDiffTodo,
  APIDeleteDiffTodoTask,
  APIUpdateDiffTodo,
  APIUpdateDiffTodoIndex,
  APIUpdateDiffTodoTask,
  APIUpdateDiffTodoTaskIndex,
  deactivateDiff,
  setInitialDiffFromLocalStorage,
  updateDiffState,
} from "../slices/todo/diffSlice";
import {
  batchRequestWrapper,
  formatAPIRequestBody,
  formatBatchCreatedReturnData,
  persistDiff,
} from "../helpers";
import toast from "react-hot-toast";
import { API } from "../api";
import { useEffect } from "react";
import { useCallback } from "react";
import SyncLocalStorageToAPI from "../dupSyncLocalStorageToAPI";
import { AppContext } from "../ProtectedRoute";
import { setInitialTodoFromLocalStorage } from "../slices/todo/todoSlice";
import store from "../store";

//TODO: instead of using a diffRef.current, load the diff to the diffState and add its active and then sync that data value to be a ble to use it with redux
export function useSyncLocalStorageToAPI(token, localState) {
  const dispatch = useDispatch();
  const [syncState, setSyncState] = useState(0);
  const [syncLoading, setSyncLoading] = useState(false);
  const syncLoadingRef = useRef(false);
  const syncRef = useRef(null);
  const toastRef = useRef();
  const diffRef = useRef(null);

  const makeDispatch = useCallback(
    async (payload, type) => {
      const dict = { token, ...payload };
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
    },
    [dispatch, token],
  );

  function getModelState() {
    return store.getState().todos;
  }

  useEffect(() => {
    if (localState) {
      const { todos = null, diff = null } = localState;
      if (todos) dispatch(setInitialTodoFromLocalStorage(todos));
      if (diff) {
        console.log("diff before diffState", diff);
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
      }
    }
  }, [dispatch]);

  const completeSyncAndLoadData = useCallback(async () => {
    console.log("the sync state val", syncState);
    if (syncState <= 0) {
      setSyncState(0);
      syncLoadingRef.current = false;
      syncRef.current = null;
      dispatch(deactivateDiff());
      removeLoader();
      // setLocalDataAdded(false);}
    }
  }, [dispatch, syncState]);

  // function handleSetSyncState(type) {
  //   console.log("the sync state handle set sync", syncState);
  //   if (type === "add") setSyncState((c) => (c += 1));
  //   if (type === "remove") setSyncState((c) => (c -= 1));
  // }

  const startSync = useCallback(() => {
    if (!syncLoading.current) {
      // setSyncLoading(true);
      console.log("start syc diff st", diffRef.current);
      if (diffRef.current && !syncRef.current) {
        createLoader();
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

  function createLoader() {
    toastRef.current = toast;
    toastRef.current.loading("Syncing state, Please wait!");
  }

  function removeLoader() {
    if (toastRef.current) toastRef.current.remove();
    toastRef.current = null;
  }

  return { startSync, syncLoading: syncLoadingRef.current };
}
