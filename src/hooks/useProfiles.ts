import { useLiveQuery } from "dexie-react-hooks";
import { db, Profile } from "@/lib/db";

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
