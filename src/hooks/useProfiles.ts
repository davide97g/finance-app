import { useLiveQuery } from "dexie-react-hooks";
import { db, Profile } from "@/lib/db";
import { insertRecord, updateRecord } from "@/lib/dbOperations";
import { useAuth } from "@/contexts/AuthProvider";
import { toast } from "sonner";
import i18n from "@/i18n";

/**
 * Hook to fetch user profiles from the local database.
 * 
 * @param userIds - Array of user IDs to fetch profiles for
 * @returns Map of userId -> Profile
 */
export function useProfiles(userIds: string[]) {
    const profiles = useLiveQuery(async () => {
        if (!userIds || userIds.length === 0) return {};

        // Deduplicate IDs
        const uniqueIds = [...new Set(userIds)];

        const result: Record<string, Profile> = {};
        const profileList = await db.profiles.bulkGet(uniqueIds);

        profileList.forEach((profile) => {
            if (profile) {
                result[profile.id] = profile;
            }
        });

        return result;
    }, [userIds.join(",")]);

    return profiles || {};
}

/**
 * Hook to fetch a single user profile
 */
export function useProfile(userId: string | undefined) {
    const profile = useLiveQuery(async () => {
        if (!userId) return undefined;
        return await db.profiles.get(userId);
    }, [userId]);

    return profile;
}

/**
 * Hook to update the current user's profile
 * Follows offline-first pattern like useSettings
 */
export function useUpdateProfile() {
    const { user } = useAuth();

    const updateProfile = async (updates: Partial<Pick<Profile, 'full_name' | 'avatar_url' | 'avatar_type'>>) => {
        if (!user) {
            console.warn('[Profile] No user, cannot update profile');
            return;
        }

        try {
            // Check if profile exists
            const existing = await db.profiles.get(user.id);

            if (existing) {
                // Immediate update
                await updateRecord("profiles", user.id, updates, user.id);
            } else {
                // Create new profile
                const profileData = {
                    id: user.id,
                    email: user.email,
                    ...updates,
                };
                await insertRecord("profiles", profileData, user.id);
            }

            toast.success(i18n.t('profile_updated', {
                defaultValue: 'Profile updated successfully'
            }));
        } catch (error) {
            console.error('[Profile] Failed to update:', error);
            const isOffline = !navigator.onLine || (error instanceof Error && error.message.includes("fetch"));
            
            if (isOffline) {
                toast.warning(
                    i18n.t('profile_update_offline', {
                        defaultValue: 'Profile updated locally, will sync when online'
                    })
                );
            } else {
                toast.error(i18n.t('profile_update_error', {
                    defaultValue: 'Failed to update profile'
                }));
                throw error;
            }
        }
    };

    return { updateProfile };
}
