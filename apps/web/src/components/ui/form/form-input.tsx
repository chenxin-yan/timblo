import type { InputHTMLAttributes } from "react";
import { Input } from "../input";

interface FormInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "id" | "name" | "value" | "onBlur" | "onChange"
  > {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  field: any;
}

const FormInput = ({ field, ...props }: FormInputProps) => {
  const hasError = field.state.meta.errors?.length > 0;

  return (
    <Input
      id={field.name}
      name={field.name}
      value={field.state.value}
      onBlur={field.handleBlur}
      onChange={(e) => field.handleChange(e.target.value)}
      className={`${hasError ? "border-red-500 focus-visible:ring-red-500" : ""} ${props.className || ""}`}
      aria-invalid={hasError}
      {...props}
    />
  );
};

export default FormInput;
