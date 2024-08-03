import { useForm } from "react-hook-form";
import styles from "./AuthForm.module.css";
import { useLocalStorageState } from "../../hooks/useLocalStorageState";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { API } from "../../api";
import toast from "react-hot-toast";
import { useContext } from "react";
import { SwitcherContext } from "../Switcher";

function LoginForm() {
  const { setCurrentForm, currentForm } = useContext(SwitcherContext);
  const { register, handleSubmit, reset, getValues, formState } = useForm();
  const navigate = useNavigate();
  const { token, setToken } = useLocalStorageState(null, "token");
  const { errors } = formState;
  const { handleRequest } = useAuth(
    API.APIEnum.USER.TOKEN,
    reset,
    "login",
    token,
  );

  useEffect(() => {
    if (token) navigate("/dashboard");
  }, [token, navigate]);

  useEffect(() => {
    setCurrentForm((_) => "login");
  }, []);

  function onSubmit(data) {
    handleRequest(data, {
      onSuccess: (res) => {
        setToken((_) => res);
        reset();
      },
    });
  }

  function onError() {}

  return (
    <form
      id="login-form"
      className={styles["form-class"]}
      onSubmit={handleSubmit(onSubmit, onError)}
    >
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
      </div>
      <div className={[styles["password-box"], styles["form-box"]].join(" ")}>
        <input
          type="password"
          name="password"
          placeholder="password"
          {...register("password", {
            required: "This field is required",
          })}
        />
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

export default LoginForm;
