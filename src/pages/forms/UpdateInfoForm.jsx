import { useForm } from "react-hook-form";
import { useLocalStorageState } from "../../hooks/useLocalStorageState";
import styles from "../Todo.module.css";
import globals from "./AuthForm.module.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { API } from "../../api";
import toast from "react-hot-toast";
import { useContext } from "react";
import { AppContext } from "../../ProtectedRoute";
import { SwitcherContext } from "../Switcher";
import { makeAPIRequest } from "../../helpers";

function UpdateInfoForm() {
  const { token, removeToken } = useContext(AppContext);
  const { currentForm, setCurrentForm } = useContext(SwitcherContext);
  const dataLoaded = useRef(false);
  const { register, handleSubmit, reset, getValues, formState } = useForm({
    defaultValues: {},
  });
  const navigate = useNavigate();
  const { errors } = formState;
  const { handleRequest } = useAuth(
    API.APIEnum.USER.UPDATE_INFO,
    reset,
    "updateInfo",
    token.token,
    removeToken,
  );

  useEffect(() => {
    async function getUser() {
      if (!dataLoaded.current) {
        const user = await makeAPIRequest(
          API.APIEnum.USER.GET,
          null,
          "getUser",
          token.token,
          "GET",
          removeToken,
          {
            onSuccess: (data) => {
              dataLoaded.current = true;
            },
            onError: () => {},
          },
        );
        reset(user);
      }
    }
    getUser();
  }, []);

  function onSubmit(data) {
    handleRequest(
      data,
      {
        onSuccess: (res) => {
          toast.success("User data update completed successfully");
          return;
        },
        onError: (res) => {},
      },
      "PUT",
    );
  }

  function onError() {}

  return (
    <form
      action=""
      className={globals["form-class"]}
      id="update-info-form"
      onSubmit={handleSubmit(onSubmit, onError)}
    >
      <div
        className={[
          styles["update-first-name-box"],
          styles["update-form-box"],
        ].join(" ")}
      >
        <input
          type="text"
          name="first_name"
          placeholder="first name"
          className={styles["bd-radius"]}
          {...register("first_name", {
            required: "This field is required",
          })}
        />
      </div>

      <div
        className={[
          styles["update-last-name-box"],
          styles["update-form-box"],
        ].join(" ")}
      >
        <input
          type="text"
          name="last_name"
          placeholder="last name"
          className={styles["bd-radius"]}
          {...register("last_name", {
            required: "This field is required",
          })}
        />
      </div>
      <div
        className={[styles["update-email-box"], styles["update-form-box"]].join(
          " ",
        )}
      >
        <input
          type="email"
          name="email"
          placeholder="email"
          className={styles["bd-radius"]}
          {...register("email", {
            required: "This field is required",
            pattern: {
              value: /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/,
              message: "The entered email value is invalid",
            },
          })}
        />
      </div>
      <button className={styles["btn-submit"] ?? globals["btn-submit"]}>
        Submit
      </button>
    </form>
  );
}

export default UpdateInfoForm;
