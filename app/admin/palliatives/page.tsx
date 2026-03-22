"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { api } from "@/client/trpc";
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  X,
  Loader2,
  Zap,
  Tag,
} from "lucide-react";

interface PalliativeForm {
  id?: string;
  name: string;
  slug: string;
  targetAmount: string;
  description: string;
  icon: string;
  active: boolean;
  displayOrder: number;
}

const emptyForm: PalliativeForm = {
  name: "",
  slug: "",
  targetAmount: "",
  description: "",
  icon: "",
  active: true,
  displayOrder: 0,
};

const currencyFmt = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(value);

export default function PalliativesAdminPage() {
  const utils = api.useUtils();
  const { data: options = [], isLoading } = api.palliative.adminListOptions.useQuery();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState<PalliativeForm>(emptyForm);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const createOption = api.palliative.adminCreateOption.useMutation({
    onSuccess: () => {
      toast.success("Palliative added");
      utils.palliative.adminListOptions.invalidate();
      setIsModalOpen(false);
      setFormState(emptyForm);
    },
    onError: (error) => toast.error(error.message || "Failed to add palliative"),
  });

  const updateOption = api.palliative.adminUpdateOption.useMutation({
    onSuccess: () => {
      toast.success("Palliative updated");
      utils.palliative.adminListOptions.invalidate();
      setIsModalOpen(false);
      setFormState(emptyForm);
    },
    onError: (error) => toast.error(error.message || "Update failed"),
  });

  const deleteOption = api.palliative.adminDeleteOption.useMutation({
    onSuccess: () => {
      toast.success("Palliative deleted");
      utils.palliative.adminListOptions.invalidate();
      setIsDeleting(null);
    },
    onError: (error) => {
      setIsDeleting(null);
      toast.error(error.message || "Delete failed");
    },
  });

  const activeCount = useMemo(() => options.filter((o) => o.active).length, [options]);

  const openCreate = () => {
    setFormState({ ...emptyForm, displayOrder: options.length + 1 });
    setIsModalOpen(true);
  };

  const openEdit = (option: any) => {
    setFormState({
      id: option.id,
      name: option.name,
      slug: option.slug,
      targetAmount: option.targetAmount.toString(),
      description: option.description || "",
      icon: option.icon || "",
      active: option.active,
      displayOrder: option.displayOrder ?? 0,
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const targetAmount = parseFloat(formState.targetAmount);
    if (!formState.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (isNaN(targetAmount) || targetAmount <= 0) {
      toast.error("Enter a valid price/target amount");
      return;
    }

    const payload = {
      name: formState.name.trim(),
      slug: formState.slug.trim() || undefined,
      targetAmount,
      description: formState.description.trim() || undefined,
      icon: formState.icon.trim() || undefined,
      active: formState.active,
      displayOrder: formState.displayOrder ?? 0,
    };

    if (formState.id) {
      updateOption.mutate({ id: formState.id, ...payload });
    } else {
      createOption.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    setIsDeleting(id);
    deleteOption.mutate({ id });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bpi-gradient-light dark:bg-bpi-gradient-dark">
        <Loader2 className="h-8 w-8 animate-spin text-bpi-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bpi-gradient-light dark:bg-bpi-gradient-dark p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Palliative Catalogue</h1>
            <p className="text-sm text-muted-foreground">
              Add, edit, or retire palliatives. Names can include price tags in brackets.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-bpi-primary to-bpi-secondary px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-bpi-primary/90 hover:to-bpi-secondary/90"
          >
            <Plus className="h-4 w-4" />
            New Palliative
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-bpi-border/50 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-bpi-dark-accent dark:bg-bpi-dark-card/80">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-bpi-primary" />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-foreground">{activeCount}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-bpi-border/50 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-bpi-dark-accent dark:bg-bpi-dark-card/80">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground">{options.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-bpi-border/50 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-bpi-dark-accent dark:bg-bpi-dark-card/80">
            <div className="flex items-center gap-3">
              <Tag className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Price Preview</p>
                <p className="text-sm font-semibold text-foreground">
                  {options[0] ? `${options[0].name} • ${currencyFmt(options[0].targetAmount)}` : "No items"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-bpi-border/60 bg-white/80 shadow-lg backdrop-blur dark:border-bpi-dark-accent dark:bg-bpi-dark-card/90">
          <div className="border-b border-bpi-border/60 px-6 py-4 dark:border-bpi-dark-accent">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Palliatives</h2>
              <span className="text-xs text-muted-foreground">Editable fields: name, slug, price, description, icon, order, status</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50/80 text-left text-xs uppercase tracking-wide text-muted-foreground dark:bg-gray-900/30">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Slug</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Order</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {options.map((option) => (
                  <tr
                    key={option.id}
                    className="border-t border-bpi-border/50 bg-white/60 transition hover:bg-bpi-primary/5 dark:border-bpi-dark-accent dark:bg-bpi-dark-card/60"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{option.name}</div>
                      {option.description && (
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-foreground dark:bg-gray-800">{option.slug}</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground">{currencyFmt(option.targetAmount)}</td>
                    <td className="px-6 py-4 text-foreground">{option.displayOrder ?? 0}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          option.active
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {option.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEdit(option)}
                          className="rounded-lg border border-bpi-border px-3 py-2 text-xs font-semibold text-foreground hover:border-bpi-primary hover:text-bpi-primary dark:border-bpi-dark-accent"
                        >
                          <Pencil className="mr-1 inline h-4 w-4" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(option.id)}
                          disabled={isDeleting === option.id}
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:border-red-500 hover:bg-red-50 dark:border-red-800/60 dark:hover:bg-red-900/20"
                        >
                          {isDeleting === option.id ? (
                            <Loader2 className="inline h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="mr-1 inline h-4 w-4" /> Delete
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {options.length === 0 && (
                  <tr>
                    <td className="px-6 py-6 text-sm text-muted-foreground" colSpan={6}>
                      No palliatives yet. Create the first one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-2xl rounded-2xl border border-bpi-border/70 bg-white p-6 shadow-2xl dark:border-bpi-dark-accent dark:bg-bpi-dark-card"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    {formState.id ? "Edit Palliative" : "Add Palliative"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    All fields are editable. Include price tags in the name if desired (e.g., "House (₦5,000,000)").
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="h-5 w-5 text-foreground" />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1 text-sm font-medium text-foreground">
                  Name
                  <input
                    className="w-full rounded-lg border border-bpi-border bg-white px-3 py-2 text-sm text-foreground outline-none ring-0 focus:border-bpi-primary dark:border-bpi-dark-accent dark:bg-bpi-dark-card"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    placeholder="e.g., House (₦5,000,000)"
                  />
                </label>

                <label className="space-y-1 text-sm font-medium text-foreground">
                  Slug
                  <input
                    className="w-full rounded-lg border border-bpi-border bg-white px-3 py-2 text-sm text-foreground outline-none ring-0 focus:border-bpi-primary dark:border-bpi-dark-accent dark:bg-bpi-dark-card"
                    value={formState.slug}
                    onChange={(e) => setFormState({ ...formState, slug: e.target.value })}
                    placeholder="auto-generated if empty"
                  />
                </label>

                <label className="space-y-1 text-sm font-medium text-foreground">
                  Price / Target Amount
                  <input
                    className="w-full rounded-lg border border-bpi-border bg-white px-3 py-2 text-sm text-foreground outline-none ring-0 focus:border-bpi-primary dark:border-bpi-dark-accent dark:bg-bpi-dark-card"
                    value={formState.targetAmount}
                    onChange={(e) => setFormState({ ...formState, targetAmount: e.target.value })}
                    placeholder="e.g., 5000000"
                  />
                </label>

                <label className="space-y-1 text-sm font-medium text-foreground">
                  Display Order
                  <input
                    className="w-full rounded-lg border border-bpi-border bg-white px-3 py-2 text-sm text-foreground outline-none ring-0 focus:border-bpi-primary dark:border-bpi-dark-accent dark:bg-bpi-dark-card"
                    type="number"
                    value={formState.displayOrder}
                    onChange={(e) => setFormState({ ...formState, displayOrder: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </label>

                <label className="space-y-1 text-sm font-medium text-foreground md:col-span-2">
                  Description
                  <textarea
                    className="w-full rounded-lg border border-bpi-border bg-white px-3 py-2 text-sm text-foreground outline-none ring-0 focus:border-bpi-primary dark:border-bpi-dark-accent dark:bg-bpi-dark-card"
                    value={formState.description}
                    onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                    rows={3}
                    placeholder="What does this palliative offer?"
                  />
                </label>

                <label className="space-y-1 text-sm font-medium text-foreground">
                  Icon (optional)
                  <input
                    className="w-full rounded-lg border border-bpi-border bg-white px-3 py-2 text-sm text-foreground outline-none ring-0 focus:border-bpi-primary dark:border-bpi-dark-accent dark:bg-bpi-dark-card"
                    value={formState.icon}
                    onChange={(e) => setFormState({ ...formState, icon: e.target.value })}
                    placeholder="icon slug (react-icons)"
                  />
                </label>

                <label className="flex items-center gap-3 text-sm font-medium text-foreground">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-bpi-border text-bpi-primary focus:ring-bpi-primary"
                    checked={formState.active}
                    onChange={(e) => setFormState({ ...formState, active: e.target.checked })}
                  />
                  Active
                </label>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-bpi-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-gray-100 dark:border-bpi-dark-accent dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={createOption.isPending || updateOption.isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-bpi-primary to-bpi-secondary px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-bpi-primary/90 hover:to-bpi-secondary/90 disabled:opacity-70"
                >
                  {(createOption.isPending || updateOption.isPending) && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {formState.id ? "Update" : "Create"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
