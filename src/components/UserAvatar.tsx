import { useProfile } from "@/hooks/useProfiles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generateInitials } from "@/lib/profileUtils";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
    userId: string;
    className?: string;
    showName?: boolean;
    fallbackName?: string; // Name to show if profile not found (e.g. "You")
}

export function UserAvatar({
    userId,
    className,
    showName = false,
    fallbackName
}: UserAvatarProps) {
    const profile = useProfile(userId);

    // Determine display name
    // Priority: Profile Name -> Fallback Name -> ID (shortened)
    const displayName = profile?.full_name || profile?.email || fallbackName || userId.substring(0, 8);

    // Generate initials using the utility function
    const initials = generateInitials(profile?.full_name, profile?.email);

    // Respect avatar_type preference - only show photo if avatar_type is 'photo'
    const shouldShowPhoto = profile?.avatar_type === "photo" && profile?.avatar_url;

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Avatar className="h-8 w-8">
                {shouldShowPhoto ? (
                    <AvatarImage src={profile.avatar_url} alt={displayName} />
                ) : null}
                <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            {showName && (
                <span className="text-sm font-medium truncate max-w-[150px]">
                    {displayName}
                </span>
            )}
        </div>
    );
}
