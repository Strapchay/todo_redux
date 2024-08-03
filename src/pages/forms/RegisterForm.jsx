import { useForm } from "react-hook-form";
import styles from "./AuthForm.module.css";
import { useAuth } from "../../hooks/useAuth";
import { API } from "../../api";
import { useLocalStorageState } from "../../hooks/useLocalStorageState";
import toast from "react-hot-toast";
import { useEffect } from "react";
import { useContext } from "react";
import { SwitcherContext } from "../Switcher";

function RegisterForm() {
  const { currentForm, setCurrentForm } = useContext(SwitcherContext);
  const { register, handleSubmit, reset, getValues, formState } = useForm();
  const { token, setToken } = useLocalStorageState(null, "token");
  const { errors } = formState;
  const { handleRequest } = useAuth(
    API.APIEnum.USER.CREATE,
    reset,
    "create",
    token,
  );

  function onSubmit(data) {
    handleRequest(data, {
      onSuccess: () => {
        toast.success("Account created successfully");
      },
    });
  }

  useEffect(() => {
    setCurrentForm((_) => "create");
  }, []);

  function onError() {}

  return (
    <form
      action=""
      id="create-form"
      className={styles["form-class"]}
      onSubmit={handleSubmit(onSubmit, onError)}
    >
      <div className={[styles["first-name-box"], styles["form-box"]].join(" ")}>
        <input
          type="text"
          name="first_name"
          placeholder="first name"
          {...register("first_name", {
            required: "This field is required",
            validate: (value) =>
              value.trim().split(" ").length == 1 ||
              "No spaces allowed in name value",
          })}
        />
        {errors?.first_name?.message && (
          <div className={styles["form-field-error"]}>
            {errors?.first_name?.message}
          </div>
        )}
      </div>
      <div className={[styles["last-name-box"], styles["form-box"]].join(" ")}>
        <input
          type="text"
          name="last_name"
          placeholder="last name"
          {...register("last_name", {
            required: "This field is required",
            validate: (value) =>
              value.trim().split(" ").length == 1 ||
              "No spaces allowed in name value",
          })}
        />
        {errors?.last_name?.message && (
          <div className={styles["form-field-error"]}>
            {errors?.last_name?.message}
          </div>
        )}
      </div>
      <div className={[styles["email-box"], styles["form-box"]].join(" ")}>
        <input
          type="email"
          name="email"
          placeholder="email"
          {...register("email", {
            required: "This field is required",
            pattern: {
              value: /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/,
              message: "The entered email value is invalid",
            },
          })}
        />
        {errors?.email?.message && (
          <div className={styles["form-field-error"]}>
            {errors?.email?.message}
          </div>
        )}
      </div>
      <div className={[styles["password-box"], styles["form-box"]].join(" ")}>
        <input
          type="password"
          name="password"
          placeholder="password"
          {...register("password", {
            required: "This field is required",
            validate: (value) =>
              value == getValues().password2 || "Password fields don't match",
          })}
        />
        {errors?.password?.message && (
          <div className={styles["form-field-error"]}>
            {errors?.password?.message}
          </div>
        )}
      </div>
      <div className={[styles["password-box"], styles["form-box"]].join(" ")}>
        <input
          type="password"
          name="password2"
          placeholder="confirm password"
          {...register("password2", {
            required: "This field is required",
          })}
        />
        {errors?.password2?.message && (
          <div className={styles["form-field-error"]}>
            {errors?.password2?.message}
          </div>
        )}
      </div>
      <button
        type="submit"
        className={[styles["btn-login"], styles["btn-submit"]].join(" ")}
      >
        Submit
      </button>
    </form>
  );
}

export default RegisterForm;
