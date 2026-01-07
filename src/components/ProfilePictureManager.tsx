import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthProvider";
import { useProfile, useUpdateProfile } from "@/hooks/useProfiles";
import { supabase } from "@/lib/supabase";
import { generateInitials } from "@/lib/profileUtils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, User, Image } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import i18n from "@/i18n";

const AVATARS_BUCKET = "avatars";

type AvatarType = "initials" | "photo";

export const ProfilePictureManager = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const profile = useProfile(user?.id);
    const { updateProfile } = useUpdateProfile();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Initialize avatar_type from profile, default to 'initials' if not set
    const [avatarType, setAvatarType] = useState<AvatarType>(
        (profile?.avatar_type as AvatarType) || "initials"
    );
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(
        profile?.avatar_url || null
    );

    // Update preview URL when profile loads, but don't change avatar_type
    useEffect(() => {
        if (profile?.avatar_url) {
            setPreviewUrl(profile.avatar_url);
        } else {
            setPreviewUrl(null);
        }
    }, [profile?.avatar_url]);

    // Update avatar_type from profile when it loads
    useEffect(() => {
        if (profile?.avatar_type) {
            setAvatarType(profile.avatar_type as AvatarType);
        }
    }, [profile?.avatar_type]);

    const handleAvatarTypeChange = async (value: AvatarType) => {
        if (value === avatarType) return; // No change needed
        
        setAvatarType(value);
        setUploading(true);
        
        try {
            await updateProfile({
                avatar_type: value,
            });
        } catch (error) {
            console.error("[ProfilePicture] Failed to update avatar type:", error);
            toast.error(
                i18n.t("profile_avatar_type_error", {
                    defaultValue: "Failed to update preference"
                })
            );
            // Revert on error
            setAvatarType(profile?.avatar_type as AvatarType || "initials");
        } finally {
            setUploading(false);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast.error(
                i18n.t("profile_avatar_invalid_type", {
                    defaultValue: "Please select an image file"
                })
            );
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error(
                i18n.t("profile_avatar_too_large", {
                    defaultValue: "Image must be smaller than 5MB"
                })
            );
            return;
        }

        setUploading(true);

        try {
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);

            // Delete old avatar if exists
            if (profile?.avatar_url) {
                const oldPath = profile.avatar_url.split("/").pop();
                if (oldPath) {
                    await supabase.storage
                        .from(AVATARS_BUCKET)
                        .remove([`${user.id}/${oldPath}`]);
                }
            }

            // Upload new avatar
            const fileExt = file.name.split(".").pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from(AVATARS_BUCKET)
                .upload(fileName, file, {
                    upsert: true,
                });

            if (uploadError) {
                throw uploadError;
            }

            // Get public URL
            const { data } = supabase.storage
                .from(AVATARS_BUCKET)
                .getPublicUrl(fileName);

            if (!data.publicUrl) {
                throw new Error("Failed to get public URL");
            }

            // Update profile with both avatar_url and ensure avatar_type is 'photo'
            await updateProfile({
                avatar_url: data.publicUrl,
                avatar_type: "photo",
            });

            setPreviewUrl(data.publicUrl);
            setAvatarType("photo");

            toast.success(
                i18n.t("profile_avatar_uploaded", {
                    defaultValue: "Photo uploaded successfully"
                })
            );
        } catch (error) {
            console.error("[ProfilePicture] Upload error:", error);
            toast.error(
                i18n.t("profile_avatar_upload_error", {
                    defaultValue: "Failed to upload photo"
                })
            );
            setPreviewUrl(profile?.avatar_url || null);
        } finally {
            setUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleRemovePhoto = async () => {
        if (!user || !profile?.avatar_url) return;

        setUploading(true);
        try {
            // Delete from storage
            const oldPath = profile.avatar_url.split("/").pop();
            if (oldPath) {
                await supabase.storage
                    .from(AVATARS_BUCKET)
                    .remove([`${user.id}/${oldPath}`]);
            }

            // Update profile - remove avatar_url but keep avatar_type as 'photo' if user wants to upload again
            // Or switch to initials if they prefer
            await updateProfile({
                avatar_url: undefined,
            });

            setPreviewUrl(null);

            toast.success(
                i18n.t("profile_avatar_removed", {
                    defaultValue: "Photo removed successfully"
                })
            );
        } catch (error) {
            console.error("[ProfilePicture] Remove error:", error);
            toast.error(
                i18n.t("profile_avatar_remove_error", {
                    defaultValue: "Failed to remove photo"
                })
            );
        } finally {
            setUploading(false);
        }
    };

    const initials = generateInitials(profile?.full_name, user?.email || profile?.email);

    return (
        <div className="space-y-4">
            <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20 shrink-0">
                    {avatarType === "photo" && previewUrl ? (
                        <AvatarImage src={previewUrl} alt={t("profile_picture", { defaultValue: "Profile picture" })} />
                    ) : null}
                    <AvatarFallback className="text-lg font-semibold">
                        {initials}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                    <div>
                        <Label className="text-sm font-medium mb-2 block">
                            {t("profile_picture", { defaultValue: "Profile Picture" })}
                        </Label>
                        <div className="inline-flex rounded-lg border border-input bg-background p-1" role="group">
                            <button
                                type="button"
                                onClick={() => handleAvatarTypeChange("initials")}
                                disabled={uploading}
                                className={cn(
                                    "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                                    avatarType === "initials"
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                            >
                                <User className="h-4 w-4" />
                                <span>{t("use_initials", { defaultValue: "Initials" })}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleAvatarTypeChange("photo")}
                                disabled={uploading}
                                className={cn(
                                    "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                                    avatarType === "photo"
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                            >
                                <Image className="h-4 w-4" />
                                <span>{t("use_photo", { defaultValue: "Photo" })}</span>
                            </button>
                        </div>
                    </div>

                    {avatarType === "photo" && (
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="flex-1"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {t("uploading", { defaultValue: "Uploading..." })}
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="mr-2 h-4 w-4" />
                                            {previewUrl
                                                ? t("change_photo", { defaultValue: "Change Photo" })
                                                : t("upload_photo", { defaultValue: "Upload Photo" })}
                                        </>
                                    )}
                                </Button>
                                {previewUrl && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleRemovePhoto}
                                        disabled={uploading}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <p className="text-xs text-muted-foreground">
                                {t("profile_picture_hint", {
                                    defaultValue: "Upload a photo (max 5MB)"
                                })}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
