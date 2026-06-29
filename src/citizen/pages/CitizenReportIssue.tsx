import React, { useState, useRef, ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { Camera, Upload, AlertCircle, Loader2, MapPin, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { useStore } from '../../store';
import { IssueCategory, IssueSeverity } from '../../types';

interface ReportForm {
  title: string;
  description: string;
  category: IssueCategory;
  severity: IssueSeverity;
  address: string;
}

const getDepartmentIdFromCategory = (category: string): string => {
  switch (category) {
    case 'Pothole':
    case 'Broken Road':
      return 'dept-1';
    case 'Waste Accumulation':
      return 'dept-2';
    case 'Damaged Light':
      return 'dept-3';
    case 'Water Leakage':
      return 'dept-4';
    default:
      return 'dept-general';
  }
};

const compressImage = (base64Str: string, maxWidth = 600, maxHeight = 600): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/jpeg', 0.6);
      resolve(compressed);
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

export default function CitizenReportIssue() {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ReportForm>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = useStore((state) => state.user);
  const navigate = useNavigate();

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const originalBase64 = event.target?.result as string;
      const compressedBase64 = await compressImage(originalBase64);
      setImagePreview(compressedBase64);
      await analyzeImage(compressedBase64);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (base64: string) => {
    setIsAnalyzing(true);
    const loadingToast = toast.loading('AI is analyzing the issue...');
    try {
      const res = await fetch('/api/analyze-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      
      if (!res.ok) throw new Error('Analysis failed');
      
      const data = await res.json();
      
      if (data.category) setValue('category', data.category as IssueCategory);
      if (data.severity) setValue('severity', data.severity as IssueSeverity);
      if (data.description && !watch('description')) {
        setValue('description', data.description);
      }
      if (data.category && !watch('title')) {
        setValue('title', `${data.severity} Severity ${data.category}`);
      }
      
      toast.success('AI analysis complete', { id: loadingToast });
    } catch (error) {
      console.error(error);
      toast.error('Failed to analyze image with AI', { id: loadingToast });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addIssue = useStore((state) => state.addIssue);
  const addAuditLog = useStore((state) => state.addAuditLog);
  const addPointsAndXp = useStore((state) => state.addPointsAndXp);

  const onSubmit = async (data: ReportForm) => {
    if (!imagePreview) {
      toast.error('Please upload an image of the issue');
      return;
    }

    if (!user) {
      toast.error('You must be signed in to submit reports');
      return;
    }

    setIsSubmitting(true);
    const progressToast = toast.loading('Uploading evidence and saving report...');

    try {
      const issueId = Math.random().toString(36).substring(7);
      
      let finalImageUrl = imagePreview;

      let lat = 37.7749;
      let lng = -122.4194;
      if (data.address.includes(',')) {
        const parts = data.address.split(',');
        const parsedLat = parseFloat(parts[0]);
        const parsedLng = parseFloat(parts[1]);
        if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
          lat = parsedLat;
          lng = parsedLng;
        }
      }

      const newIssue = {
        id: issueId,
        title: data.title,
        description: data.description || 'No description provided.',
        category: data.category,
        severity: data.severity,
        status: 'Submitted' as const,
        location: { 
          lat, 
          lng, 
          address: data.address 
        },
        imageUrl: finalImageUrl,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        reporterId: user.uid,
        reporterName: user.displayName,
        upvotes: 1,
        departmentId: getDepartmentIdFromCategory(data.category)
      };

      addIssue(newIssue);
      addPointsAndXp(50, 100);
      toast.success('Earned +50 Points & +100 XP!');

      addAuditLog(
        issueId,
        user.uid,
        user.displayName,
        'Report Submitted',
        `Issue reported: ${data.title}`
      );

      toast.success('Report submitted successfully!', { id: progressToast });
      navigate('/citizen/home');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report. Please try again.', { id: progressToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setValue('address', `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
          toast.success('GPS coordinates detected');
        },
        (error) => {
          toast.error('Unable to retrieve your location');
        }
      );
    }
  };

  return (
    <div className="max-w-lg mx-auto pb-6" id="citizen-report-issue-form-container">
      <div className="text-left mb-5">
        <h2 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>Lodge Civil Complaint</span>
        </h2>
        <h1 className="text-xl font-black text-neutral-900 mt-1">Submit Neighborhood Concern</h1>
        <p className="text-xs text-neutral-400 font-semibold mt-1">
          Our built-in Gemini engine analyzes captured evidence to estimate category and resolve severity instantly.
        </p>
      </div>

      <div className="bg-white border border-neutral-100 rounded-3xl overflow-hidden shadow-xs">
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
          
          {/* Photo Evidence Area */}
          <div>
            <label className="block text-xs font-black text-neutral-400 uppercase tracking-wider mb-2 text-left">Photo Evidence</label>
            <div 
              className={`flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-2xl transition-colors ${
                imagePreview ? 'border-emerald-300 bg-emerald-50/20' : 'border-neutral-200 hover:border-emerald-400 hover:bg-neutral-50'
              }`}
            >
              <div className="space-y-2 text-center w-full">
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="mx-auto h-48 w-full object-cover rounded-xl shadow-sm" />
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 shadow-md focus:outline-none transition cursor-pointer"
                    >
                      <AlertCircle className="w-4 h-4" />
                    </button>
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-white/85 flex flex-col items-center justify-center rounded-xl backdrop-blur-xs">
                        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
                        <span className="text-xs font-black text-neutral-800">Gemini is analyzing evidence...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Camera className="mx-auto h-10 w-10 text-neutral-400 animate-pulse" />
                    <div className="flex text-xs text-neutral-600 justify-center">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-black text-emerald-600 hover:text-emerald-500 focus-within:outline-none"
                      >
                        <span>Upload photo</span>
                        <input id="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} ref={fileInputRef} />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-[10px] text-neutral-400">PNG, JPG up to 10MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 text-left">
            <div>
              <label htmlFor="title" className="block text-xs font-black text-neutral-400 uppercase tracking-wider mb-1">
                Title
              </label>
              <input
                type="text"
                id="title"
                className="focus:ring-2 focus:ring-emerald-500 focus:outline-none block w-full text-xs font-semibold border-neutral-200 rounded-xl p-3 border text-neutral-800"
                placeholder="e.g. Broken water valve"
                {...register('title', { required: 'Title is required' })}
              />
              {errors.title && <p className="mt-2 text-xs text-red-600 font-bold">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-xs font-black text-neutral-400 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  id="category"
                  className="focus:ring-2 focus:ring-emerald-500 focus:outline-none block w-full text-xs font-semibold border-neutral-200 rounded-xl p-3 border bg-white text-neutral-800"
                  {...register('category', { required: 'Category is required' })}
                >
                  <option value="">Select Category</option>
                  <option value="Pothole">Pothole</option>
                  <option value="Water Leakage">Water Leakage</option>
                  <option value="Waste Accumulation">Waste Accumulation</option>
                  <option value="Broken Road">Broken Road</option>
                  <option value="Damaged Light">Damaged Light</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="severity" className="block text-xs font-black text-neutral-400 uppercase tracking-wider mb-1">
                  Severity
                </label>
                <select
                  id="severity"
                  className="focus:ring-2 focus:ring-emerald-500 focus:outline-none block w-full text-xs font-semibold border-neutral-200 rounded-xl p-3 border bg-white text-neutral-800"
                  {...register('severity', { required: 'Severity is required' })}
                >
                  <option value="">Select Severity</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-xs font-black text-neutral-400 uppercase tracking-wider mb-1">
                Address / Coordinates
              </label>
              <div className="flex rounded-xl border border-neutral-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500">
                <input
                  type="text"
                  id="address"
                  className="flex-1 focus:outline-none block w-full text-xs font-semibold p-3 text-neutral-800"
                  placeholder="e.g. 12.9716, 77.5946 or Crescent Heights"
                  {...register('address', { required: 'Address is required' })}
                />
                <button
                  type="button"
                  onClick={getLocation}
                  className="inline-flex items-center px-4 bg-neutral-50 border-l border-neutral-200 text-emerald-600 text-xs font-black hover:bg-neutral-100 transition cursor-pointer"
                >
                  <MapPin className="h-4 w-4 mr-1 shrink-0" />
                  Locate
                </button>
              </div>
              {errors.address && <p className="mt-2 text-xs text-red-600 font-bold">{errors.address.message}</p>}
            </div>

            <div>
              <label htmlFor="description" className="block text-xs font-black text-neutral-400 uppercase tracking-wider mb-1">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                className="focus:ring-2 focus:ring-emerald-500 focus:outline-none block w-full text-xs font-semibold border border-neutral-200 rounded-xl p-3 text-neutral-800"
                placeholder="Include landmark hints..."
                {...register('description')}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-100 flex justify-end gap-3.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => navigate(-1)}
              className="bg-white py-2.5 px-4 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isAnalyzing}
              className="inline-flex justify-center py-2.5 px-4 border border-transparent text-xs font-black uppercase tracking-wide rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition shadow-xs cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-1.5" />
                  Submit Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}