import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, X, Loader2 } from 'lucide-react';
import { getItemById, createItem, updateItem } from '../../api/items.api';
import { CATEGORIES, ITEM_CONDITIONS, AVAILABILITY_STATUSES } from '../../lib/constants';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const schema = z.object({
  title: z.string().trim().min(2, 'Title must be 2-100 characters').max(100),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(2000),
  category: z.string().min(1, 'Category is required'),
  condition: z.string().min(1, 'Condition is required'),
  creditCost: z.coerce.number().min(0, 'Must be 0 or more'),
  purchasePrice: z.union([z.coerce.number().min(0), z.literal('')]).optional(),
  rentalPricePerDay: z.union([z.coerce.number().min(0), z.literal('')]).optional(),
  availabilityStatus: z.string().optional(),
  images: z.array(z.object({ url: z.string().url('Must be a valid URL').or(z.literal('')) })).max(5),
});

export default function ItemFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['item', id],
    queryFn: () => getItemById(id),
    enabled: isEditing,
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '', description: '', category: '', condition: '',
      creditCost: 1, purchasePrice: '', rentalPricePerDay: '',
      availabilityStatus: 'available', images: [{ url: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'images' });

  useEffect(() => {
    if (isEditing && data?.data?.item) {
      const item = data.data.item;
      reset({
        title: item.title,
        description: item.description,
        category: item.category,
        condition: item.condition,
        creditCost: item.creditCost,
        purchasePrice: item.purchasePrice ?? '',
        rentalPricePerDay: item.rentalPricePerDay ?? '',
        availabilityStatus: item.availabilityStatus,
        images: item.images?.length ? item.images.map((url) => ({ url })) : [{ url: '' }],
      });
    }
  }, [isEditing, data, reset]);

  const mutation = useMutation({
    mutationFn: (payload) => (isEditing ? updateItem(id, payload) : createItem(payload)),
    onSuccess: (res) => {
      toast.success(isEditing ? 'Item updated.' : 'Item listed!');
      queryClient.invalidateQueries({ queryKey: ['items'] });
      if (isEditing) queryClient.invalidateQueries({ queryKey: ['item', id] });
      navigate(`/items/${isEditing ? id : res.data.item.id}`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Could not save this item.');
    },
  });

  const onSubmit = (values) => {
    const images = values.images.map((i) => i.url).filter(Boolean);
    const payload = {
      title: values.title,
      description: values.description,
      category: values.category,
      condition: values.condition,
      creditCost: Number(values.creditCost),
      purchasePrice: values.purchasePrice === '' ? undefined : Number(values.purchasePrice),
      rentalPricePerDay: values.rentalPricePerDay === '' ? undefined : Number(values.rentalPricePerDay),
      images,
    };
    if (isEditing) payload.availabilityStatus = values.availabilityStatus;
    mutation.mutate(payload);
  };

  if (isEditing && isLoading) return <LoadingSpinner text="Loading item..." />;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-serif text-2xl font-semibold text-[#3A2118] mb-6">
        {isEditing ? 'Edit listing' : 'List a new item'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white/60 border border-[#E8DCCB] rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-[#542F20] mb-1.5">Title</label>
          <input
            {...register('title')}
            className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8DCCB] bg-[#FBF8F3] text-sm text-[#2B211C]"
            placeholder="Cordless Drill"
          />
          {errors.title && <p className="mt-1 text-xs text-[#A65D43]">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#542F20] mb-1.5">Description</label>
          <textarea
            {...register('description')}
            rows={4}
            className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8DCCB] bg-[#FBF8F3] text-sm text-[#2B211C] resize-none"
            placeholder="18V cordless drill, barely used, comes with two batteries."
          />
          {errors.description && <p className="mt-1 text-xs text-[#A65D43]">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#542F20] mb-1.5">Category</label>
            <select {...register('category')} className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8DCCB] bg-[#FBF8F3] text-sm text-[#2B211C]">
              <option value="">Select...</option>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            {errors.category && <p className="mt-1 text-xs text-[#A65D43]">{errors.category.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#542F20] mb-1.5">Condition</label>
            <select {...register('condition')} className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8DCCB] bg-[#FBF8F3] text-sm text-[#2B211C]">
              <option value="">Select...</option>
              {ITEM_CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            {errors.condition && <p className="mt-1 text-xs text-[#A65D43]">{errors.condition.message}</p>}
          </div>
        </div>

        {isEditing && (
          <div>
            <label className="block text-sm font-medium text-[#542F20] mb-1.5">Availability</label>
            <select {...register('availabilityStatus')} className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8DCCB] bg-[#FBF8F3] text-sm text-[#2B211C]">
              {AVAILABILITY_STATUSES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#542F20] mb-1.5">Credits/day</label>
            <input type="number" min={0} step="1" {...register('creditCost')} className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8DCCB] bg-[#FBF8F3] text-sm text-[#2B211C]" />
            {errors.creditCost && <p className="mt-1 text-xs text-[#A65D43]">{errors.creditCost.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#542F20] mb-1.5">Rent/day (₹, optional)</label>
            <input type="number" min={0} step="1" {...register('rentalPricePerDay')} className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8DCCB] bg-[#FBF8F3] text-sm text-[#2B211C]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#542F20] mb-1.5">Buy price (₹, optional)</label>
            <input type="number" min={0} step="1" {...register('purchasePrice')} className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8DCCB] bg-[#FBF8F3] text-sm text-[#2B211C]" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#542F20] mb-1.5">
            Image URLs <span className="font-normal text-[#795548]/60">(up to 5 — links only, no uploads)</span>
          </label>
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <input
                  {...register(`images.${index}.url`)}
                  placeholder="https://example.com/photo.jpg"
                  className="flex-1 px-3.5 py-2.5 rounded-lg border border-[#E8DCCB] bg-[#FBF8F3] text-sm text-[#2B211C] placeholder:text-[#795548]/40"
                />
                {fields.length > 1 && (
                  <button type="button" onClick={() => remove(index)} className="p-2.5 text-[#795548] hover:text-[#A65D43]">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {errors.images && <p className="text-xs text-[#A65D43]">Each image must be a valid URL.</p>}
            {fields.length < 5 && (
              <button
                type="button"
                onClick={() => append({ url: '' })}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#795548] hover:text-[#3A2118]"
              >
                <Plus className="w-3.5 h-3.5" /> Add another image
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting || mutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#542F20] hover:bg-[#3A2118] text-white text-sm font-medium transition disabled:opacity-60"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEditing ? 'Save changes' : 'List item'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-lg border border-[#D4C2AB] hover:bg-[#F5EFE6] text-sm font-medium text-[#3A2118] transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
