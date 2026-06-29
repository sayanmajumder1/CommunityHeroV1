import { useState, useRef, ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { Camera, Upload, AlertCircle, Loader2, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { useStore } from '../store';
import { IssueCategory, IssueSeverity } from '../types';

interface ReportForm {
  title: string;
  description: string;
  category: IssueCategory;
  severity: IssueSeverity;
  address: string;
}

export default function ReportIssue() {
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
      const base64 = event.target?.result as string;
      setImagePreview(base64);
      await analyzeImage(base64);
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

      // 2. Parse GPS coordinates or default
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
        upvotes: 1
      };

      // 3. Write directly to our offline-first local state store
      addIssue(newIssue);
      
      // Award citizen with Points and XP
      addPointsAndXp(50, 100);
      toast.success('Earned +50 Points & +100 XP!');

      // 5. Write audit log entry
      addAuditLog(
        issueId,
        user.uid,
        user.displayName,
        'Report Submitted',
        `Issue reported: ${data.title}`
      );

      toast.success('Report submitted successfully!', { id: progressToast });
      navigate('/');
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
    <div className="max-w-3xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-neutral-900 sm:text-3xl sm:truncate tracking-tight">
            Report Civic Issue
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Help improve your community by reporting infrastructure problems. Our AI will analyze the image to categorize and estimate severity automatically.
          </p>
        </div>
      </div>

      <div className="bg-white shadow border border-neutral-200 rounded-xl overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-8">
          
          {/* Image Upload Area */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Photo Evidence</label>
            <div 
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-colors ${
                imagePreview ? 'border-blue-300 bg-blue-50' : 'border-neutral-300 hover:border-blue-400 hover:bg-neutral-50'
              }`}
            >
              <div className="space-y-2 text-center w-full">
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="mx-auto h-56 w-full object-cover rounded-lg shadow-sm" />
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 shadow-md focus:outline-none transition"
                    >
                      <AlertCircle className="w-5 h-5" />
                    </button>
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center rounded-lg backdrop-blur-sm">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                        <span className="text-sm font-bold text-neutral-950">AI is analyzing evidence...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Camera className="mx-auto h-12 w-12 text-neutral-400" />
                    <div className="flex text-sm text-neutral-600 justify-center">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-semibold text-blue-600 hover:text-blue-500 focus-within:outline-none"
                      >
                        <span>Upload photo</span>
                        <input id="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} ref={fileInputRef} />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-neutral-500">PNG, JPG, GIF up to 10MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="title" className="block text-sm font-semibold text-neutral-700">
                Title
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="title"
                  className="focus:ring-2 focus:ring-blue-500 focus:outline-none block w-full sm:text-sm border-neutral-300 rounded-lg p-2.5 border"
                  placeholder="e.g. Medium Pothole"
                  {...register('title', { required: 'Title is required' })}
                />
              </div>
              {errors.title && <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>}
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-neutral-700">
                Category
              </label>
              <div className="mt-1">
                <select
                  id="category"
                  className="focus:ring-2 focus:ring-blue-500 focus:outline-none block w-full sm:text-sm border-neutral-300 rounded-lg p-2.5 border bg-white"
                  {...register('category', { required: 'Category is required' })}
                >
                  <option value="">Select a category</option>
                  <option value="Pothole">Pothole</option>
                  <option value="Water Leakage">Water Leakage</option>
                  <option value="Waste Accumulation">Waste Accumulation</option>
                  <option value="Broken Road">Broken Road</option>
                  <option value="Damaged Light">Damaged Light</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="severity" className="block text-sm font-semibold text-neutral-700">
                Severity
              </label>
              <div className="mt-1">
                <select
                  id="severity"
                  className="focus:ring-2 focus:ring-blue-500 focus:outline-none block w-full sm:text-sm border-neutral-300 rounded-lg p-2.5 border bg-white"
                  {...register('severity', { required: 'Severity is required' })}
                >
                  <option value="">Select severity</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="address" className="block text-sm font-semibold text-neutral-700">
                Address / Coordinates
              </label>
              <div className="mt-1 flex rounded-lg shadow-sm border border-neutral-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                <input
                  type="text"
                  id="address"
                  className="flex-1 focus:outline-none block w-full min-w-0 sm:text-sm p-2.5"
                  placeholder="Street address or nearest landmark"
                  {...register('address', { required: 'Address is required' })}
                />
                <button
                  type="button"
                  onClick={getLocation}
                  className="inline-flex items-center px-4 bg-neutral-50 border-l border-neutral-200 text-neutral-600 sm:text-sm hover:bg-neutral-100 transition"
                >
                  <MapPin className="h-4 w-4 mr-1 text-blue-600" />
                  Locate Me
                </button>
              </div>
              {errors.address && <p className="mt-2 text-sm text-red-600">{errors.address.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-sm font-semibold text-neutral-700">
                Description
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  rows={4}
                  className="focus:ring-2 focus:ring-blue-500 focus:outline-none block w-full sm:text-sm border border-neutral-300 rounded-lg p-2.5"
                  placeholder="Provide any additional details or references here..."
                  {...register('description')}
                />
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-neutral-200 flex justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => navigate(-1)}
              className="bg-white py-2 px-4 border border-neutral-300 rounded-lg text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isAnalyzing}
              className="inline-flex justify-center py-2 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
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
