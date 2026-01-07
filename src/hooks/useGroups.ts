import { useLiveQuery } from "dexie-react-hooks";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";
import { db, Group, GroupMember, Profile } from "../lib/db";
import { deleteRecord, insertRecord, updateRecord } from "../lib/dbOperations";
import {
  getGroupInputSchema,
  getGroupMemberUpdateSchema,
  getGroupUpdateSchema,
  validate,
} from "../lib/validation";
import { useAuth } from "./useAuth";

/**
 * Represents a single settlement transaction between two users.
 */
export interface SettlementTransaction {
  /** User ID who needs to pay */
  from: string;
  /** User ID who should receive payment */
  to: string;
  /** Amount to be transferred */
  amount: number;
}

/**
 * Extended group type with member information and computed properties.
 */
export interface GroupMemberWithProfile extends GroupMember {
  profile?: Profile;
  displayName: string;
}

/**
 * Extended group type with member information and computed properties.
 */
export interface GroupWithMembers extends Group {
  /** List of active members in the group */
  members: GroupMemberWithProfile[];
  /** Whether the current user created this group */
  isCreator: boolean;
  /** Current user's expense share percentage (0-100) */
  myShare: number;
}

/**
 * Calculate optimized settlement transactions to minimize number of payments.
 *
 * Uses a greedy algorithm to match debtors with creditors, minimizing
 * the total number of transactions needed to settle all balances.
 *
 * @param balances - Record of user balances where positive = owed money, negative = owes money
 * @returns Array of settlement transactions ordered by amount (largest first)
 *
 * @example
 * ```ts
 * const balances = {
 *   'user1': { userId: 'user1', balance: -50, ... }, // owes €50
 *   'user2': { userId: 'user2', balance: 30, ... },  // owed €30
 *   'user3': { userId: 'user3', balance: 20, ... },  // owed €20
 * };
 *
 * const settlements = calculateSettlement(balances);
 * // Returns: [
 * //   { from: 'user1', to: 'user2', amount: 30 },
 * //   { from: 'user1', to: 'user3', amount: 20 }
 * // ]
 * ```
 */
export function calculateSettlement(
  balances: Record<
    string,
    {
      userId: string;
      share: number;
      shouldPay: number;
      hasPaid: number;
      balance: number;
    }
  >
): SettlementTransaction[] {
  // Separate debtors (negative balance) and creditors (positive balance)
  const debtors = Object.values(balances)
    .filter((b) => b.balance < -0.01) // Use small epsilon for float comparison
    .map((b) => ({ userId: b.userId, amount: -b.balance })) // Convert to positive amount
    .sort((a, b) => b.amount - a.amount); // Sort by amount descending

  const creditors = Object.values(balances)
    .filter((b) => b.balance > 0.01)
    .map((b) => ({ userId: b.userId, amount: b.balance }))
    .sort((a, b) => b.amount - a.amount);

  const settlements: SettlementTransaction[] = [];

  // Create working copies to avoid mutating original arrays
  const debtorQueue = [...debtors];
  const creditorQueue = [...creditors];

  // Greedy algorithm: match largest debtor with largest creditor
  while (debtorQueue.length > 0 && creditorQueue.length > 0) {
    const debtor = debtorQueue[0];
    const creditor = creditorQueue[0];

    // Determine payment amount (minimum of what debtor owes and creditor is owed)
    const paymentAmount = Math.min(debtor.amount, creditor.amount);

    // Record the settlement
    settlements.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: paymentAmount,
    });

    // Update remaining amounts
    debtor.amount -= paymentAmount;
    creditor.amount -= paymentAmount;

    // Remove fully settled parties
    if (debtor.amount < 0.01) {
      debtorQueue.shift();
    }
    if (creditor.amount < 0.01) {
      creditorQueue.shift();
    }
  }

  return settlements;
}

/**
 * Hook for managing shared expense groups with member management and balance calculation.
 *
 * Groups allow multiple users to track shared expenses with customizable
 * percentage splits. The hook provides CRUD operations for groups and members,
 * plus balance calculations showing who owes whom.
 *
 * @returns Object containing:
 *   - `groups`: Array of groups where user is member/creator
 *   - `createGroup`: Create a new group (creator gets 100% initial share)
 *   - `updateGroup`: Update group name/description
 *   - `deleteGroup`: Soft-delete group with option to keep/delete transactions
 *   - `addMember`: Add a user to the group
 *   - `removeMember`: Remove a member from the group
 *   - `updateMemberShare`: Update a single member's share percentage
 *   - `updateAllShares`: Batch update all member shares
 *   - `getGroupBalance`: Calculate expense balances for all members
 *
 * @example
 * ```tsx
 * const { groups, createGroup, getGroupBalance } = useGroups();
 *
 * // Create a group for shared apartment expenses
 * const groupId = await createGroup('Apartment', 'Monthly shared bills');
 *
 * // Check who owes money
 * const { balances } = await getGroupBalance(groupId);
 * // balances[userId].balance > 0 means they are owed money
 * // balances[userId].balance < 0 means they owe money
 * ```
 */
