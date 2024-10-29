import React, { useCallback, useState } from 'react';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { v4 as uuidv4 } from 'uuid';

export function PhotoUpload() {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const handleUpload = async (file: File) => {
    if (!user) {
      setError('Please log in to upload photos');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    try {
      setError(null);
      setUploading(true);
      
      const fileId = uuidv4();
      const fileName = `${fileId}-${file.name.toLowerCase().replace(/[^a-z0-9.]/g, '-')}`;
      const storageRef = ref(storage, `photos/${user.id}/${fileName}`);
      
      // Upload to Firebase Storage with metadata
      const metadata = {
        contentType: file.type,
        customMetadata: {
          userId: user.id,
          originalName: file.name
        }
      };
      
      const snapshot = await uploadBytes(storageRef, file, metadata);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Save to Firestore with server timestamp
      await addDoc(collection(db, 'photos'), {
        userId: user.id,
        url: downloadURL,
        title: file.name,
        createdAt: serverTimestamp(),
        size: file.size,
        type: file.type,
        fileName: fileName,
        path: `photos/${user.id}/${fileName}`
      });

      // Trigger a reload of the image grid
      window.dispatchEvent(new CustomEvent('photoUploaded'));
    } catch (error: any) {
      console.error('Upload failed:', error);
      setError(error.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      setDragActive(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles[0]) {
      handleUpload(imageFiles[0]);
    } else {
      setError('Please upload an image file');
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
          dragActive 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl"></div>
        
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
            <p className="text-sm text-gray-600">Uploading your masterpiece...</p>
          </div>
        ) : (
          <div className="relative">
            <Upload className="mx-auto h-12 w-12 text-blue-500" />
            <p className="mt-2 text-sm text-gray-600">
              Drag and drop your photos here, or
            </p>
            <label className="mt-2 inline-block">
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileInput}
              />
              <span className="cursor-pointer text-blue-500 hover:text-blue-600 font-medium">
                browse to upload
              </span>
            </label>
            <p className="mt-2 text-xs text-gray-500">
              Supports: JPG, PNG, WebP • Max size: 10MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
}