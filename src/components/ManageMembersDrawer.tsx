import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthProvider";
import { useGroups, GroupWithMembers } from "@/hooks/useGroups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose,
} from "@/components/ui/drawer";
import { UserAvatar } from "@/components/UserAvatar";
import {
    Crown,
    UserMinus,
    AlertTriangle,
    UserPlus,
    Users,
    Copy,
    Check,
} from "lucide-react";

interface ManageMembersDrawerProps {
    group: GroupWithMembers | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ManageMembersDrawer({
    group,
    open,
    onOpenChange,
}: ManageMembersDrawerProps) {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { addGroupMember, removeGroupMember, updateAllShares } = useGroups();

    const [newMemberId, setNewMemberId] = useState("");
    const [newGuestName, setNewGuestName] = useState("");
    const [memberShares, setMemberShares] = useState<Record<string, number>>({});
    const [copiedId, setCopiedId] = useState(false);

    // Initialize member shares when group is available
    // Note: we'll handle this dynamically in the render or via useEffect if needed
    // using group.members directly for default values

    if (!group) return null;

    const totalShare = group.members.reduce(
        (sum, m) => sum + (memberShares[m.id] ?? m.share),
        0
    );
    const isShareValid = Math.abs(totalShare - 100) < 0.1;

    const handleAddMember = async () => {
        if (!newMemberId.trim()) return;
        try {
            await addGroupMember(group.id, newMemberId, false); // isGuest = false
            setNewMemberId("");
        } catch (error) {
            console.error("Failed to add member:", error);
            alert(t("error_occurred"));
        }
    };

    const handleAddGuest = async () => {
        if (!newGuestName.trim()) return;
        try {
            await addGroupMember(group.id, newGuestName, true); // isGuest = true
            setNewGuestName("");
        } catch (error) {
            console.error("Failed to add guest:", error);
            alert(t("error_occurred"));
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (confirm(t("confirm_delete_description"))) {
            await removeGroupMember(memberId);
        }
    };

    const handleSaveShares = async () => {
        const updates = Object.entries(memberShares).map(([memberId, share]) => ({
            memberId,
            share,
        }));
        await updateAllShares(group.id, updates);
        onOpenChange(false);
    };

    const copyMyId = () => {
        if (user?.id) {
            navigator.clipboard.writeText(user.id);
            setCopiedId(true);
            setTimeout(() => setCopiedId(false), 2000);
        }
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="h-[85vh] sm:h-auto">
                <DrawerHeader>
                    <DrawerTitle>{t("manage_members")}</DrawerTitle>
                    <DrawerDescription>{group.name}</DrawerDescription>
                </DrawerHeader>

                <div className="p-4 space-y-6 flex-1 overflow-y-auto">
                    {/* Add Member Tabs */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <UserPlus className="h-4 w-4" />
                            {t("add_member")}
                        </h3>
                        <Tabs defaultValue="invite" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="invite">{t("invite_user") || "Invite User"}</TabsTrigger>
                                <TabsTrigger value="guest">{t("add_guest") || "Add Guest"}</TabsTrigger>
                            </TabsList>

                            <TabsContent value="invite" className="space-y-3 pt-2">
                                <div className="bg-muted p-3 rounded-md text-xs text-muted-foreground flex items-center justify-between">
                                    <span>{t("share_id_hint") || "Ask for their User ID"}</span>
                                    <Button variant="ghost" size="sm" onClick={copyMyId} className="h-6 gap-1 text-xs">
                                        {copiedId ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                        {t("my_id") || "My ID"}
                                    </Button>
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder={t("enter_user_id")}
                                        value={newMemberId}
                                        onChange={(e) => setNewMemberId(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button onClick={handleAddMember} disabled={!newMemberId}>
                                        {t("add")}
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="guest" className="space-y-3 pt-2">
                                <div className="bg-muted p-3 rounded-md text-xs text-muted-foreground">
                                    <p>{t("guest_hint") || "Guests don't need an app account. You manage their expenses."}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder={t("guest_name") || "Guest Name (e.g. Mario)"}
                                        value={newGuestName}
                                        onChange={(e) => setNewGuestName(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button onClick={handleAddGuest} disabled={!newGuestName}>
                                        {t("add")}
                                    </Button>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Members List */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                {t("members")} ({group.members.length})
                            </h3>
                            <Badge variant={isShareValid ? "outline" : "destructive"}>
                                Total: {totalShare.toFixed(1)}%
                            </Badge>
                        </div>

                        <ScrollArea className="h-[200px] sm:h-[300px] pr-4">
                            <div className="space-y-3">
                                {group.members.map((member) => (
                                    <div
                                        key={member.id}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-card/50 gap-3"
                                    >
                                        {/* User Info */}
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            {member.is_guest ? (
                                                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold shrink-0">
                                                    {member.guest_name ? member.guest_name.substring(0, 2).toUpperCase() : "??"}
                                                </div>
                                            ) : (
                                                <UserAvatar userId={member.user_id || ""} showName={false} className="h-10 w-10 shrink-0" />
                                            )}

                                            <div className="min-w-0">
                                                <div className="font-medium flex items-center gap-2">
                                                    <span className="truncate">
                                                        {member.is_guest
                                                            ? member.guest_name
                                                            : member.displayName || (member.user_id === user?.id ? t("you") : member.user_id?.substring(0, 8))}
                                                    </span>
                                                    {member.is_guest && <Badge variant="secondary" className="text-[10px] h-5 px-1">{t("guest") || "Guest"}</Badge>}
                                                    {group.created_by === (member.user_id || "nocreator") && !member.is_guest && (
                                                        <Crown className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {member.is_guest ? t("managed_by_group") || "Local Member" : member.profile?.email || "App User"}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Controls */}
                                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground sm:hidden">Share:</span>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    value={memberShares[member.id] ?? member.share}
                                                    onChange={(e) =>
                                                        setMemberShares({
                                                            ...memberShares,
                                                            [member.id]: Number(e.target.value),
                                                        })
                                                    }
                                                    className="w-16 h-8 text-right"
                                                />
                                                <span className="text-sm">%</span>
                                            </div>

                                            {(member.user_id !== user?.id || member.is_guest) && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRemoveMember(member.id)}
                                                    className="text-destructive h-8 w-8 hover:bg-destructive/10"
                                                >
                                                    <UserMinus className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        {!isShareValid && (
                            <p className="text-sm text-destructive flex items-center gap-1 mt-2">
                                <AlertTriangle className="h-4 w-4" />
                                {t("shares_must_equal_100")}
                            </p>
                        )}
                    </div>
                </div>

                <DrawerFooter className="pt-2">
                    <Button onClick={handleSaveShares} disabled={!isShareValid}>
                        {t("save_changes") || "Save Changes"}
                    </Button>
                    <DrawerClose asChild>
                        <Button variant="outline">{t("close")}</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
