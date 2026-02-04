import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatCoordinates } from '@/lib/npubToCoords';
import { Calendar, MapPin } from 'lucide-react';
import type { LandBase } from '@/hooks/useUserBase';
import type { MapUser } from '@/hooks/useAllUsers';

interface UserBaseInfoProps {
  base: LandBase | MapUser;
  className?: string;
}

export function UserBaseInfo({ base, className = '' }: UserBaseInfoProps) {
  const isClaimed = 'hasClaimed' in base ? base.hasClaimed : true;
  const metadata = 'metadata' in base ? base.metadata : undefined;
  const title = 'title' in base ? base.title : undefined;
  const description = 'description' in base ? base.description : undefined;
  const claimedAt = 'claimedAt' in base ? base.claimedAt : undefined;

  const displayName =
    title ||
    metadata?.display_name ||
    metadata?.name ||
    `${base.pubkey.slice(0, 8)}...${base.pubkey.slice(-8)}`;

  const avatarUrl = metadata?.picture;
  const about = description || metadata?.about;
  const nip05 = metadata?.nip05;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback>
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <CardTitle className="text-xl">{displayName}</CardTitle>
            {nip05 && (
              <p className="text-sm text-muted-foreground">{nip05}</p>
            )}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{formatCoordinates({ x: base.x, y: base.y })}</span>
            </div>
          </div>
          {isClaimed ? (
            <Badge variant="default">Claimed</Badge>
          ) : (
            <Badge variant="secondary">Unclaimed</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {about && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">{about}</p>
          </div>
        )}
        {claimedAt && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Claimed on {new Date(claimedAt * 1000).toLocaleDateString()}
            </span>
          </div>
        )}
        {!isClaimed && (
          <p className="text-sm text-muted-foreground italic">
            This base has not been claimed yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
