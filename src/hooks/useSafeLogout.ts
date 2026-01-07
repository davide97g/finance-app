import { useAuth } from "@/hooks/useAuth";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

export function useSafeLogout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const performLogout = useCallback(async () => {
    await signOut();
    navigate("/auth");
  }, [signOut, navigate]);

  const requestLogout = useCallback(
    (requireConfirmation = false) => {
      if (requireConfirmation) {
        setIsDialogOpen(true);
      } else {
        performLogout();
      }
    },
    [performLogout]
  );

  const confirmLogout = async () => {
    await performLogout();
    setIsDialogOpen(false);
  };

  const cancelLogout = () => {
    setIsDialogOpen(false);
  };

  return {
    handleLogout: requestLogout, // Expose as handleLogout for simplicity
    isDialogOpen,
    setIsDialogOpen, // Expose setter if needed
    confirmLogout,
    cancelLogout,
  };
}
