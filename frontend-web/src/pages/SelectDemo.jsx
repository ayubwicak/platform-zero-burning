import { useState } from 'react';
import Select from '../components/ui/Select';

export default function SelectDemo() {
  const [standardVal, setStandardVal] = useState('');
  const [submittedVal, setSubmittedVal] = useState(null);

  const sampleOptions = [
    { value: 'padi', label: 'Padi Sawahan', description: '2.5 ha' },
    { value: 'jagung', label: 'Jagung Hibrida', description: '1.2 ha' },
    { value: 'kedelai', label: 'Kedelai Hitam', description: '0.8 ha', disabled: true },
    { value: 'singkong', label: 'Singkong Manis', description: '3.0 ha' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setSubmittedVal(data.get('lahan_hidden'));
  };

  return (
    <div className="p-8 max-w-xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">Select Component Testing</h1>

      {/* 1. Standard Select */}
      <div data-testid="standard-section">
        <label htmlFor="test-standard-select" className="block text-sm font-semibold mb-1">
          Pilih Komoditas
        </label>
        <Select
          id="test-standard-select"
          aria-label="Pilih Komoditas"
          options={sampleOptions}
          value={standardVal}
          onChange={(val) => setStandardVal(val)}
          placeholder="Pilih komoditas..."
        />
        <p data-testid="selected-standard-output" className="text-xs mt-1 text-gray-600">
          Terpilih: {standardVal || 'belum ada'}
        </p>
      </div>

      {/* 2. Disabled Select */}
      <div data-testid="disabled-section">
        <label htmlFor="test-disabled-select" className="block text-sm font-semibold mb-1">
          Select Dinonaktifkan
        </label>
        <Select
          id="test-disabled-select"
          aria-label="Select Dinonaktifkan"
          options={sampleOptions}
          value="padi"
          disabled={true}
        />
      </div>

      {/* 3. Empty State Select */}
      <div data-testid="empty-section">
        <label htmlFor="test-empty-select" className="block text-sm font-semibold mb-1">
          Select Kosong
        </label>
        <Select
          id="test-empty-select"
          aria-label="Select Kosong"
          options={[]}
          placeholder="Tidak ada lahan"
          emptyMessage="Belum ada data tersedia"
        />
      </div>

      {/* 4. Form dengan Hidden Input */}
      <form onSubmit={handleSubmit} data-testid="form-section">
        <label htmlFor="test-form-select" className="block text-sm font-semibold mb-1">
          Form Hidden Input
        </label>
        <Select
          id="test-form-select"
          aria-label="Form Hidden Input"
          name="lahan_hidden"
          options={sampleOptions}
          value={standardVal}
          onChange={(val) => setStandardVal(val)}
        />
        <button
          type="submit"
          className="mt-2 px-3 py-1.5 bg-primary text-white rounded-lg text-xs"
        >
          Kirim Form
        </button>
        {submittedVal !== null && (
          <p data-testid="submitted-output" className="text-xs mt-1 text-green-700">
            Nilai Terkirim: {submittedVal}
          </p>
        )}
      </form>

      {/* 5. Searchable Select */}
      <div data-testid="searchable-section">
        <label htmlFor="test-searchable-select" className="block text-sm font-semibold mb-1">
          Select Pencarian
        </label>
        <Select
          id="test-searchable-select"
          aria-label="Select Pencarian"
          options={sampleOptions}
          searchable={true}
          searchPlaceholder="Cari komoditas..."
        />
      </div>
    </div>
  );
}
