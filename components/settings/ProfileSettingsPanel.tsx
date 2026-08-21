'use client';

import { useState, useEffect } from 'react';
import { User, Camera, Save, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { api } from '@/client/trpc';

export default function ProfileSettingsPanel() {
  const { data: userDetails, isLoading } = api.user.getDetails.useQuery();
  const utils = api.useUtils();

  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    email: '',
    mobile: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    country: '',
  });

  useEffect(() => {
    if (userDetails) {
      setForm({
        firstname: userDetails.firstname ?? '',
        lastname: userDetails.lastname ?? '',
        email: userDetails.email ?? '',
        mobile: userDetails.mobile ?? '',
        gender: userDetails.gender ?? '',
        address: userDetails.address ?? '',
        city: userDetails.city ?? '',
        state: userDetails.state ?? '',
        country: userDetails.country ?? '',
      });
    }
  }, [userDetails]);

  const updateMutation = api.user.updateDetails.useMutation({
    onSuccess: () => {
      toast.success('Profile updated successfully');
      utils.user.getDetails.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });

  const handleSave = () => {
    updateMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Photo */}
      <div className="bg-white dark:bg-bpi-dark-card border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-xl font-bold">
            {form.firstname?.[0]?.toUpperCase() || form.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Photo</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your initials are used as your avatar</p>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white dark:bg-bpi-dark-card border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Update your personal details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First Name" value={form.firstname} onChange={(v) => setForm({ ...form, firstname: v })} />
          <Field label="Last Name" value={form.lastname} onChange={(v) => setForm({ ...form, lastname: v })} />
          <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} disabled />
          <Field label="Mobile" value={form.mobile} onChange={(v) => setForm({ ...form, mobile: v })} />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gender</label>
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-bpi-dark-card border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
          <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
          <Field label="State" value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
          <Field label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
        </div>

        <div className="mt-6">
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4" /> Save Changes</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-2 bg-white dark:bg-bpi-dark-card border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white disabled:opacity-60"
      />
    </div>
  );
}
