import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil, Trash2, Coins, ShoppingBag, Tag, Star, ArrowLeft } from 'lucide-react';
import { getItemById, deleteItem } from '../../api/items.api';
import { useAuthStore } from '../../store/authStore';
import { CATEGORIES, ITEM_CONDITIONS } from '../../lib/constants';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import BorrowRequestForm from '../../components/borrowing/BorrowRequestForm';
import RecommendationPanel from '../../components/recommendations/RecommendationPanel';
import { getInitials } from '../../lib/utils';

export default function ItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['item', id],
    queryFn: () => getItemById(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteItem(id),
    onSuccess: () => {
      toast.success('Item removed.');
      queryClient.invalidateQueries({ queryKey: ['items'] });
      navigate('/my-items');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Could not remove this item.');
      setConfirmDelete(false);
    },
  });

  if (isLoading) return <LoadingSpinner text="Loading item..." />;

  if (isError) {
    return (
      <EmptyState
        title="Item not found"
        description={error?.response?.data?.message || "This item doesn't exist or isn't in your community."}
        action={
          <Link to="/marketplace" className="text-sm font-medium text-[#542F20] underline underline-offset-2">
            Back to marketplace
          </Link>
        }
      />
    );
  }

  const item = data.data.item;
  const isOwner = item.owner?.id === user?.id;
  const categoryLabel = CATEGORIES.find((c) => c.value === item.category)?.label || item.category;
  const conditionLabel = ITEM_CONDITIONS.find((c) => c.value === item.condition)?.label || item.condition;

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-[#795548] hover:text-[#3A2118] mb-5"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-5">
          <div className="aspect-video bg-[#F5EFE6] rounded-xl border border-[#E8DCCB] overflow-hidden flex items-center justify-center">
            {item.images?.[0] ? (
              <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm text-[#795548]/50">No image provided</span>
            )}
          </div>

          <div>
            <div className="flex items-start justify-between gap-3">
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#3A2118]">{item.title}</h1>
              <StatusBadge status={item.availabilityStatus} className="flex-shrink-0 mt-1.5" />
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-[#795548]/75">
              <span className="inline-flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> {categoryLabel}</span>
              <span>·</span>
              <span>{conditionLabel} condition</span>
            </div>
          </div>

          <p className="text-sm text-[#542F20]/90 leading-relaxed whitespace-pre-wrap">{item.description}</p>

          <div className="grid sm:grid-cols-3 gap-3">
            <div className="bg-white/60 border border-[#E8DCCB] rounded-lg p-3">
              <p className="text-xs text-[#795548]/60 flex items-center gap-1"><Coins className="w-3.5 h-3.5" /> Borrow</p>
              <p className="mt-1 font-semibold text-[#3A2118]">{item.creditCost} credits/day</p>
            </div>
            <div className="bg-white/60 border border-[#E8DCCB] rounded-lg p-3">
              <p className="text-xs text-[#795548]/60 flex items-center gap-1"><ShoppingBag className="w-3.5 h-3.5" /> Rent</p>
              <p className="mt-1 font-semibold text-[#3A2118]">
                {item.rentalPricePerDay != null ? `₹${item.rentalPricePerDay}/day` : 'Not offered'}
              </p>
            </div>
            <div className="bg-white/60 border border-[#E8DCCB] rounded-lg p-3">
              <p className="text-xs text-[#795548]/60 flex items-center gap-1"><ShoppingBag className="w-3.5 h-3.5" /> Buy</p>
              <p className="mt-1 font-semibold text-[#3A2118]">
                {item.purchasePrice != null ? `₹${item.purchasePrice}` : 'Not offered'}
              </p>
            </div>
          </div>

          {item.owner?.name && (
            <Link
              to={`/users/${item.owner.id}`}
              className="flex items-center gap-3 bg-white/60 border border-[#E8DCCB] rounded-xl p-4 hover:border-[#D4C2AB] transition"
            >
              <div className="w-10 h-10 rounded-full bg-[#A47551] text-white flex items-center justify-center text-sm font-semibold">
                {getInitials(item.owner.name)}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#3A2118]">{item.owner.name}</p>
                <p className="text-xs text-[#795548]/60 flex items-center gap-1">
                  <Star className="w-3 h-3" /> View reputation & reviews
                </p>
              </div>
            </Link>
          )}

          {isOwner && (
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/items/${id}/edit`)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#D4C2AB] hover:bg-[#F5EFE6] text-sm font-medium text-[#3A2118] transition"
              >
                <Pencil className="w-4 h-4" /> Edit
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#F2D0C8] hover:bg-[#FBEBE8] text-sm font-medium text-[#A65D43] transition"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          )}
        </div>

        <div className="space-y-5">
          {!isOwner && (
            <>
              <BorrowRequestForm item={item} />
              <RecommendationPanel itemId={item.id} />
            </>
          )}
          {isOwner && (
            <div className="bg-[#F5EFE6] border border-[#E8DCCB] rounded-xl p-4 text-sm text-[#542F20]/80">
              This is your own listing. Borrowers in your community will see a request form here instead.
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete this listing?"
        description="This can't be undone. Items with an active loan or a pending request can't be deleted."
        confirmText="Delete"
        isDestructive
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
