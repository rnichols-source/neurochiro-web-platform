'use client';

import { useForm } from 'react-hook-form';
import { updateDoctorProfile } from '../../actions/update-profile';
import { useState } from 'react';

interface Doctor {
  _id: string;
  clinicName?: string;
  bio?: string;
  phone?: string;
}

export default function ProfileEditor({ doctor }: { doctor: Doctor }) {
  const { register, handleSubmit } = useForm<Doctor>({ defaultValues: doctor });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (data: any) => {
    setLoading(true);
    const formData = new FormData();
    Object.keys(data).forEach(key => formData.append(key, data[key]));
    formData.append('doctorId', doctor._id);

    try {
      await updateDoctorProfile(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      alert("Error saving profile: " + e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
      <h2 className="text-2xl font-bold text-[#1E2D3B]">My Profile</h2>
      
      <div>
        <label className="block text-sm font-medium mb-1">Clinic Name</label>
        <input {...register('clinicName')} className="w-full p-3 border rounded-lg border-gray-200" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Bio</label>
        <textarea {...register('bio')} className="w-full p-3 border rounded-lg border-gray-200" rows={4} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Phone</label>
        <input {...register('phone')} className="w-full p-3 border rounded-lg border-gray-200" />
      </div>

      <button 
        disabled={loading}
        className="bg-[#1E2D3B] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#1E2D3B]/90 transition-all"
      >
        {loading ? 'Saving...' : 'Save Profile Changes'}
      </button>

      {success && <p className="text-[#00b09b] font-medium">Profile successfully updated!</p>}
    </form>
  );
}
