"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Power, PowerOff, ExternalLink, Image as ImageIcon, MoveUp, MoveDown } from "lucide-react";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

export default function ThirdPartyPlatformsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    registrationUrl: "",
    adminDefaultLink: "",
    category: "",
    logo: "",
  });

  const utils = api.useUtils();

  // Get all platforms (admin view)
  const { data: platforms, isLoading } = api.admin.getAllThirdPartyPlatforms.useQuery();

  // Mutations
  const createMutation = api.admin.createThirdPartyPlatform.useMutation({
    onSuccess: () => {
      toast.success("Platform created successfully");
      setIsAddModalOpen(false);
      resetForm();
      utils.admin.getAllThirdPartyPlatforms.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = api.admin.updateThirdPartyPlatform.useMutation({
    onSuccess: () => {
      toast.success("Platform updated successfully");
      setEditingPlatform(null);
      resetForm();
      utils.admin.getAllThirdPartyPlatforms.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = api.admin.deleteThirdPartyPlatform.useMutation({
    onSuccess: () => {
      toast.success("Platform deleted successfully");
      utils.admin.getAllThirdPartyPlatforms.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const toggleActiveMutation = api.admin.toggleThirdPartyPlatformStatus.useMutation({
    onSuccess: () => {
      utils.admin.getAllThirdPartyPlatforms.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const reorderMutation = api.admin.reorderThirdPartyPlatform.useMutation({
    onSuccess: () => {
      utils.admin.getAllThirdPartyPlatforms.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      registrationUrl: "",
      adminDefaultLink: "",
      category: "",
      logo: "",
    });
  };

  const handleEdit = (platform: any) => {
    setEditingPlatform(platform);
    setFormData({
      name: platform.name,
      description: platform.description || "",
      registrationUrl: platform.registrationUrl || "",
      adminDefaultLink: platform.adminDefaultLink || "",
      category: platform.category || "",
      logo: platform.logo || "",
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Platform name is required");
      return;
    }

    if (editingPlatform) {
      updateMutation.mutate({
        id: editingPlatform.id,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (platform: any) => {
    toast.custom((t) => (
      <div className="w-full max-w-sm rounded-lg border border-bpi-border bg-white p-3 shadow-lg dark:border-bpi-dark-accent dark:bg-bpi-dark-card">
        <div className="text-sm text-foreground">Delete "{platform.name}"?</div>
        <div className="mt-2 flex items-center justify-end gap-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-gray-50 dark:hover:bg-bpi-dark-accent/30"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              deleteMutation.mutate({ id: platform.id });
            }}
            className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    ));
  };

  const handleToggleActive = (platform: any) => {
    toggleActiveMutation.mutate({ id: platform.id, isActive: !platform.isActive });
  };

  const handleReorder = (platformId: string, direction: 'up' | 'down') => {
    reorderMutation.mutate({ id: platformId, direction });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading third-party platforms...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Third-Party Opportunities</h1>
          <p className="text-sm text-muted-foreground">Manage external platform integrations</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setEditingPlatform(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Platform
        </Button>
      </div>

      {/* Platforms List */}
      <div className="grid gap-4">
        {platforms && platforms.length > 0 ? (
          platforms.map((platform: any, index: number) => (
            <div
              key={platform.id}
              className="bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  {platform.logo ? (
                    <img
                      src={platform.logo}
                      alt={platform.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{platform.name}</h3>
                      {platform.isActive ? (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 rounded">
                          Inactive
                        </span>
                      )}
                      {platform.category && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                          {platform.category}
                        </span>
                      )}
                    </div>
                    {platform.description && (
                      <p className="text-sm text-muted-foreground mt-1">{platform.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      {platform.registrationUrl && (
                        <a
                          href={platform.registrationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-bpi-primary"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Registration URL
                        </a>
                      )}
                      {platform.adminDefaultLink && (
                        <a
                          href={platform.adminDefaultLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-bpi-primary"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Admin Link
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Reorder */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleReorder(platform.id, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <MoveUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReorder(platform.id, 'down')}
                      disabled={index === platforms.length - 1}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <MoveDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Toggle Active */}
                  <button
                    onClick={() => handleToggleActive(platform)}
                    className={`p-2 rounded ${
                      platform.isActive
                        ? "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                        : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                    title={platform.isActive ? "Deactivate" : "Activate"}
                  >
                    {platform.isActive ? (
                      <Power className="w-4 h-4" />
                    ) : (
                      <PowerOff className="w-4 h-4" />
                    )}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => handleEdit(platform)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(platform)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No platforms configured yet. Click "Add Platform" to get started.
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-bpi-dark-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingPlatform ? "Edit Platform" : "Add New Platform"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Platform Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-bpi-border dark:border-bpi-dark-accent rounded bg-white dark:bg-bpi-dark-card text-foreground"
                    placeholder="e.g., Binance, Kucoin"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-bpi-border dark:border-bpi-dark-accent rounded bg-white dark:bg-bpi-dark-card text-foreground"
                    rows={3}
                    placeholder="Brief description of the platform"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-bpi-border dark:border-bpi-dark-accent rounded bg-white dark:bg-bpi-dark-card text-foreground"
                    placeholder="e.g., Crypto Exchange, Investment"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Logo URL</label>
                  <input
                    type="url"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    className="w-full px-3 py-2 border border-bpi-border dark:border-bpi-dark-accent rounded bg-white dark:bg-bpi-dark-card text-foreground"
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Registration URL</label>
                  <input
                    type="url"
                    value={formData.registrationUrl}
                    onChange={(e) => setFormData({ ...formData, registrationUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-bpi-border dark:border-bpi-dark-accent rounded bg-white dark:bg-bpi-dark-card text-foreground"
                    placeholder="https://platform.com/register"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Admin Default Referral Link</label>
                  <input
                    type="url"
                    value={formData.adminDefaultLink}
                    onChange={(e) => setFormData({ ...formData, adminDefaultLink: e.target.value })}
                    className="w-full px-3 py-2 border border-bpi-border dark:border-bpi-dark-accent rounded bg-white dark:bg-bpi-dark-card text-foreground"
                    placeholder="https://platform.com/ref/admin123"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This link will be shown to users whose upline hasn't submitted their link yet
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1"
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {editingPlatform ? "Updating..." : "Creating..."}
                      </div>
                    ) : (
                      <>{editingPlatform ? "Update Platform" : "Create Platform"}</>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setEditingPlatform(null);
                      resetForm();
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
