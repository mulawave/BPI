"use client";

import React, { useState } from "react";
import { api } from "@/client/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileImage, 
  Download, 
  Share2, 
  Eye,
  Grid,
  List,
  Filter,
  Image,
  FileText,
  Video,
  Presentation,
  Mail,
  Facebook,
  Instagram,
  Twitter,
  X
} from "lucide-react";

interface PromotionalMaterialsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type MaterialCategory = "all" | "social-media" | "presentations" | "flyers" | "email-templates" | "videos";
type ViewMode = "grid" | "list";

export default function PromotionalMaterialsModal({ isOpen, onClose }: PromotionalMaterialsModalProps) {
  const [activeCategory, setActiveCategory] = useState<MaterialCategory>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Query promotional materials
  const { data: materials, isLoading } = api.promotionalMaterials.getMaterials.useQuery(
    { category: activeCategory === "all" ? undefined : activeCategory },
    { enabled: isOpen }
  );

  const downloadMutation = api.promotionalMaterials.downloadMaterial.useMutation();
  const shareMutation = api.promotionalMaterials.trackShare.useMutation();

  const handleDownload = (materialId: string, url: string) => {
    downloadMutation.mutate({ materialId });
    // Trigger download
    window.open(url, "_blank");
  };

  const handleShare = (materialId: string) => {
    shareMutation.mutate({ materialId });
    // Show share options or copy link
  };

  const categories = [
    { id: "all" as MaterialCategory, label: "All Materials", icon: Grid },
    { id: "social-media" as MaterialCategory, label: "Social Media", icon: Share2 },
    { id: "presentations" as MaterialCategory, label: "Presentations", icon: Presentation },
    { id: "flyers" as MaterialCategory, label: "Flyers & Posters", icon: FileImage },
    { id: "email-templates" as MaterialCategory, label: "Email Templates", icon: Mail },
    { id: "videos" as MaterialCategory, label: "Videos", icon: Video },
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "social-media":
        return Share2;
      case "presentations":
        return Presentation;
      case "flyers":
        return FileImage;
      case "email-templates":
        return Mail;
      case "videos":
        return Video;
      default:
        return FileText;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-green-900/30 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-full">
              <FileImage className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Promotional Materials Library</h2>
              <p className="text-indigo-100 text-sm">Professional marketing assets to grow your network</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <Card className="p-6 bg-gradient-to-br from-indigo-600 to-purple-600 text-white border-0">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <FileImage className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-1">Marketing Assets</h3>
              <p className="text-indigo-100">
                Download professional materials to promote BPI and grow your network
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{materials?.materials?.length || 0}</p>
              <p className="text-sm text-indigo-100">Available</p>
            </div>
          </div>
        </Card>

        {/* Filters & View Toggle */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => {
              const CategoryIcon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-colors ${
                    activeCategory === category.id
                      ? "bg-bpi-primary text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  <CategoryIcon className="w-4 h-4" />
                  {category.label}
                </button>
              );
            })}
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded ${
                viewMode === "grid"
                  ? "bg-white dark:bg-gray-700 text-bpi-primary"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded ${
                viewMode === "list"
                  ? "bg-white dark:bg-gray-700 text-bpi-primary"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Materials Display */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-bpi-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading materials...</p>
          </div>
        ) : materials?.materials && materials.materials.length > 0 ? (
          <div className={viewMode === "grid" ? "grid md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
            {materials.materials.map((material: any) => {
              const CategoryIcon = getCategoryIcon(material.category);

              return viewMode === "grid" ? (
                // Grid View
                <Card key={material.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                  {/* Thumbnail */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                    {material.thumbnailUrl ? (
                      <img
                        src={material.thumbnailUrl}
                        alt={material.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <CategoryIcon className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white text-xs font-semibold rounded">
                      {material.fileType?.toUpperCase() || 'FILE'}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h4 className="font-semibold text-foreground mb-2 line-clamp-1">{material.title}</h4>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {material.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        <span>{material.downloads}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{material.views}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleDownload(material.id, material.fileUrl)}
                        className="flex-1 bg-bpi-primary hover:bg-bpi-primary/90 text-sm"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        onClick={() => handleShare(material.id)}
                        variant="outline"
                        className="px-3"
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                // List View
                <Card key={material.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CategoryIcon className="w-8 h-8 text-white" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground mb-1">{material.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                        {material.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="font-medium">{material.fileType?.toUpperCase() || 'FILE'}</span>
                        <div className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          <span>{material.downloads} downloads</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>{material.views} views</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        onClick={() => handleDownload(material.id, material.fileUrl)}
                        className="bg-bpi-primary hover:bg-bpi-primary/90"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        onClick={() => handleShare(material.id)}
                        variant="outline"
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <FileImage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-foreground mb-2">No Materials Available</h4>
            <p className="text-muted-foreground">
              Check back soon for new promotional materials in this category.
            </p>
          </Card>
        )}

        {/* Usage Guidelines */}
        <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
          <h4 className="text-lg font-semibold text-foreground mb-3">Usage Guidelines</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></span>
              <span>These materials are for BPI members only to promote official programs</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></span>
              <span>Do not modify logos, branding elements, or official messaging</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></span>
              <span>Always include your referral link when sharing digital materials</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></span>
              <span>For questions about usage rights, contact the marketing team</span>
            </li>
          </ul>
        </Card>
      </div>
        </div>
      </div>
    </div>
  );
}
