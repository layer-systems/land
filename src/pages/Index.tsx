import { useState, useEffect, useMemo, useRef } from 'react';
import { useSeoMeta } from '@unhead/react';
import { MapCanvas } from '@/components/MapCanvas';
import { ClaimBaseDialog } from '@/components/ClaimBaseDialog';
import { NIP05Search } from '@/components/NIP05Search';
import { UserBaseInfo } from '@/components/UserBaseInfo';
import { LoginArea } from '@/components/auth/LoginArea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAllUsers } from '@/hooks/useAllUsers';
import { useAllBases, useUserBase } from '@/hooks/useUserBase';
import { pubkeyToCoordinates } from '@/lib/npubToCoords';
import { MapIcon, Users } from 'lucide-react';
import type { LandBase } from '@/hooks/useUserBase';
import type { MapUser } from '@/hooks/useAllUsers';
import type { Coordinates } from '@/lib/npubToCoords';

const Index = () => {
  useSeoMeta({
    title: 'Land - Nostr Map Explorer',
    description: 'Explore and claim your virtual land base on the Nostr network. Each npub has a unique position on a decentralized 2D map.',
  });

  const { user } = useCurrentUser();
  const { data: users = [], isLoading: usersLoading } = useAllUsers(500);
  const { data: bases = [], isLoading: basesLoading } = useAllBases(500);
  const { data: currentUserBase } = useUserBase(user?.pubkey);

  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [selectedBase, setSelectedBase] = useState<LandBase | MapUser | null>(null);
  const [infoSheetOpen, setInfoSheetOpen] = useState(false);
  const [userCoords, setUserCoords] = useState<Coordinates | null>(null);
  const didAutoOpenMyBaseRef = useRef(false);

  // Calculate user's coordinates
  useEffect(() => {
    if (user) {
      const coords = pubkeyToCoordinates(user.pubkey);
      setUserCoords(coords);
    } else {
      setUserCoords(null);
    }
  }, [user]);

  const usersForMap = useMemo(() => {
    if (!user || !userCoords) return users;
    if (users.some((u) => u.pubkey === user.pubkey)) return users;

    const current: MapUser = {
      pubkey: user.pubkey,
      x: userCoords.x,
      y: userCoords.y,
      hasClaimed: false,
    };

    return [current, ...users];
  }, [user, userCoords, users]);

  const handleBaseClick = (base: LandBase | MapUser) => {
    setSelectedBase(base);
    setInfoSheetOpen(true);
  };

  // Auto-open my base details once when the app loads and I already claimed a base
  useEffect(() => {
    if (!user) {
      didAutoOpenMyBaseRef.current = false;
      return;
    }

    if (didAutoOpenMyBaseRef.current) return;
    if (!currentUserBase) return;

    setSelectedBase(currentUserBase);
    setInfoSheetOpen(true);
    didAutoOpenMyBaseRef.current = true;
  }, [currentUserBase, user]);

  const handleSearchResult = (pubkey: string, _coords: Coordinates) => {
    // Find the base or user at these coordinates
    const base = bases.find((b) => b.pubkey === pubkey);
    const mapUser = usersForMap.find((u) => u.pubkey === pubkey);
    
    if (base) {
      setSelectedBase(base);
      setInfoSheetOpen(true);
    } else if (mapUser) {
      setSelectedBase(mapUser);
      setInfoSheetOpen(true);
    }
  };

  const isLoading = usersLoading || basesLoading;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapIcon className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Land</h1>
                <p className="text-sm text-muted-foreground">
                  Nostr Map Explorer
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {user && userCoords && (
                <Button
                  onClick={() => setClaimDialogOpen(true)}
                  variant={currentUserBase ? "outline" : "default"}
                >
                  {currentUserBase ? 'Update Base' : 'Claim Base'}
                </Button>
              )}
              <LoginArea className="max-w-60" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar - Stats */}
        <aside className="lg:w-80 border-b lg:border-r lg:border-b-0 bg-card p-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <>
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </>
              ) : (
                <>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-2xl font-bold">{users.length}</p>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-2xl font-bold">{bases.length}</p>
                    <p className="text-sm text-muted-foreground">Claimed Bases</p>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-2xl font-bold">
                      {((bases.length / users.length) * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Claim Rate</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {user && userCoords && (
            <Card>
              <CardHeader>
                <CardTitle>Your Base</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <p className="text-muted-foreground">Coordinates</p>
                  <p className="font-mono">
                    ({userCoords.x.toLocaleString()}, {userCoords.y.toLocaleString()})
                  </p>
                </div>
                <div className="text-sm">
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-semibold">
                    {currentUserBase ? '✅ Claimed' : '⚠️ Unclaimed'}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    const me = currentUserBase ?? usersForMap.find((u) => u.pubkey === user.pubkey) ?? null;
                    if (me) handleBaseClick(me);
                  }}
                >
                  View My Base
                </Button>
              </CardContent>
            </Card>
          )}

          {!user && (
            <Card>
              <CardHeader>
                <CardTitle>Get Started</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Login with Nostr to claim your unique position on the map!
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li>🗺️ Explore the map</li>
                  <li>📍 Find your base location</li>
                  <li>🎨 Customize your base</li>
                  <li>🔍 Search for friends via NIP-05</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </aside>

        {/* Map Container */}
        <main className="flex-1 relative min-h-[500px] lg:min-h-0">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                <p className="text-muted-foreground">Loading map data...</p>
              </div>
            </div>
          ) : (
            <MapCanvas
              bases={bases}
              users={usersForMap}
              currentUserPubkey={user?.pubkey}
              onBaseClick={handleBaseClick}
              onSearchClick={() => setSearchDialogOpen(true)}
              className="absolute inset-0"
            />
          )}
        </main>
      </div>

      {/* Claim Base Dialog */}
      {user && userCoords && (
        <ClaimBaseDialog
          open={claimDialogOpen}
          onOpenChange={setClaimDialogOpen}
          pubkey={user.pubkey}
          coordinates={userCoords}
          existingBase={currentUserBase}
        />
      )}

      {/* NIP-05 Search Dialog */}
      <NIP05Search
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        onResultFound={handleSearchResult}
      />

      {/* Base Info Sheet */}
      <Sheet open={infoSheetOpen} onOpenChange={setInfoSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Base Information</SheetTitle>
          </SheetHeader>
          {selectedBase && (
            <div className="mt-6">
              <UserBaseInfo base={selectedBase} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Index;
