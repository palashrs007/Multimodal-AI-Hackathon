import React, { useState } from 'react';
import { PLACE_CATEGORIES, CATEGORY_LABELS } from '../../schemas/common.js';
import { PlusCircle } from 'lucide-react';

export function AddPlaceForm({ onAddPlace }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('food_cafe');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddPlace({
      name: name.trim(),
      city: city.trim() || null,
      category,
      description: description.trim() || undefined,
      included: true,
    });

    setName('');
    setCity('');
    setDescription('');
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full py-4 border-2 border-dashed border-stone-300 hover:border-coral-400 rounded-3xl text-sm font-bold text-stone-600 hover:text-coral-600 transition flex items-center justify-center gap-2 bg-stone-50/50 hover:bg-stone-50"
      >
        <PlusCircle className="w-4 h-4" />
        <span>Add a Must-Visit Place Manually</span>
      </button>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-md animate-slide-up">
      <h4 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider mb-4">
        Add Custom Place
      </h4>
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
              Place / Attraction Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fushimi Inari Taisha"
              className="w-full px-3 py-2 text-sm border rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
              City / Locality
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Kyoto"
              className="w-full px-3 py-2 text-sm border rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-xl bg-white"
            >
              {PLACE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c] || c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
              Brief Note (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why you want to go here"
              className="w-full px-3 py-2 text-sm border rounded-xl"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-bold text-white bg-coral-500 hover:bg-coral-600 rounded-xl shadow-sm"
          >
            Add to Review
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddPlaceForm;
