import { Button } from '@/components/ui/button';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import React from 'react';

interface GetStartedFloatingActionButtonProps
  extends React.ComponentPropsWithoutRef<typeof Button> {
  isLastStep: boolean;
  isDisabled?: boolean;
  loading: boolean;
}

const GetStartedFloatingActionButton = ({
  isLastStep,
  isDisabled,
  loading,
  ...props
}: GetStartedFloatingActionButtonProps) => {
  return (
    <Button
      size="lg"
      type="submit"
      disabled={isDisabled || loading}
      className="bg-primary h-[60px] w-[60px] rounded-full p-0 hover:bg-[#ff6243]/90"
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin" />
      ) : isLastStep ? (
        <Check />
      ) : (
        <ArrowRight className="rtl:rotate-180" />
      )}
    </Button>
  );
};

export default GetStartedFloatingActionButton;
