import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/useToast';
import { useClaimBase, useUpdateBase } from '@/hooks/useClaimBase';
import { formatCoordinates } from '@/lib/npubToCoords';
import type { Coordinates } from '@/lib/npubToCoords';
import type { LandBase } from '@/hooks/useUserBase';

interface ClaimBaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pubkey: string;
  coordinates: Coordinates;
  existingBase?: LandBase | null;
}

interface FormData {
  title: string;
  description: string;
  color: string;
}

export function ClaimBaseDialog({
  open,
  onOpenChange,
  pubkey,
  coordinates,
  existingBase,
}: ClaimBaseDialogProps) {
  const { toast } = useToast();
  const { mutate: claimBase, isPending: isClaiming } = useClaimBase();
  const { mutate: updateBase, isPending: isUpdating } = useUpdateBase();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      title: existingBase?.title || '',
      description: existingBase?.description || '',
      color: existingBase?.color || '#3b82f6',
    },
  });

  const isEditing = !!existingBase;
  const isPending = isClaiming || isUpdating;

  const onSubmit = (data: FormData) => {
    const mutate = isEditing ? updateBase : claimBase;

    mutate(
      {
        pubkey,
        title: data.title || undefined,
        description: data.description || undefined,
        color: data.color,
        existingBase,
      },
      {
        onSuccess: () => {
          toast({
            title: isEditing ? 'Base Updated!' : 'Base Claimed!',
            description: isEditing
              ? 'Your land base has been updated successfully.'
              : `You've claimed your land base at ${formatCoordinates(coordinates)}`,
          });
          onOpenChange(false);
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: error instanceof Error ? error.message : 'Failed to save base',
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Update Your Base' : 'Claim Your Land Base'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the details of your land base.'
              : `Your base is located at ${formatCoordinates(coordinates)}. Customize it below.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Base Name</Label>
              <Input
                id="title"
                placeholder="My Awesome Base"
                {...register('title')}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Welcome to my corner of the map!"
                rows={3}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Base Color</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="color"
                  type="color"
                  className="w-20 h-10"
                  {...register('color')}
                />
                <span className="text-sm text-muted-foreground">
                  Pick a color for your base marker
                </span>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Coordinates:</strong> {formatCoordinates(coordinates)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Your coordinates are calculated from your public key and cannot be changed.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEditing
                  ? 'Updating...'
                  : 'Claiming...'
                : isEditing
                  ? 'Update Base'
                  : 'Claim Base'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
