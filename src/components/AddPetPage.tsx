import AddNewPetForm from './AddNewPetForm';
import Navbar from './layout/Navbar';

export default function AddPetPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20">
        <AddNewPetForm />
      </div>
    </div>
  );
}