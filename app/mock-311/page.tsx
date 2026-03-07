'use client';

import { useState } from 'react';

export default function Mock311Page() {
  const [submitted, setSubmitted] = useState(false);
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [category, setCategory] = useState('Infrastructure');
  const [subcategory, setSubcategory] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = 'CITY-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    setConfirmationNumber(num);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <div className="max-w-md text-center space-y-4 p-8">
          <div className="text-6xl">✅</div>
          <h1 className="text-2xl font-bold">Thank You!</h1>
          <p className="text-gray-600">Your service request has been submitted successfully.</p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-gray-500">Confirmation Number</p>
            <p className="text-2xl font-mono font-bold text-green-700">{confirmationNumber}</p>
          </div>
          <p className="text-sm text-gray-500">
            You will receive email updates about the status of your request.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="bg-blue-800 text-white px-6 py-4">
        <h1 className="text-xl font-bold">City of Waterloo — 311 Service Request</h1>
        <p className="text-sm text-blue-200">Report a non-emergency issue</p>
      </header>

      <main className="max-w-xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              required
            >
              <option value="Infrastructure">Infrastructure</option>
              <option value="Environment">Environment</option>
              <option value="Safety">Safety</option>
              <option value="Accessibility">Accessibility</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory *</label>
            <input
              type="text"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              placeholder="e.g., Pothole, Broken Streetlight"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., King St & James St, Waterloo"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe the issue in detail..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-32 resize-none"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-800 text-white py-3 rounded-lg font-medium hover:bg-blue-900 transition-colors"
          >
            Submit Service Request
          </button>
        </form>
      </main>
    </div>
  );
}
