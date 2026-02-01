"use client";

import { useState, useRef, DragEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdDownload,
  MdImage,
  MdPictureAsPdf,
  MdVideoLibrary,
  MdInsertDriveFile,
  MdVisibility,
  MdVisibilityOff,
  MdCloudUpload,
  MdClose,
} from "react-icons/md";
import { format } from "date-fns";

type Material = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  category: string;
  fileUrl: string;
  thumbnailUrl: string | null;
  fileSize: number | null;
  downloadCount: number;
  shareCount: number;
  isActive: boolean;
  createdAt: Date;
};

export default function PromotionalMaterialsAdminPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const { data: materials, isLoading, refetch } = api.admin.getAllPromotionalMaterials.useQuery();

  const createMutation = api.admin.createPromotionalMaterial.useMutation({
    onSuccess: () => {
      toast.success("Material created successfully!");
      setShowCreateModal(false);
      refetch();
    },
    onError: (error) => toast.error(`Failed to create: ${error.message}`),
  });

  const updateMutation = api.admin.updatePromotionalMaterial.useMutation({
    onSuccess: () => {
      toast.success("Material updated successfully!");
      setEditingMaterial(null);
      refetch();
    },
    onError: (error) => toast.error(`Failed to update: ${error.message}`),
  });

  const deleteMutation = api.admin.deletePromotionalMaterial.useMutation({
    onSuccess: () => {
      toast.success("Material deleted successfully!");
      refetch();
    },
    onError: (error) => toast.error(`Failed to delete: ${error.message}`),
  });

  const toggleActiveMutation = api.admin.togglePromotionalMaterialActive.useMutation({
    onSuccess: () => {
      toast.success("Material status updated!");
      refetch();
    },
    onError: (error) => toast.error(`Failed to update: ${error.message}`),
  });

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "image":
        return <MdImage className="text-blue-500" size={24} />;
      case "video":
        return <MdVideoLibrary className="text-red-500" size={24} />;
      case "pdf":
        return <MdPictureAsPdf className="text-red-600" size={24} />;
      default:
        return <MdInsertDriveFile className="text-gray-500" size={24} />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Promotional Materials</h1>
            <p className="text-muted-foreground mt-1">Manage downloadable marketing materials</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <MdAdd size={20} />
            Add Material
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-sm text-muted-foreground">Total Materials</div>
            <div className="text-2xl font-bold">{materials?.length || 0}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-sm text-muted-foreground">Active</div>
            <div className="text-2xl font-bold text-green-600">
              {materials?.filter((m) => m.isActive).length || 0}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-sm text-muted-foreground">Total Downloads</div>
            <div className="text-2xl font-bold">
              {materials?.reduce((sum, m) => sum + m.downloadCount, 0) || 0}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-sm text-muted-foreground">Total Shares</div>
            <div className="text-2xl font-bold">
              {materials?.reduce((sum, m) => sum + m.shareCount, 0) || 0}
            </div>
          </div>
        </div>

        {/* Materials List */}
        <div className="rounded-lg border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Downloads</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {materials?.map((material) => (
                  <tr key={material.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3">{getTypeIcon(material.type)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{material.title}</div>
                      {material.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {material.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        {material.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">{material.downloadCount}</td>
                    <td className="px-4 py-3">
                      {material.isActive ? (
                        <span className="rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-1 text-xs font-medium text-green-800 dark:text-green-300">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 dark:bg-gray-900/30 px-2 py-1 text-xs font-medium text-gray-800 dark:text-gray-300">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {format(new Date(material.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleActiveMutation.mutate({ id: material.id })}
                          className="rounded p-1 hover:bg-muted"
                          title={material.isActive ? "Deactivate" : "Activate"}
                        >
                          {material.isActive ? (
                            <MdVisibilityOff size={18} className="text-orange-500" />
                          ) : (
                            <MdVisibility size={18} className="text-green-500" />
                          )}
                        </button>
                        <button
                          onClick={() => setEditingMaterial(material)}
                          className="rounded p-1 hover:bg-muted"
                          title="Edit"
                        >
                          <MdEdit size={18} className="text-blue-500" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this material?")) {
                              deleteMutation.mutate({ id: material.id });
                            }
                          }}
                          className="rounded p-1 hover:bg-muted"
                          title="Delete"
                        >
                          <MdDelete size={18} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingMaterial) && (
        <MaterialFormModal
          material={editingMaterial}
          onClose={() => {
            setShowCreateModal(false);
            setEditingMaterial(null);
          }}
          onSubmit={(data) => {
            if (editingMaterial) {
              updateMutation.mutate({ id: editingMaterial.id, ...data });
            } else {
              createMutation.mutate(data);
            }
          }}
        />
      )}
    </div>
  );
}

