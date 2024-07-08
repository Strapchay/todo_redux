function ResetForm() {
  return (
    <form action="" id="reset-pwd-form" className="form-class">
      <h2 className="reset-heading">Reset Password</h2>

      <div className="reset-reset">
        <div
          className="
              -email-box form-box"
        >
          <input
            type="email"
            name="email"
            placeholder="email"
            className="bd-radius"
            required
          />
        </div>
      </div>

      <button className="btn-submit">Submit</button>
    </form>
  );
}

export default ResetForm;
