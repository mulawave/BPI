"use client";

import { useState, useRef, DragEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdVisibility,
  MdVisibilityOff,
  MdPlayCircleOutline,
  MdSchool,
  MdExpandMore,
  MdExpandLess,
  MdCloudUpload,
  MdClose,
  MdImage,
} from "react-icons/md";
import { format } from "date-fns";

type Course = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  thumbnailUrl: string | null;
  estimatedHours: number | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  TrainingLesson: Lesson[];
  _count: {
    TrainingLesson: number;
    TrainingProgress: number;
  };
};

type Lesson = {
  id: string;
  courseId: string;
  title: string;
  content: string;
  videoUrl: string | null;
  documentUrl: string | null;
  lessonOrder: number;
  estimatedMinutes: number | null;
};

export default function TrainingAdminPage() {
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [selectedCourseForLesson, setSelectedCourseForLesson] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());

  const { data: courses, isLoading, refetch } = api.admin.getAllCourses.useQuery();

  const createCourseMutation = api.admin.createCourse.useMutation({
    onSuccess: () => {
      toast.success("Course created successfully!");
      setShowCourseModal(false);
      refetch();
    },
    onError: (error) => toast.error(`Failed to create: ${error.message}`),
  });

  const updateCourseMutation = api.admin.updateCourse.useMutation({
    onSuccess: () => {
      toast.success("Course updated successfully!");
      setEditingCourse(null);
      refetch();
    },
    onError: (error) => toast.error(`Failed to update: ${error.message}`),
  });

  const deleteCourseMutation = api.admin.deleteCourse.useMutation({
    onSuccess: () => {
      toast.success("Course deleted successfully!");
      refetch();
    },
    onError: (error) => toast.error(`Failed to delete: ${error.message}`),
  });

  const createLessonMutation = api.admin.createLesson.useMutation({
    onSuccess: () => {
      toast.success("Lesson created successfully!");
      setShowLessonModal(false);
      setEditingLesson(null);
      refetch();
    },
    onError: (error) => toast.error(`Failed to create: ${error.message}`),
  });

  const updateLessonMutation = api.admin.updateLesson.useMutation({
    onSuccess: () => {
      toast.success("Lesson updated successfully!");
      setShowLessonModal(false);
      setEditingLesson(null);
      refetch();
    },
    onError: (error) => toast.error(`Failed to update: ${error.message}`),
  });

  const deleteLessonMutation = api.admin.deleteLesson.useMutation({
    onSuccess: () => {
      toast.success("Lesson deleted successfully!");
      refetch();
    },
    onError: (error) => toast.error(`Failed to delete: ${error.message}`),
  });

  const toggleCourseActive = (courseId: string, isActive: boolean) => {
    updateCourseMutation.mutate({ courseId, isActive: !isActive });
  };

  const toggleCourseExpanded = (courseId: string) => {
    const newExpanded = new Set(expandedCourses);
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId);
    } else {
      newExpanded.add(courseId);
    }
    setExpandedCourses(newExpanded);
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
            <h1 className="text-3xl font-bold text-foreground">Training Center</h1>
            <p className="text-muted-foreground mt-1">Manage courses and lessons for members</p>
          </div>
          <button
            onClick={() => setShowCourseModal(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <MdAdd size={20} />
            Add Course
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-sm text-muted-foreground">Total Courses</div>
            <div className="text-2xl font-bold">{courses?.length || 0}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-sm text-muted-foreground">Active Courses</div>
            <div className="text-2xl font-bold text-green-600">
              {courses?.filter((c) => c.isActive).length || 0}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-sm text-muted-foreground">Total Lessons</div>
            <div className="text-2xl font-bold">
              {courses?.reduce((sum, c) => sum + c._count.TrainingLesson, 0) || 0}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-sm text-muted-foreground">Student Enrollments</div>
            <div className="text-2xl font-bold">
              {courses?.reduce((sum, c) => sum + c._count.TrainingProgress, 0) || 0}
            </div>
          </div>
        </div>

        {/* Courses List */}
        <div className="space-y-4">
          {courses?.map((course) => (
            <div key={course.id} className="rounded-lg border border-border bg-card">
              {/* Course Header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <button
                    onClick={() => toggleCourseExpanded(course.id)}
                    className="rounded p-1 hover:bg-muted"
                  >
                    {expandedCourses.has(course.id) ? (
                      <MdExpandLess size={24} />
                    ) : (
                      <MdExpandMore size={24} />
                    )}
                  </button>
                  <MdSchool size={32} className="text-primary" />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{course.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {course.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {course.category}
                      </span>
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        {course.difficulty}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {course._count.TrainingLesson} lessons
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {course._count.TrainingProgress} students
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {course.isActive ? (
                    <span className="rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-xs font-medium text-green-800 dark:text-green-300">
                      Active
                    </span>
                  ) : (
                    <span className="rounded-full bg-gray-100 dark:bg-gray-900/30 px-3 py-1 text-xs font-medium text-gray-800 dark:text-gray-300">
                      Inactive
                    </span>
                  )}
                  <button
                    onClick={() => toggleCourseActive(course.id, course.isActive)}
                    className="rounded p-2 hover:bg-muted"
                    title={course.isActive ? "Deactivate" : "Activate"}
                  >
                    {course.isActive ? (
                      <MdVisibilityOff size={20} className="text-orange-500" />
                    ) : (
                      <MdVisibility size={20} className="text-green-500" />
                    )}
                  </button>
                  <button
                    onClick={() => setEditingCourse(course)}
                    className="rounded p-2 hover:bg-muted"
                    title="Edit Course"
                  >
                    <MdEdit size={20} className="text-blue-500" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCourseForLesson(course.id);
                      setShowLessonModal(true);
                    }}
                    className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-sm text-primary hover:bg-primary/20"
                  >
                    <MdAdd size={16} />
                    Add Lesson
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Delete this course and all its lessons?")) {
                        deleteCourseMutation.mutate({ courseId: course.id });
                      }
                    }}
                    className="rounded p-2 hover:bg-muted"
                    title="Delete Course"
                  >
                    <MdDelete size={20} className="text-red-500" />
                  </button>
                </div>
              </div>

              {/* Lessons (when expanded) */}
              {expandedCourses.has(course.id) && (
                <div className="border-t border-border bg-muted/30 p-4">
                  {course.TrainingLesson.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No lessons yet. Click "Add Lesson" to create one.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {course.TrainingLesson.map((lesson, index) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                              {index + 1}
                            </span>
                            <MdPlayCircleOutline size={20} className="text-muted-foreground" />
                            <div>
                              <div className="font-medium">{lesson.title}</div>
                              {lesson.estimatedMinutes && (
                                <div className="text-xs text-muted-foreground">
                                  {lesson.estimatedMinutes} minutes
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingLesson(lesson);
                                setSelectedCourseForLesson(course.id);
                                setShowLessonModal(true);
                              }}
                              className="rounded p-1 hover:bg-muted"
                              title="Edit Lesson"
                            >
                              <MdEdit size={18} className="text-blue-500" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Delete this lesson?")) {
                                  deleteLessonMutation.mutate({ lessonId: lesson.id });
                                }
                              }}
                              className="rounded p-1 hover:bg-muted"
                              title="Delete Lesson"
                            >
                              <MdDelete size={18} className="text-red-500" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Course Modal */}
      {(showCourseModal || editingCourse) && (
        <CourseFormModal
          course={editingCourse}
          onClose={() => {
            setShowCourseModal(false);
            setEditingCourse(null);
          }}
          onSubmit={(data) => {
            if (editingCourse) {
              updateCourseMutation.mutate({ courseId: editingCourse.id, ...data });
            } else {
              createCourseMutation.mutate(data);
            }
          }}
        />
      )}

      {/* Lesson Modal */}
      {showLessonModal && (
        <LessonFormModal
          courseId={selectedCourseForLesson}
          lesson={editingLesson}
          onClose={() => {
            setShowLessonModal(false);
            setEditingLesson(null);
            setSelectedCourseForLesson(null);
          }}
          onSubmit={(data) => {
            if (editingLesson) {
              updateLessonMutation.mutate({ lessonId: editingLesson.id, ...data });
            } else {
              createLessonMutation.mutate({ courseId: selectedCourseForLesson!, ...data });
            }
          }}
        />
      )}
    </div>
  );
}

function CourseFormModal({
  course,
  onClose,
  onSubmit,
}: {
  course: Course | null;
  onClose: () => void;
  onSubmit: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    title: course?.title || "",
    description: course?.description || "",
    category: course?.category || "financial-literacy",
    difficulty: course?.difficulty || "beginner",
    thumbnailUrl: course?.thumbnailUrl || "",
    estimatedHours: course?.estimatedHours || 1,
  });

  const [uploadedImages, setUploadedImages] = useState<string[]>(
    course?.thumbnailUrl ? [course.thumbnailUrl] : []
  );
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast.error('Please select only image files');
      return;
    }

    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImages(prev => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Use first image as thumbnail URL, or keep existing URL if no images uploaded
    const thumbnailUrl = uploadedImages.length > 0 ? uploadedImages[0] : formData.thumbnailUrl;
    onSubmit({ ...formData, thumbnailUrl });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl rounded-lg border border-border bg-card p-6 shadow-xl"
      >
        <h2 className="text-2xl font-bold mb-4">{course ? "Edit Course" : "Create Course"}</h2>

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
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 min-h-[100px]"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                required
              >
                <option value="financial-literacy">Financial Literacy</option>
                <option value="cryptocurrency">Cryptocurrency</option>
                <option value="investment">Investment</option>
                <option value="business">Business</option>
                <option value="personal-development">Personal Development</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Difficulty *</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                required
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Image Upload Section */}
          <div>
            <label className="block text-sm font-medium mb-2">Course Images</label>
            
            {/* Drag and Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300 ${
                isDragging
                  ? 'border-primary bg-primary/5 scale-[1.02]'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <motion.div
                  animate={{
                    y: isDragging ? -10 : 0,
                    scale: isDragging ? 1.1 : 1,
                  }}
                  className="mb-4"
                >
                  <div className="rounded-full bg-primary/10 p-4">
                    <MdCloudUpload className="h-12 w-12 text-primary" />
                  </div>
                </motion.div>
                
                <p className="text-sm font-medium text-foreground mb-1">
                  {isDragging ? 'Drop images here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, GIF up to 10MB (multiple images supported)
                </p>
              </div>
            </div>

            {/* Image Preview Grid */}
            {uploadedImages.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    {uploadedImages.length} image{uploadedImages.length !== 1 ? 's' : ''} uploaded
                  </p>
                  <button
                    type="button"
                    onClick={() => setUploadedImages([])}
                    className="text-xs text-red-500 hover:text-red-600 font-medium"
                  >
                    Clear All
                  </button>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <AnimatePresence mode="popLayout">
                    {uploadedImages.map((image, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="relative group aspect-video rounded-lg overflow-hidden border-2 border-border bg-muted"
                      >
                        <img
                          src={image}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(index);
                            }}
                            className="opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all duration-300 rounded-full bg-red-500 p-2 text-white hover:bg-red-600"
                          >
                            <MdClose className="h-5 w-5" />
                          </button>
                        </div>

                        {/* Primary Badge */}
                        {index === 0 && (
                          <div className="absolute top-2 left-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground shadow-lg">
                              <MdImage className="h-3 w-3" />
                              Primary
                            </span>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                
                <p className="text-xs text-muted-foreground mt-2">
                  The first image will be used as the course thumbnail
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Estimated Hours</label>
              <input
                type="number"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: parseFloat(e.target.value) })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                min="0.5"
                step="0.5"
              />
            </div>
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
              {course ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function LessonFormModal({
  courseId,
  lesson,
  onClose,
  onSubmit,
}: {
  courseId: string | null;
  lesson: Lesson | null;
  onClose: () => void;
  onSubmit: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    title: lesson?.title || "",
    content: lesson?.content || "",
    videoUrl: lesson?.videoUrl || "",
    documentUrl: lesson?.documentUrl || "",
    lessonOrder: lesson?.lessonOrder || 1,
    estimatedMinutes: lesson?.estimatedMinutes || 10,
  });

  const [uploadedVideo, setUploadedVideo] = useState<string | null>(lesson?.videoUrl || null);
  const [uploadedDocument, setUploadedDocument] = useState<string | null>(lesson?.documentUrl || null);
  const [isVideoDragging, setIsVideoDragging] = useState(false);
  const [isDocDragging, setIsDocDragging] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Video upload handlers
  const handleVideoDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsVideoDragging(true);
  };

  const handleVideoDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsVideoDragging(false);
  };

  const handleVideoDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsVideoDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleVideoFile(files[0]);
  };

  const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleVideoFile(e.target.files[0]);
    }
  };

  const handleVideoFile = (file: File) => {
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedVideo(result);
      toast.success('Video uploaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  // Document upload handlers
  const handleDocDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDocDragging(true);
  };

  const handleDocDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDocDragging(false);
  };

  const handleDocDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDocDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleDocFile(files[0]);
  };

  const handleDocFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleDocFile(e.target.files[0]);
    }
  };

  const handleDocFile = (file: File) => {
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid document file (PDF, DOC, DOCX, TXT)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedDocument(result);
      toast.success('Document uploaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Use uploaded files if available, otherwise use URLs
    const videoUrl = uploadedVideo || formData.videoUrl;
    const documentUrl = uploadedDocument || formData.documentUrl;
    onSubmit({ ...formData, videoUrl, documentUrl });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl rounded-lg border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-2xl font-bold mb-4">{lesson ? "Edit Lesson" : "Create Lesson"}</h2>

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
            <label className="block text-sm font-medium mb-1">Content *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 min-h-[200px]"
              rows={8}
              required
              placeholder="Lesson content in markdown format..."
            />
          </div>

          {/* Video Upload/URL Section */}
          <div>
            <label className="block text-sm font-medium mb-2">Lesson Video</label>
            
            {/* Upload Zone */}
            <div
              onDragOver={handleVideoDragOver}
              onDragLeave={handleVideoDragLeave}
              onDrop={handleVideoDrop}
              onClick={() => videoInputRef.current?.click()}
              className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300 mb-3 ${
                isVideoDragging
                  ? 'border-primary bg-primary/5 scale-[1.02]'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
              }`}
            >
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoFileSelect}
                className="hidden"
              />
              
              <div className="flex flex-col items-center justify-center py-6 px-4">
                <motion.div
                  animate={{
                    y: isVideoDragging ? -8 : 0,
                    scale: isVideoDragging ? 1.1 : 1,
                  }}
                  className="mb-3"
                >
                  <div className="rounded-full bg-purple-500/10 p-3">
                    <MdPlayCircleOutline className="h-10 w-10 text-purple-600" />
                  </div>
                </motion.div>
                
                <p className="text-sm font-medium text-foreground mb-1">
                  {isVideoDragging ? 'Drop video here' : 'Upload Video File'}
                </p>
                <p className="text-xs text-muted-foreground">
                  MP4, MOV, AVI up to 100MB
                </p>
              </div>

              {uploadedVideo && (
                <div className="absolute top-2 right-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadedVideo(null);
                    }}
                    className="rounded-full bg-red-500 p-1.5 text-white hover:bg-red-600 shadow-lg"
                  >
                    <MdClose className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {uploadedVideo && (
              <div className="mb-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <MdPlayCircleOutline className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-300">
                    Video uploaded successfully
                  </span>
                </div>
              </div>
            )}

            {/* OR Divider */}
            <div className="relative mb-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or use URL</span>
              </div>
            </div>

            {/* URL Input */}
            <input
              type="url"
              value={formData.videoUrl}
              onChange={(e) => {
                setFormData({ ...formData, videoUrl: e.target.value });
                if (e.target.value) setUploadedVideo(null);
              }}
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          {/* Document Upload/URL Section */}
          <div>
            <label className="block text-sm font-medium mb-2">Lesson Document</label>
            
            {/* Upload Zone */}
            <div
              onDragOver={handleDocDragOver}
              onDragLeave={handleDocDragLeave}
              onDrop={handleDocDrop}
              onClick={() => docInputRef.current?.click()}
              className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300 mb-3 ${
                isDocDragging
                  ? 'border-primary bg-primary/5 scale-[1.02]'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
              }`}
            >
              <input
                ref={docInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleDocFileSelect}
                className="hidden"
              />
              
              <div className="flex flex-col items-center justify-center py-6 px-4">
                <motion.div
                  animate={{
                    y: isDocDragging ? -8 : 0,
                    scale: isDocDragging ? 1.1 : 1,
                  }}
                  className="mb-3"
                >
                  <div className="rounded-full bg-blue-500/10 p-3">
                    <MdCloudUpload className="h-10 w-10 text-blue-600" />
                  </div>
                </motion.div>
                
                <p className="text-sm font-medium text-foreground mb-1">
                  {isDocDragging ? 'Drop document here' : 'Upload Document File'}
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, DOC, DOCX, TXT up to 50MB
                </p>
              </div>

              {uploadedDocument && (
                <div className="absolute top-2 right-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadedDocument(null);
                    }}
                    className="rounded-full bg-red-500 p-1.5 text-white hover:bg-red-600 shadow-lg"
                  >
                    <MdClose className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {uploadedDocument && (
              <div className="mb-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <MdCloudUpload className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-300">
                    Document uploaded successfully
                  </span>
                </div>
              </div>
            )}

            {/* OR Divider */}
            <div className="relative mb-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or use URL</span>
              </div>
            </div>

            {/* URL Input */}
            <input
              type="url"
              value={formData.documentUrl}
              onChange={(e) => {
                setFormData({ ...formData, documentUrl: e.target.value });
                if (e.target.value) setUploadedDocument(null);
              }}
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
              placeholder="https://example.com/lesson.pdf"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Lesson Order</label>
              <input
                type="number"
                value={formData.lessonOrder}
                onChange={(e) => setFormData({ ...formData, lessonOrder: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Estimated Minutes</label>
              <input
                type="number"
                value={formData.estimatedMinutes}
                onChange={(e) => setFormData({ ...formData, estimatedMinutes: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                min="1"
              />
            </div>
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
              {lesson ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
