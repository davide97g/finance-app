import {
  ChevronUp,
  Layers,
  LayoutDashboard,
  PieChart,
  Receipt,
  Repeat,
  Settings,
  Squirrel,
  Tags,
  User2,
  Users,
} from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthProvider";
import { useOnlineSync } from "@/hooks/useOnlineSync";
import { useProfile } from "@/hooks/useProfiles";
import { generateInitials } from "@/lib/profileUtils";
import { cn } from "@/lib/utils";
import packageJson from "../../package.json";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOnline } = useOnlineSync();
  const { setOpenMobile } = useSidebar();
  const profile = useProfile(user?.id);

  const navigation = [
    { name: t("dashboard"), href: "/", icon: LayoutDashboard },
    { name: t("transactions"), href: "/transactions", icon: Receipt },
    { name: t("recurring"), href: "/recurring", icon: Repeat },
    { name: t("categories"), href: "/categories", icon: Tags },
    { name: t("contexts"), href: "/contexts", icon: Layers },
    { name: t("groups"), href: "/groups", icon: Users },
    { name: t("statistics"), href: "/statistics", icon: PieChart },
    { name: t("settings"), href: "/settings", icon: Settings },
  ];

  const handleProfileClick = () => {
    navigate("/profile");
    setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="pt-[calc(env(safe-area-inset-top)+1rem)]">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div
                className={cn(
                  "flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground",
                  !isOnline && "bg-destructive"
                )}
              >
                <Squirrel className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold">{t("app_title")}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {t("version_v", { version: packageJson.version })}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="pl-2">
        <SidebarMenu>
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.name}
                  onClick={() => setOpenMobile(false)}
                >
                  <Link to={item.href}>
                    <item.icon />
                    <span className="group-data-[collapsible=icon]:hidden">
                      {item.name}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-8">
                    {profile?.avatar_type === "photo" && profile?.avatar_url ? (
                      <AvatarImage
                        src={profile.avatar_url}
                        alt={profile?.full_name || user?.email || "User"}
                      />
                    ) : null}
                    <AvatarFallback className="text-xs">
                      {generateInitials(
                        profile?.full_name,
                        user?.email || profile?.email
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold">
                      {profile?.full_name ||
                        user?.email?.split("@")[0] ||
                        "User"}
                    </span>
                    <span className="truncate text-xs">{user?.email}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem onClick={handleProfileClick}>
                  <User2 className="mr-2 h-4 w-4" />
                  <span>{t("view_profile")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
