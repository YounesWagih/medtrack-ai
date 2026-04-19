import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export function MedicineFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    // Placeholder: fetch medicine if editing
  }, [id]);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">{id ? 'Edit Medicine' : 'Add Medicine'}</h1>
      <p className="mt-4 text-gray-600">Form coming soon.</p>
      <button
        onClick={() => navigate(-1)}
        className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        Back
      </button>
    </div>
  );
}
