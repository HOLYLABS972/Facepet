import { ArrowLeft } from 'lucide-react';
import { Button } from '../../ui/button';

const BackButton = ({ handleBack }: { handleBack: () => void }) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="py-4 hover:bg-gray-300"
      onClick={(e) => {
        e.preventDefault();
        handleBack();
      }}
    >
      <ArrowLeft className="rtl:rotate-180" />
    </Button>
  );
};

export default BackButton;