export function useGroups() {
  const { user } = useAuth();
  const { t } = useTranslation();

  // Get all groups where user is a member or creator
  const groups = useLiveQuery(async () => {
    if (!user) return [];

    const allGroups = await db.groups.toArray();
    const allMembers = await db.group_members.toArray();
    const allProfiles = await db.profiles.toArray();
    const profileMap = new Map(allProfiles.map((p) => [p.id, p]));

    // Filter groups where user is creator or active member
    const userGroups = allGroups.filter((g) => {
      if (g.deleted_at) return false;
      if (g.created_by === user.id) return true;
      return allMembers.some(
        (m) => m.group_id === g.id && m.user_id === user.id && !m.removed_at
      );
    });

    // Enrich with members info
    return userGroups.map((g) => {
      const groupMembers = allMembers
        .filter((m) => m.group_id === g.id && !m.removed_at)
        .map((m) => {
          const profile = m.user_id ? profileMap.get(m.user_id) : undefined;
          // Determine display name: Profile name > Email > "User ..."
          let displayName = "Unknown User";
          if (profile?.full_name) displayName = profile.full_name;
          else if (profile?.email) displayName = profile.email.split("@")[0];
          else if (m.user_id === user.id) displayName = "You";
          else if (m.is_guest && m.guest_name) displayName = m.guest_name;
          else if (m.user_id) displayName = `User ${m.user_id.slice(0, 4)}`;

          return {
            ...m,
            profile,
            displayName,
          } as GroupMemberWithProfile;
        });
      const myMembership = groupMembers.find((m) => m.user_id === user.id);

      return {
        ...g,
        members: groupMembers,
        isCreator: g.created_by === user.id,
        myShare: myMembership?.share ?? 0,
      } as GroupWithMembers;
    });
  }, [user]);

  const createGroup = async (name: string, description?: string) => {
    if (!user) return null;

    // Validate input data
    const validatedData = validate(getGroupInputSchema(t), {
      name,
      description,
      created_by: user.id,
    });

    const groupId = uuidv4();
    const memberId = uuidv4();

    // Create group - immediate write (groups don't use user_id)
    const groupData = {
      id: groupId,
      ...validatedData,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await insertRecord("groups", groupData, user.id);

    // Add creator as first member with 100% share - immediate write
    const memberData = {
      id: memberId,
      group_id: groupId,
      user_id: user.id,
      share: 100,
      joined_at: new Date().toISOString(),
      removed_at: null,
      updated_at: new Date().toISOString(),
    };
    await insertRecord("group_members", memberData, user.id);

    return groupId;
  };

  const updateGroup = async (
    id: string,
    updates: Partial<Pick<Group, "name" | "description">>
  ) => {
    if (!user) throw new Error("User must be logged in");

    // Validate update data
    const validatedUpdates = validate(getGroupUpdateSchema(t), updates);

    // Immediate write (groups don't use user_id but we pass it for consistency)
    await updateRecord(
      "groups",
      id,
      {
        ...validatedUpdates,
        updated_at: new Date().toISOString(),
      },
      user.id
    );
  };

  const deleteGroup = async (
    id: string,
    deleteTransactions: boolean = false
  ) => {
    if (!user) throw new Error("User must be logged in");

    // Soft delete group
    await deleteRecord("groups", id);

    // Always soft delete group categories
    const groupCategories = await db.categories
      .filter((c) => c.group_id === id)
      .toArray();

    for (const cat of groupCategories) {
      await deleteRecord("categories", cat.id);
    }

    if (deleteTransactions) {
      // Soft delete all group transactions
      const groupTransactions = await db.transactions
        .filter((t) => t.group_id === id)
        .toArray();

      for (const tx of groupTransactions) {
        await deleteRecord("transactions", tx.id);
      }

      // Soft delete recurring transactions
      const groupRecurring = await db.recurring_transactions
        .filter((r) => r.group_id === id)
        .toArray();

      for (const rec of groupRecurring) {
        await deleteRecord("recurring_transactions", rec.id);
      }
    } else {
      // Convert group transactions to personal (remove group_id)
      const groupTransactions = await db.transactions
        .filter((t) => t.group_id === id)
        .toArray();

      for (const tx of groupTransactions) {
        await updateRecord(
          "transactions",
          tx.id,
          {
            group_id: null,
            paid_by_member_id: null,
          },
          user.id
        );
      }
    }
  };

  const addGroupMember = async (
    groupId: string,
    userIdOrName: string,
    isGuest: boolean = false,
    share: number = 0
  ) => {
    if (!user) throw new Error("User must be logged in");

    // Basic validation
    if (!userIdOrName) throw new Error("User ID or Guest Name is required");

    const memberId = uuidv4();

    const newMember = {
      id: memberId,
      group_id: groupId,
      share,
      joined_at: new Date().toISOString(),
      removed_at: null,
      updated_at: new Date().toISOString(),
      is_guest: isGuest,
    } as GroupMember;

    if (isGuest) {
      newMember.user_id = null;
      newMember.guest_name = userIdOrName;
    } else {
      newMember.user_id = userIdOrName;
      newMember.guest_name = null;
    }

    // Immediate write (group_members don't use user_id for owner, but we pass it for consistency)
    await insertRecord(
      "group_members",
      { ...newMember } as Record<string, unknown>,
      user.id
    );
    return memberId;
  };

  const removeGroupMember = async (memberId: string) => {
    if (!user) throw new Error("User must be logged in");

    // Immediate write
    await updateRecord(
      "group_members",
      memberId,
      {
        removed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      user.id
    );
  };

  const updateMemberShare = async (memberId: string, share: number) => {
    if (!user) throw new Error("User must be logged in");

    // Validate share value
    const validatedData = validate(getGroupMemberUpdateSchema(t), { share });

    // Immediate write
    await updateRecord(
      "group_members",
      memberId,
      {
        share: validatedData.share,
        updated_at: new Date().toISOString(),
      },
      user.id
    );
  };

  const updateAllShares = async (
    _groupId: string,
    shares: { memberId: string; share: number }[]
  ) => {
    if (!user) throw new Error("User must be logged in");

    // Update each member share immediately
    for (const { memberId, share } of shares) {
      await updateRecord(
        "group_members",
        memberId,
        {
          share,
          updated_at: new Date().toISOString(),
        },
        user.id
      );
    }
  };

  // Calculate group balances
  const getGroupBalance = async (groupId: string) => {
    const members = await db.group_members
      .filter((m) => m.group_id === groupId && !m.removed_at)
      .toArray();

    const transactions = await db.transactions
      .filter((t) => t.group_id === groupId && !t.deleted_at)
      .toArray();

    const totalExpenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const balances: Record<
      string,
      {
        userId: string; // This might be memberId for guests in a future refactor, but for now we need a unique key.
        // CAUTION: For guests user_id is null. We should use member.id as key for balances if possible,
        // but the UI currently expects userId.
        // Let's rely on member.id as the key in the record, but we need to check how it's consumed.
        // The consumption in GroupDetail uses member.user_id. This will break for guests.
        // We need to return a key that is unique.
        share: number;
        shouldPay: number;
        hasPaid: number;
        balance: number;
        displayName: string;
        avatarUrl?: string;
        isGuest: boolean;
      }
    > = {};

    const allProfiles = await db.profiles.toArray();
    const profileMap = new Map(allProfiles.map((p) => [p.id, p]));

    // Calculate what each member should pay based on share
    for (const member of members) {
      const shouldPay = (totalExpenses * member.share) / 100;

      // Calculate what they have paid
      // Logic update: check paid_by_member_id only
      const hasPaid = transactions
        .filter((t) => {
          if (t.type !== "expense") return false;
          return t.paid_by_member_id === member.id;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const profile = member.user_id
        ? profileMap.get(member.user_id)
        : undefined;
      let displayName = "Unknown User";

      if (member.is_guest && member.guest_name) {
        displayName = member.guest_name;
      } else if (profile?.full_name) {
        displayName = profile.full_name;
      } else if (profile?.email) {
        displayName = profile.email.split("@")[0];
      } else if (member.user_id === user?.id) {
        displayName = "You";
      } else if (member.user_id) {
        displayName = `User ${member.user_id.slice(0, 4)}`;
      }

      // We use member.user_id as key if exists, else member.id (prefixed? no, just member.id)
      // Ideally we should switch to using member.id everywhere as the primary key for members
      // but that refactor is large.
      // For now, if guest, use member.id. If user, use user.id (to match existing usages).
      const key = member.user_id || member.id;

      balances[key] = {
        userId: key,
        share: member.share,
        shouldPay,
        hasPaid,
        balance: hasPaid - shouldPay, // Fixed: Positive = owed money (Creditor), Negative = owes money (Debtor)
        displayName,
        avatarUrl: profile?.avatar_url,
        isGuest: !!member.is_guest,
      };
    }

    return {
      totalExpenses,
      balances,
      members: members.map((m) => ({
        ...m,
        displayName: m.is_guest ? m.guest_name : m.user_id ? "User" : "Unknown", // Simplified, expanded later or computed above
      })),
    };
  };

  return {
    groups: groups || [],
    isLoading: groups === undefined,
    createGroup,
    updateGroup,
    deleteGroup,
    addGroupMember,
    removeGroupMember,
    updateMemberShare,
    updateAllShares,
    getGroupBalance,
  };
}
