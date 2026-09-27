import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CalendarDays, Coins, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { checkItemAvailability } from '../../api/items.api';
import { createBorrowRequest } from '../../api/borrowRequests.api';
import { getDurationDays } from '../../lib/utils';

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function BorrowRequestForm({ item }) {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');

  const durationDays = getDurationDays(startDate, endDate);
  const creditPreview = durationDays > 0 ? durationDays * item.creditCost : null;

  const availabilityQuery = useQuery({
    queryKey: ['availability', item.id, startDate, endDate],
    queryFn: () => checkItemAvailability(item.id, { startDate, endDate }),
    enabled: Boolean(startDate && endDate && durationDays > 0),
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: createBorrowRequest,
    onSuccess: () => {
      toast.success('Borrow request submitted!');
      navigate('/requests/my');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Could not submit the request.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ itemId: item.id, startDate, endDate, message: message || undefined });
  };

  const availability = availabilityQuery.data?.data;
  const isSelfOwned = false; // guarded upstream by not rendering this form for the owner

  return (
    <form onSubmit={handleSubmit} className="bg-white/60 border border-[#E8DCCB] rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-[#A47551]" />
        <h3 className="font-serif text-base font-semibold text-[#3A2118]">Request to borrow</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#542F20] mb-1">Start date</label>
          <input
            type="date"
            required
            min={todayISO()}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[#E8DCCB] bg-[#FBF8F3] text-sm text-[#2B211C]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#542F20] mb-1">End date</label>
          <input
            type="date"
            required
            min={startDate || todayISO()}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[#E8DCCB] bg-[#FBF8F3] text-sm text-[#2B211C]"
          />
        </div>
      </div>

      {startDate && endDate && durationDays > 0 && (
        <div className="flex items-center justify-between text-sm bg-[#F5EFE6] rounded-lg px-3 py-2">
          <span className="text-[#542F20]/80">{durationDays} day{durationDays !== 1 ? 's' : ''}</span>
          <span className="flex items-center gap-1 font-semibold text-[#542F20]">
            <Coins className="w-3.5 h-3.5 text-[#A47551]" /> {creditPreview} credits
          </span>
        </div>
      )}

      {availabilityQuery.isFetching && (
        <p className="text-xs text-[#795548]/70 flex items-center gap-1.5">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking availability...
        </p>
      )}
      {availability && !availabilityQuery.isFetching && (
        <p
          className={`text-xs flex items-center gap-1.5 font-medium ${
            availability.available ? 'text-[#2E5A27]' : 'text-[#A65D43]'
          }`}
        >
          {availability.available ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
          {availability.available
            ? 'Available for these dates'
            : availability.reason === 'unavailable'
              ? 'This item is currently paused by its owner'
              : 'Already reserved for part of this date range'}
        </p>
      )}

      <div>
        <label className="block text-xs font-medium text-[#542F20] mb-1">Message to owner (optional)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="What will you use it for?"
          className="w-full px-3 py-2 rounded-lg border border-[#E8DCCB] bg-[#FBF8F3] text-sm text-[#2B211C] placeholder:text-[#795548]/40 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={mutation.isPending || isSelfOwned || (availability && !availability.available)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#542F20] hover:bg-[#3A2118] text-white text-sm font-medium transition disabled:opacity-50"
      >
        {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        {mutation.isPending ? 'Submitting...' : 'Submit borrow request'}
      </button>
    </form>
  );
}
