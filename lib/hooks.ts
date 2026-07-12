import { useDispatch, useSelector, useStore } from 'react-redux';
import type { AppDispatch, RootState, AppStore } from '@/lib/store';

// Pre-typed versions of the react-redux hooks — use these throughout the app.
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();