function MaterialFormModal({
  material,
  onClose,
  onSubmit,
}: {
  material: Material | null;
  onClose: () => void;
  onSubmit: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    title: material?.title || "",
    description: material?.description || "",
    type: material?.type || "pdf",
    category: material?.category || "brochures",
    fileUrl: material?.fileUrl || "",
    thumbnailUrl: material?.thumbnailUrl || "",
  });

  const [uploadedFile, setUploadedFile] = useState<string | null>(material?.fileUrl || null);
  const [uploadedThumbnail, setUploadedThumbnail] = useState<string | null>(material?.thumbnailUrl || null);
  const [isFileDragging, setIsFileDragging] = useState(false);
  const [isThumbnailDragging, setIsThumbnailDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // File upload handlers
  const handleFileDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsFileDragging(true);
  };

  const handleFileDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsFileDragging(false);
  };

  const handleFileDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsFileDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files[0]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedFile(result);
      toast.success('File uploaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  // Thumbnail upload handlers
  const handleThumbnailDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsThumbnailDragging(true);
  };

  const handleThumbnailDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsThumbnailDragging(false);
  };

  const handleThumbnailDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsThumbnailDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleThumbnailUpload(files[0]);
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleThumbnailUpload(e.target.files[0]);
    }
  };

  const handleThumbnailUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file for thumbnail');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedThumbnail(result);
      toast.success('Thumbnail uploaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fileUrl = uploadedFile || formData.fileUrl;
    const thumbnailUrl = uploadedThumbnail || formData.thumbnailUrl;
    onSubmit({ ...formData, fileUrl, thumbnailUrl });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl rounded-lg border border-border bg-card p-6 shadow-xl"
      >
        <h2 className="text-2xl font-bold mb-4">
          {material ? "Edit Material" : "Create Material"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 min-h-[100px]"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                required
              >
                <option value="pdf">PDF</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="document">Document</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                required
              >
                <option value="brochures">Brochures</option>
                <option value="flyers">Flyers</option>
                <option value="banners">Banners</option>
                <option value="social-media">Social Media</option>
                <option value="presentations">Presentations</option>
                <option value="videos">Videos</option>
              </select>
            </div>
          </div>

          {/* File Upload Section */}
          <div>
            <label className="block text-sm font-medium mb-2">Material File *</label>
            
            <div
              onDragOver={handleFileDragOver}
              onDragLeave={handleFileDragLeave}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300 mb-3 ${
                isFileDragging
                  ? 'border-primary bg-primary/5 scale-[1.02]'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div className="flex flex-col items-center justify-center py-6 px-4">
                <motion.div
                  animate={{
                    y: isFileDragging ? -8 : 0,
                    scale: isFileDragging ? 1.1 : 1,
                  }}
                  className="mb-3"
                >
                  <div className="rounded-full bg-blue-500/10 p-3">
                    <MdCloudUpload className="h-10 w-10 text-blue-600" />
                  </div>
                </motion.div>
                
                <p className="text-sm font-medium text-foreground mb-1">
                  {isFileDragging ? 'Drop file here' : 'Upload Material File'}
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, Images, Videos, Documents up to 100MB
                </p>
              </div>

              {uploadedFile && (
                <div className="absolute top-2 right-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadedFile(null);
                    }}
                    className="rounded-full bg-red-500 p-1.5 text-white hover:bg-red-600 shadow-lg"
                  >
                    <MdClose className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {uploadedFile && (
              <div className="mb-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <MdCloudUpload className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-300">
                    File uploaded successfully
                  </span>
                </div>
              </div>
            )}

            <div className="relative mb-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or use URL</span>
              </div>
            </div>

            <input
              type="url"
              value={formData.fileUrl}
              onChange={(e) => {
                setFormData({ ...formData, fileUrl: e.target.value });
                if (e.target.value) setUploadedFile(null);
              }}
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
              placeholder="https://example.com/file.pdf"
            />
          </div>

          {/* Thumbnail Upload Section */}
          <div>
            <label className="block text-sm font-medium mb-2">Thumbnail (optional)</label>
            
            <div
              onDragOver={handleThumbnailDragOver}
              onDragLeave={handleThumbnailDragLeave}
              onDrop={handleThumbnailDrop}
              onClick={() => thumbnailInputRef.current?.click()}
              className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300 mb-3 ${
                isThumbnailDragging
                  ? 'border-primary bg-primary/5 scale-[1.02]'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
              }`}
            >
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailSelect}
                className="hidden"
              />
              
              <div className="flex flex-col items-center justify-center py-6 px-4">
                <motion.div
                  animate={{
                    y: isThumbnailDragging ? -8 : 0,
                    scale: isThumbnailDragging ? 1.1 : 1,
                  }}
                  className="mb-3"
                >
                  <div className="rounded-full bg-purple-500/10 p-3">
                    <MdImage className="h-10 w-10 text-purple-600" />
                  </div>
                </motion.div>
                
                <p className="text-sm font-medium text-foreground mb-1">
                  {isThumbnailDragging ? 'Drop thumbnail here' : 'Upload Thumbnail Image'}
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>

              {uploadedThumbnail && (
                <div className="absolute top-2 right-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadedThumbnail(null);
                    }}
                    className="rounded-full bg-red-500 p-1.5 text-white hover:bg-red-600 shadow-lg"
                  >
                    <MdClose className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {uploadedThumbnail && (
              <div className="mb-3">
                <img
                  src={uploadedThumbnail}
                  alt="Thumbnail preview"
                  className="w-full h-40 object-cover rounded-lg border border-border"
                />
              </div>
            )}

            <div className="relative mb-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or use URL</span>
              </div>
            </div>

            <input
              type="url"
              value={formData.thumbnailUrl}
              onChange={(e) => {
                setFormData({ ...formData, thumbnailUrl: e.target.value });
                if (e.target.value) setUploadedThumbnail(null);
              }}
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
              placeholder="https://example.com/thumbnail.jpg"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            >
              {material ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
