import type { InputHTMLAttributes } from "react";
import type { ZodError } from "zod";

interface ValidationErrorProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "id" | "name" | "value" | "onBlur" | "onChange"
  > {
  errors: ZodError[];
}

const ValidationError = ({ errors, ...props }: ValidationErrorProps) => {
  if (!errors || errors.length === 0) {
    return null;
  }

  return (
    <p className={`text-red-500 text-sm ${props.className || ""}`} role="alert">
      {errors[0].message}
    </p>
  );
};

export default ValidationError;
