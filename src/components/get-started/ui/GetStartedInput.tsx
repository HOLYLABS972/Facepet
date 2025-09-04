import { cn } from '@/src/lib/utils';
import { Eye, EyeOff } from 'lucide-react';
import React from 'react';
import { Input } from '../../ui/input';

const GetStartedInput = ({
  label,
  id,
  required = false,
  hasError = false,
  errorMessage = '',
  inputRef,
  ...props
}: {
  label: string;
  id: string;
  required?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  inputRef?: any;
} & React.InputHTMLAttributes<HTMLInputElement>) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const isPasswordField = props.type === 'password';
  const isPhoneField = props.type === 'tel';

  return (
    <div className="relative w-full">
      <label
        htmlFor={id}
        className={cn(
          'absolute top-2.5 left-3 w-fit text-sm text-gray-500 transition-all duration-200 ease-in-out rtl:right-3',
          props.value
            ? 'text-primary -top-6 text-sm font-medium'
            : 'top-2.5 text-gray-500',
          hasError ? 'text-red-800' : ''
        )}
      >
        {label}
        {required ? '*' : ''}
      </label>

      <Input
        id={id}
        required={required}
        {...props}
        value={props.value || ''}
        className={cn(
          'h-10 rounded border-gray-300 bg-white',
          hasError ? 'border-red-800' : '',
          isPasswordField ? 'ltr:pr-10 rtl:pl-10' : '',
          isPhoneField
            ? 'lrt:text-left ltr:rounded-s ltr:rounded-e-none rtl:rounded-s-none rtl:rounded-e rtl:text-right'
            : ''
        )}
        type={
          isPasswordField ? (showPassword ? 'text' : 'password') : props.type
        }
        ref={inputRef}
      />
      {isPasswordField && (
        <div
          className="absolute inset-y-0 flex cursor-pointer items-center ltr:right-3 ltr:pl-3 rtl:left-3 rtl:pr-3"
          onClick={() => setShowPassword((prev) => !prev)}
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5 text-gray-600" />
          ) : (
            <Eye className="h-5 w-5 text-gray-600" />
          )}
        </div>
      )}
    </div>
  );
};

export default GetStartedInput;
