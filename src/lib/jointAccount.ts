import { supabase } from "./supabase";
import { db } from "./db";

/**
 * Get the joint account partner ID for a given user.
 * 
 * @param userId - The user ID to check
 * @returns The partner user ID if joint account is configured, null otherwise
 */
export async function getJointAccountPartnerId(
  userId: string
): Promise<string | null> {
  const settings = await db.user_settings.get(userId);
  return settings?.joint_account_partner_id ?? null;
}

/**
 * Check if a joint account is active for a given user.
 * 
 * @param userId - The user ID to check
 * @returns True if joint account is configured, false otherwise
 */
export async function isJointAccountActive(
  userId: string
): Promise<boolean> {
  const partnerId = await getJointAccountPartnerId(userId);
  return partnerId !== null;
}

/**
 * Validate a partner user ID.
 * Checks that:
 * - The user exists
 * - The user is not the same as the current user (self-linking prevention)
 * 
 * @param partnerId - The partner user ID to validate
 * @param currentUserId - The current user ID (to prevent self-linking)
 * @returns Validation result with error message if invalid
 */
export async function validatePartnerId(
  partnerId: string,
  currentUserId: string
): Promise<{ valid: boolean; error?: string }> {
  // Prevent self-linking
  if (partnerId === currentUserId) {
    return {
      valid: false,
      error: "Cannot link to your own account",
    };
  }

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(partnerId)) {
    return {
      valid: false,
      error: "Invalid user ID format",
    };
  }

  // Check if user exists using the check_user_exists function
  try {
    const { data, error } = await supabase.rpc("check_user_exists", {
      user_id: partnerId,
    });

    if (error) {
      console.error("[JointAccount] Error checking user existence:", error);
      return {
        valid: false,
        error: "Failed to validate user. Please try again.",
      };
    }

    if (!data) {
      return {
        valid: false,
        error: "User not found",
      };
    }

    return { valid: true };
  } catch (error) {
    console.error("[JointAccount] Exception validating partner ID:", error);
    return {
      valid: false,
      error: "Failed to validate user. Please try again.",
    };
  }
}

/**
 * Get the partner's profile information.
 * 
 * @param partnerId - The partner user ID
 * @returns Partner profile or null if not found
 */
export async function getPartnerProfile(partnerId: string) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url, avatar_type")
      .eq("id", partnerId)
      .single();

    if (error) {
      console.error("[JointAccount] Error fetching partner profile:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("[JointAccount] Exception fetching partner profile:", error);
    return null;
  }
}

