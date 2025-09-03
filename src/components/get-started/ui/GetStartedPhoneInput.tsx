import { ChevronsUpDown } from 'lucide-react';
import * as React from 'react';
import * as RPNInput from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import GetStartedInput from './GetStartedInput';

type GetStartedPhoneInputProps = Omit<
  RPNInput.Props<typeof RPNInput.default>,
  'onChange' | 'value' | 'ref' | 'hasError' | 'label'
> & {
  onChange?: (value: RPNInput.Value) => void;
  hasError?: boolean;
  label: string;
  id: string;
};

const GetStartedPhoneInput: React.ForwardRefExoticComponent<GetStartedPhoneInputProps> =
  React.forwardRef<
    React.ElementRef<typeof RPNInput.default>,
    GetStartedPhoneInputProps
  >(({ className, onChange, hasError, label, id, ...props }, ref) => {
    return (
      <div>
        <RPNInput.default
          ref={ref}
          className={cn('flex rtl:flex-row-reverse', className)}
          flagComponent={FlagComponent}
          countrySelectComponent={CountrySelect}
          inputComponent={InputComponent}
          smartCaret={false}
          /**
           * Handles the onChange event.
           *
           * react-phone-number-input might trigger the onChange event as undefined
           * when a valid phone number is not entered. To prevent this,
           * the value is coerced to an empty string.
           *
           * @param {E164Number | undefined} value - The entered value
           */
          onChange={(value) => onChange?.(value || ('' as RPNInput.Value))}
          hasError={hasError}
          label={label}
          {...props}
        />
      </div>
    );
  });
GetStartedPhoneInput.displayName = 'GetStartedPhoneInput';

const InputComponent = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<'input'> & { label?: string; hasError?: boolean }
>(({ className, label, id, hasError, ...props }, ref) => (
  <GetStartedInput
    label={label ?? ''}
    id={id ?? 'phone-input'}
    type="tel"
    hasError={hasError}
    {...props}
    inputRef={ref}
  />
));
InputComponent.displayName = 'InputComponent';

type CountryEntry = { label: string; value: RPNInput.Country | undefined };

type CountrySelectProps = {
  disabled?: boolean;
  value: RPNInput.Country;
  options: CountryEntry[];
  onChange: (country: RPNInput.Country) => void;
};

const CountrySelect = ({
  disabled,
  value: selectedCountry,
  options: countryList,
  onChange
}: CountrySelectProps) => {
  const t = useTranslations('components.searchbar');

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="border-r-none hover:ring-ring h-10 gap-1 rounded-s-none rounded-e border-gray-300 bg-white px-3 hover:bg-white hover:ring-1 hover:outline-hidden focus:z-10 rtl:border-l-none rtl:border-r-1 rtl:rounded-s rtl:rounded-e-none"
          disabled={disabled}
        >
          <ChevronsUpDown
            className={cn(
              'size-4 opacity-50 ltr:-ml-2 rtl:-mr-2',
              disabled ? 'hidden' : 'opacity-100'
            )}
          />
          <FlagComponent
            country={selectedCountry}
            countryName={selectedCountry}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="mx-4 p-0">
        <Command>
          <CommandInput placeholder={t('search')} />
          <CommandList>
            <ScrollArea className="max-h-44 overflow-y-auto">
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {countryList.map(({ value, label }) =>
                  value ? (
                    <CountrySelectOption
                      key={value}
                      country={value}
                      countryName={label}
                      selectedCountry={selectedCountry}
                      onChange={onChange}
                    />
                  ) : null
                )}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

interface CountrySelectOptionProps extends RPNInput.FlagProps {
  selectedCountry: RPNInput.Country;
  onChange: (country: RPNInput.Country) => void;
}

const CountrySelectOption = ({
  country,
  countryName,
  selectedCountry,
  onChange
}: CountrySelectOptionProps) => {
  return (
    <CommandItem
      className={`gap-2 ${country === selectedCountry ? 'bg-primary' : '!bg-white'}`}
      onSelect={() => onChange(country)}
    >
      <FlagComponent country={country} countryName={countryName} />
      <span className="flex-1 text-sm">{countryName}</span>
      <span
        dir="ltr"
        className="text-foreground/50 text-sm"
      >{`+${RPNInput.getCountryCallingCode(country)}`}</span>
    </CommandItem>
  );
};

const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
  const Flag = flags[country];

  return (
    <span className="bg-foreground/20 flex h-4 w-6 overflow-hidden rounded-sm [&_svg]:size-full!">
      {Flag && <Flag title={countryName} />}
    </span>
  );
};

export { GetStartedPhoneInput };
