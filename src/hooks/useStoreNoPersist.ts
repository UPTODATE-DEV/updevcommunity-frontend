import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface Store {
  openLoginModal: boolean;
  setOpenLoginModal: (openLoginModal: boolean) => void;
  authLoading: boolean;
  setAuthLoading: (authLoading: boolean) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  editProfile: boolean;
  setEditProfile: (state: boolean) => void;
  openAddSeries: boolean;
  setToggleAddSeries: () => void;
  currentSeries: string | null;
  setCurrentSeries: (currentSeries: string | null) => void;
}

const useStoreNoPersist = create<Store>()(
  devtools((set) => ({
    openAddSeries: false,
    setToggleAddSeries: () => {
      set((state) => ({ openAddSeries: !state.openAddSeries }));
    },
    authLoading: false,
    setAuthLoading: (authLoading) => set({ authLoading }),
    loading: false,
    setLoading: (loading) => set({ loading }),
    openLoginModal: false,
    setOpenLoginModal: (openLoginModal) => set({ openLoginModal }),
    editProfile: false,
    setEditProfile: (editProfile: boolean) => {
      return set((state) => ({ ...state, editProfile }));
    },
    currentSeries: null,
    setCurrentSeries: (currentSeries: string | null) => {
      return set((state) => ({ ...state, currentSeries }));
    },
  }))
);

export default useStoreNoPersist;
