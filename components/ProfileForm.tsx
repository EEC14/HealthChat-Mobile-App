import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Firestore, collection, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

declare global {
    interface Window {
      db: Firestore;
    }
}

interface UserProfile {
  name: string;
  weight: string;
  height: string;
  activityLevel: ActivityLevel;
  conditions: string;
  updatedAt?: Timestamp;
}

type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very' | 'extra' | '';

interface ActivityLevelOption {
  value: ActivityLevel;
  label: string;
}

interface ProfileFormProps {
  userId: string;
  onSuccess?: (data: UserProfile) => void;
}

const activityLevels: ActivityLevelOption[] = [
  { value: 'sedentary', label: 'Sedentary (little or no exercise)' },
  { value: 'light', label: 'Lightly active (1-3 days/week)' },
  { value: 'moderate', label: 'Moderately active (3-5 days/week)' },
  { value: 'very', label: 'Very active (6-7 days/week)' },
  { value: 'extra', label: 'Extra active (very active + physical job)' }
];

const initialFormData: UserProfile = {
  name: '',
  weight: '',
  height: '',
  activityLevel: '',
  conditions: ''
};

const ProfileForm: React.FC<ProfileFormProps> = ({ userId, onSuccess }) => {
  const [formData, setFormData] = useState<UserProfile>(initialFormData);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    const fetchProfile = async (): Promise<void> => {
      try {
        const docRef = doc(window.db, 'User', userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setFormData({
            name: data.name || '',
            weight: data.weight || '',
            height: data.height || '',
            activityLevel: data.activityLevel || '',
            conditions: data.conditions || ''
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data');
      }
    };

    fetchProfile();
  }, [userId]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const profileData: UserProfile & { updatedAt: Timestamp } = {
        ...formData,
        updatedAt: Timestamp.now()
      };

      const docRef = doc(window.db, 'User', userId);
      await setDoc(docRef, profileData, { merge: true });

      setSuccess(true);
      if (onSuccess) onSuccess(formData);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto p-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            required
          />
        </div>

        <div>
          <label htmlFor="weight" className="block text-sm font-medium">
            Weight (kg)
          </label>
          <input
            type="number"
            id="weight"
            name="weight"
            value={formData.weight}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            required
            min="20"
            max="300"
          />
        </div>

        <div>
          <label htmlFor="height" className="block text-sm font-medium">
            Height (cm)
          </label>
          <input
            type="number"
            id="height"
            name="height"
            value={formData.height}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            required
            min="100"
            max="250"
          />
        </div>

        <div>
          <label htmlFor="activityLevel" className="block text-sm font-medium">
            Activity Level
          </label>
          <select
            id="activityLevel"
            name="activityLevel"
            value={formData.activityLevel}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            required
          >
            <option value="">Select activity level</option>
            {activityLevels.map(level => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="conditions" className="block text-sm font-medium">
            Medical Conditions (optional)
          </label>
          <textarea
            id="conditions"
            name="conditions"
            value={formData.conditions}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            rows={3}
            placeholder="List any relevant medical conditions or concerns"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );
};

export default ProfileForm;